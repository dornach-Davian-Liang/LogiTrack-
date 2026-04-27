#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro — 增量迁移 + 状态同步
功能:
  Phase 1: 清除 enquiry.id > DEMO_CUTOFF 的 demo 数据（如有）
  Phase 2: 增量导入 chinese Pricing copy.csv 中 ref >= INCREMENTAL_START 的新数据
  Phase 3: 对比 CSV 与 DB 中 2026 年记录的状态，同步更新
"""

import csv
import os
import sys
import importlib.util
import traceback
from datetime import datetime
from collections import defaultdict

try:
    import pymysql
    from dateutil import parser as date_parser
except ImportError:
    print("请安装依赖: pip install pymysql python-dateutil")
    sys.exit(1)

# ============================================================
# 配置
# ============================================================
DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root', 'password': 'ldf123',
    'database': 'logitrack', 'charset': 'utf8mb4',
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, 'chinese Pricing copy.csv')

DEMO_CUTOFF = 18968          # enquiry.id > 此值 = demo 数据
INCREMENTAL_START = 'CN2604038'  # ref >= 此值 = 新增数据
STATUS_SYNC_YEAR = 2026      # issue_date >= 此年的记录做状态同步

# 列索引 (同 migrate_v4.py)
C_ENQUIRY_DATE       = 0
C_ISSUE_DATE         = 1
C_REFERENCE          = 2
C_PRODUCT            = 3
C_STATUS             = 4
C_SALES_COUNTRY      = 6
C_SALES_OFFICE       = 7
C_SALES_PIC          = 8
C_BOOKING_CONFIRMED  = 30
C_REMARK             = 31
C_REJECTED_REASON    = 32
C_ACTUAL_REASON      = 33

# 零宽字符
import re
_INVISIBLE = re.compile(r'[\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad\xa0]')


def clean(val):
    if val is None:
        return ''
    s = str(val).replace('\r\n', ' ').replace('\n', ' ').strip()
    s = _INVISIBLE.sub('', s)
    return re.sub(r'\s+', ' ', s).strip()


def upper(val):
    return clean(val).upper()


def map_status(cols):
    """复制 migrate_v4.py 的状态映射逻辑"""
    status_raw = upper(cols[C_STATUS])
    booking_raw = upper(cols[C_BOOKING_CONFIRMED])

    if status_raw in ('CANCELLED', 'CANCELED'):
        return 'Cancelled'
    elif status_raw == 'QUOTED':
        if booking_raw == 'YES':
            return 'Secured'
        elif booking_raw == 'REJECTED':
            return 'Lost'
        elif booking_raw == 'INVALID':
            return 'Cancelled'
        else:
            return 'Quoted & Pending'
    else:
        return 'New'


def load_csv():
    """读取 CSV 并返回 (header, rows)。csv.reader 处理多行引号字段。"""
    with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter='\t')
        header = next(reader)
        rows = []
        for row in reader:
            while len(row) < 34:
                row.append('')
            rows.append(row)
    return header, rows


def load_migrator(conn, cur):
    """动态加载 migrate_v4.py 的 MigratorV4 类"""
    spec = importlib.util.spec_from_file_location(
        "migrate_v4", os.path.join(SCRIPT_DIR, "migrate_v4.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    migrator = mod.MigratorV4()
    migrator.conn = conn
    migrator.cur = cur
    migrator.load_caches()
    migrator.load_mappings()
    return migrator


# ============================================================
# Phase 1: 清除 Demo 数据
# ============================================================
def phase1_clean_demo(conn, cur):
    print('=' * 60)
    print('Phase 1: 清除 Demo 数据 (id > %d)' % DEMO_CUTOFF)
    print('=' * 60)

    cur.execute('SELECT COUNT(*) FROM enquiry WHERE id > %s', (DEMO_CUTOFF,))
    demo_count = cur.fetchone()[0]

    if demo_count == 0:
        print('  无 demo 数据，跳过')
        return

    print(f'  待清除: {demo_count} 条 enquiry')

    # 按 FK 依赖删除
    child_tables = [
        ("DELETE opl FROM offer_price_line opl "
         "JOIN offer o ON opl.offer_id = o.id "
         "WHERE o.enquiry_id IN (SELECT id FROM enquiry WHERE id > %s)",
         'offer_price_line'),
        ("DELETE FROM offer WHERE enquiry_id IN (SELECT id FROM enquiry WHERE id > %s)",
         'offer'),
        ("DELETE FROM enquiry_pol WHERE enquiry_id IN (SELECT id FROM enquiry WHERE id > %s)",
         'enquiry_pol'),
        ("DELETE FROM enquiry_pod WHERE enquiry_id IN (SELECT id FROM enquiry WHERE id > %s)",
         'enquiry_pod'),
        ("DELETE FROM enquiry_container_line WHERE enquiry_id IN (SELECT id FROM enquiry WHERE id > %s)",
         'enquiry_container_line'),
        ("DELETE FROM enquiry WHERE id > %s",
         'enquiry'),
    ]

    for sql, table_name in child_tables:
        try:
            cur.execute(sql, (DEMO_CUTOFF,))
            print(f'  {table_name}: {cur.rowcount} rows deleted')
        except Exception as e:
            print(f'  {table_name}: skip ({e})')

    conn.commit()
    print('  ✅ Demo 数据清除完成')


# ============================================================
# Phase 2: 增量导入新数据
# ============================================================
def phase2_incremental_import(conn, cur, csv_rows, migrator):
    print('\n' + '=' * 60)
    print(f'Phase 2: 增量导入 (ref >= {INCREMENTAL_START})')
    print('=' * 60)

    # 收集新行
    new_rows = []
    for i, cols in enumerate(csv_rows):
        ref = clean(cols[C_REFERENCE])
        if ref and ref >= INCREMENTAL_START:
            new_rows.append((i + 2, cols, ref))  # i+2: 1-based + header

    print(f'  CSV 新行数: {len(new_rows)}')

    if not new_rows:
        print('  无新数据')
        return

    # 查询已存在的 ref
    all_new_refs = [r[2] for r in new_rows]
    placeholders = ','.join(['%s'] * len(all_new_refs))
    cur.execute(f'SELECT ref_number FROM enquiry WHERE ref_number IN ({placeholders})',
                tuple(all_new_refs))
    existing_refs = set(r[0] for r in cur.fetchall())
    print(f'  已存在于 DB: {len(existing_refs)}')

    success = 0
    skipped = 0
    errors = 0
    exceptions_to_insert = []

    for row_idx, cols, ref_number in new_rows:
        if ref_number in existing_refs:
            skipped += 1
            continue

        err_before = len(migrator.errors)

        try:
            migrator._process_row(row_idx, cols, ref_number)

            # 检查 _process_row 是否通过 self.errors 报告了错误
            if len(migrator.errors) > err_before:
                new_err = migrator.errors[-1]
                err_msg = new_err[2] if len(new_err) > 2 else str(new_err)
                exceptions_to_insert.append((
                    row_idx, ref_number, 'PROCESS_ERROR',
                    str(err_msg)[:1000],
                    '\t'.join(cols)
                ))
                errors += 1
            else:
                success += 1

        except Exception as e:
            conn.rollback()
            exceptions_to_insert.append((
                row_idx, ref_number, 'EXCEPTION',
                f'{type(e).__name__}: {str(e)[:900]}',
                '\t'.join(cols)
            ))
            errors += 1

        # 每 100 行 commit
        if (success + errors) % 100 == 0 and success > 0:
            conn.commit()

    conn.commit()

    # 写入 migration_exceptions
    if exceptions_to_insert:
        for csv_line, ref, etype, emsg, raw in exceptions_to_insert:
            try:
                cur.execute(
                    "INSERT INTO migration_exceptions "
                    "(csv_line, ref_number, error_type, error_msg, raw_data, status) "
                    "VALUES (%s, %s, %s, %s, %s, 'PENDING')",
                    (csv_line, ref, etype, emsg, raw)
                )
            except Exception as e:
                print(f'  ⚠️ 写入异常记录失败: {ref}: {e}')
        conn.commit()

    print(f'\n  结果:')
    print(f'    成功: {success}')
    print(f'    跳过(已存在): {skipped}')
    print(f'    失败: {errors}')
    if exceptions_to_insert:
        print(f'    异常记录已写入 migration_exceptions ({len(exceptions_to_insert)} 条)')
        for _, ref, etype, emsg, _ in exceptions_to_insert:
            print(f'      {ref}: [{etype}] {emsg[:80]}')


# ============================================================
# Phase 3: 状态同步
# ============================================================
def phase3_status_sync(conn, cur, csv_rows):
    print('\n' + '=' * 60)
    print(f'Phase 3: 状态同步 (issue_date >= {STATUS_SYNC_YEAR})')
    print('=' * 60)

    # 1. 从 CSV 构建 ref → (mapped_status, rejected_reason, actual_reason) 映射
    csv_status_map = {}
    for cols in csv_rows:
        ref = clean(cols[C_REFERENCE])
        if not ref:
            continue
        mapped = map_status(cols)
        rejected_reason = clean(cols[C_REJECTED_REASON])
        actual_reason = clean(cols[C_ACTUAL_REASON])
        csv_status_map[ref] = (mapped, rejected_reason, actual_reason)

    print(f'  CSV 状态映射: {len(csv_status_map)} 条')

    # 2. 从 DB 查询需要同步范围的记录
    cur.execute(
        "SELECT id, ref_number, status, lost_reason_text, cancelled_reason_text "
        "FROM enquiry "
        "WHERE enquiry_created_date >= %s",
        (f'{STATUS_SYNC_YEAR}-01-01',)
    )
    db_records = cur.fetchall()
    print(f'  DB 待对比记录: {len(db_records)} 条')

    # 3. 对比
    changes = []
    not_in_csv = 0

    for eid, ref, db_status, db_lost_text, db_cancelled_text in db_records:
        if ref not in csv_status_map:
            not_in_csv += 1
            continue

        csv_status, csv_rejected, csv_actual = csv_status_map[ref]

        if csv_status != db_status:
            reason_text = csv_rejected or csv_actual or None

            changes.append({
                'id': eid,
                'ref': ref,
                'old_status': db_status,
                'new_status': csv_status,
                'reason_text': reason_text,
            })

    print(f'  不在 CSV 中: {not_in_csv} 条 (跳过)')
    print(f'  状态变更: {len(changes)} 条')

    if not changes:
        print('  ✅ 无需更新')
        return

    # 统计变更方向
    direction_counts = defaultdict(int)
    for c in changes:
        direction_counts[f"{c['old_status']} → {c['new_status']}"] += 1

    print('\n  变更方向统计:')
    for direction, count in sorted(direction_counts.items(), key=lambda x: -x[1]):
        print(f'    {direction}: {count}')

    # 显示前 20 条变更明细
    print(f'\n  变更明细 (前 20 条):')
    for c in changes[:20]:
        reason = f' reason=[{c["reason_text"][:50]}]' if c['reason_text'] else ''
        print(f'    {c["ref"]}: {c["old_status"]} → {c["new_status"]}{reason}')
    if len(changes) > 20:
        print(f'    ... 共 {len(changes)} 条')

    # 4. 执行更新
    updated = 0
    for c in changes:
        try:
            if c['new_status'] == 'Lost':
                cur.execute(
                    "UPDATE enquiry SET status = %s, lost_reason_text = %s WHERE id = %s",
                    (c['new_status'], c['reason_text'], c['id'])
                )
            elif c['new_status'] == 'Cancelled':
                cur.execute(
                    "UPDATE enquiry SET status = %s, cancelled_reason_text = %s WHERE id = %s",
                    (c['new_status'], c['reason_text'], c['id'])
                )
            elif c['new_status'] in ('Secured', 'Quoted & Pending', 'New'):
                cur.execute(
                    "UPDATE enquiry SET status = %s WHERE id = %s",
                    (c['new_status'], c['id'])
                )
            updated += 1
        except Exception as e:
            print(f'    ⚠️ 更新失败 {c["ref"]}: {e}')

    conn.commit()
    print(f'\n  ✅ 更新完成: {updated}/{len(changes)} 条')


# ============================================================
# Main
# ============================================================
def main():
    print('=' * 60)
    print('LogiTrack Pro — 增量迁移 + 状态同步')
    print('=' * 60)

    # 连接
    conn = pymysql.connect(**DB_CONFIG, autocommit=False)
    cur = conn.cursor()
    print('✅ 数据库连接成功')

    # 加载 CSV
    print('\n📂 加载 CSV...')
    header, csv_rows = load_csv()
    print(f'  CSV 行数: {len(csv_rows)}')

    # Phase 1
    phase1_clean_demo(conn, cur)

    # Phase 2: 需要 MigratorV4
    print('\n📦 加载 MigratorV4 缓存...')
    migrator = load_migrator(conn, cur)
    phase2_incremental_import(conn, cur, csv_rows, migrator)

    # Phase 3
    phase3_status_sync(conn, cur, csv_rows)

    # 最终验证
    print('\n' + '=' * 60)
    print('最终验证')
    print('=' * 60)

    cur.execute('SELECT COUNT(*) FROM enquiry')
    print(f'  Total enquiry: {cur.fetchone()[0]}')

    cur.execute(
        "SELECT COUNT(*) FROM enquiry e "
        "LEFT JOIN dict_sales_pic p ON e.sales_pic_id=p.id "
        "WHERE e.sales_pic_id IS NOT NULL AND p.id IS NULL")
    print(f'  FK PIC dangling: {cur.fetchone()[0]}')

    cur.execute(
        "SELECT COUNT(*) FROM enquiry e "
        "LEFT JOIN dict_sales_office o ON e.sales_office_id=o.id "
        "WHERE e.sales_office_id IS NOT NULL AND o.id IS NULL")
    print(f'  FK Office dangling: {cur.fetchone()[0]}')

    cur.execute("SELECT COUNT(*) FROM migration_exceptions WHERE status='PENDING'")
    print(f'  Pending exceptions: {cur.fetchone()[0]}')

    cur.execute("SELECT status, COUNT(*) FROM enquiry GROUP BY status ORDER BY COUNT(*) DESC")
    print('\n  状态分布:')
    for r in cur.fetchall():
        print(f'    {r[0]}: {r[1]}')

    conn.close()
    print('\n✅ 全部完成!')


if __name__ == '__main__':
    main()
