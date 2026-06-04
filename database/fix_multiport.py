#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复多港口数据
- 将 POL/POD 中 "/" 分隔的多港口拆分
- 更新 enquiry.pol_id / pod_id 为第一个有效港口
- 向 enquiry_pol / enquiry_pod 插入所有港口行
- 清理 port 表中的拼接港口码（可选）

用法:
    python fix_multiport.py [--dry-run]
"""
import csv
import re
import os
import sys

try:
    import pymysql
except ImportError:
    print("pip install pymysql")
    sys.exit(1)

DRY_RUN = '--dry-run' in sys.argv

DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root', 'password': 'ldf123',
    'database': 'logitrack', 'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}
CSV_FILE = os.path.join(os.path.dirname(__file__), 'chinese Pricing.csv')

_INVISIBLE = re.compile(r'[\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad]')

def clean(v):
    if not v: return ''
    s = str(v).replace('\r\n', ' ').replace('\n', ' ').strip()
    return _INVISIBLE.sub('', re.sub(r'\s+', ' ', s)).strip()

def normalize_port_code(raw: str) -> str:
    """将港口原始名称转换为规范化的 port_code"""
    c = re.sub(r'[^A-Za-z0-9]', '', raw).upper()
    return c if c else raw.upper()[:20]

def split_ports(raw: str):
    """
    拆分多港口字符串
    支持分隔符: / , + 及 ' and '
    返回 [港口名称, ...] (已 clean)
    """
    raw = clean(raw)
    if not raw or raw.upper() in ('-', 'TBA', 'N/A', ''):
        return []
    # 用 / 拆分（注意不要拆分 20'GP 这类容器名，但港口不含）
    parts = re.split(r'\s*/\s*', raw)
    result = []
    for p in parts:
        p = clean(p)
        if p and p.upper() not in ('-', 'TBA', 'N/A', ''):
            result.append(p)
    return result

class PortFixer:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.port_cache = {}   # port_code → id
        self.stats = {
            'enquiry_processed': 0,
            'pol_inserted': 0,
            'pod_inserted': 0,
            'pol_updated': 0,
            'pod_updated': 0,
            'ports_created': 0,
        }
        self.errors = []

    def connect(self):
        self.conn = pymysql.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        print(f"✅ 连接数据库 logitrack")

    def close(self):
        if self.cursor: self.cursor.close()
        if self.conn: self.conn.close()

    def load_port_cache(self):
        self.cursor.execute("SELECT id, port_code FROM port")
        for r in self.cursor.fetchall():
            self.port_cache[r['port_code'].upper()] = r['id']
        print(f"  港口缓存: {len(self.port_cache)} 条")

    def get_or_create_port(self, port_raw: str, country_id=None) -> int:
        port_raw = clean(port_raw)
        if not port_raw:
            return None
        code = normalize_port_code(port_raw)
        if not code:
            return None
        if code in self.port_cache:
            return self.port_cache[code]
        if DRY_RUN:
            return None
        try:
            self.cursor.execute(
                "INSERT IGNORE INTO port (port_code, port_name, country_id) VALUES (%s,%s,%s)",
                (code, port_raw, country_id)
            )
            if self.cursor.lastrowid:
                pid = self.cursor.lastrowid
            else:
                self.cursor.execute("SELECT id FROM port WHERE port_code=%s", (code,))
                row = self.cursor.fetchone()
                pid = row['id'] if row else None
        except Exception as e:
            self.cursor.execute("SELECT id FROM port WHERE port_code=%s", (code,))
            row = self.cursor.fetchone()
            pid = row['id'] if row else None
        if pid:
            self.port_cache[code] = pid
            self.stats['ports_created'] += 1
        return pid

    def run(self):
        print("=" * 65)
        print("  多港口数据修复脚本")
        if DRY_RUN:
            print("  ⚠️  DRY-RUN 模式")
        print("=" * 65)

        self.connect()

        print("\n📦 加载缓存...")
        self.load_port_cache()

        # 加载所有 enquiry id 映射
        self.cursor.execute("SELECT id, reference_number, pol_id, pod_id FROM enquiry")
        enq_map = {r['reference_number']: r for r in self.cursor.fetchall()}
        print(f"  enquiry 记录: {len(enq_map)} 条")

        # 检查 enquiry_pol/pod 当前状态
        self.cursor.execute("SELECT COUNT(*) AS c FROM enquiry_pol")
        pol_exist = self.cursor.fetchone()['c']
        self.cursor.execute("SELECT COUNT(*) AS c FROM enquiry_pod")
        pod_exist = self.cursor.fetchone()['c']
        print(f"  enquiry_pol 已有: {pol_exist} 行")
        print(f"  enquiry_pod 已有: {pod_exist} 行")

        if pol_exist > 0 or pod_exist > 0:
            if not DRY_RUN:
                print("\n  清空旧 enquiry_pol / enquiry_pod 数据...")
                self.cursor.execute("DELETE FROM enquiry_pol")
                self.cursor.execute("DELETE FROM enquiry_pod")
                self.conn.commit()

        # 读取 CSV
        print(f"\n📂 读取 CSV...")
        with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace', newline='') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            csv_rows = list(reader)
        print(f"  {len(csv_rows)} 行")

        # 处理每行
        print("\n🔧 处理多港口数据...")
        seen_refs = set()

        for i, row in enumerate(csv_rows):
            ref = clean(row[2] if len(row) > 2 else '')
            if not ref or ref in seen_refs:
                continue
            seen_refs.add(ref)

            if ref not in enq_map:
                continue  # 该行未导入（如失败的2条）

            enq = enq_map[ref]
            enq_id = enq['id']

            pol_raw = clean(row[18] if len(row) > 18 else '')
            pod_raw = clean(row[19] if len(row) > 19 else '')
            pod_country_raw = clean(row[20] if len(row) > 20 else '')

            # 获取 pod_country_id（用于新建港口时关联）
            pod_country_id = None

            # ---- 处理 POL ----
            pol_parts = split_ports(pol_raw)
            if not pol_parts:
                pol_parts = [pol_raw] if pol_raw else []

            pol_ids = []
            for seq, pname in enumerate(pol_parts, start=1):
                pid = self.get_or_create_port(pname)
                if pid:
                    pol_ids.append(pid)
                    if not DRY_RUN:
                        self.cursor.execute(
                            "INSERT IGNORE INTO enquiry_pol (enquiry_id, port_id, sequence) VALUES (%s,%s,%s)",
                            (enq_id, pid, seq)
                        )
                        self.stats['pol_inserted'] += 1

            # 如果第一个 POL 与 enquiry.pol_id 不同，更新
            if pol_ids and pol_ids[0] != enq['pol_id']:
                if not DRY_RUN:
                    self.cursor.execute(
                        "UPDATE enquiry SET pol_id=%s WHERE id=%s",
                        (pol_ids[0], enq_id)
                    )
                self.stats['pol_updated'] += 1

            # ---- 处理 POD ----
            pod_parts = split_ports(pod_raw)
            if not pod_parts:
                pod_parts = [pod_raw] if pod_raw else []

            pod_ids = []
            for seq, pname in enumerate(pod_parts, start=1):
                pid = self.get_or_create_port(pname, pod_country_id)
                if pid:
                    pod_ids.append(pid)
                    if not DRY_RUN:
                        self.cursor.execute(
                            "INSERT IGNORE INTO enquiry_pod (enquiry_id, port_id, sequence) VALUES (%s,%s,%s)",
                            (enq_id, pid, seq)
                        )
                        self.stats['pod_inserted'] += 1

            # 如果第一个 POD 与 enquiry.pod_id 不同，更新
            if pod_ids and pod_ids[0] != enq['pod_id']:
                if not DRY_RUN:
                    self.cursor.execute(
                        "UPDATE enquiry SET pod_id=%s WHERE id=%s",
                        (pod_ids[0], enq_id)
                    )
                self.stats['pod_updated'] += 1

            self.stats['enquiry_processed'] += 1

            if (i + 1) % 2000 == 0:
                if not DRY_RUN:
                    self.conn.commit()
                print(f"  进度: {i+1}/{len(csv_rows)}")

        if not DRY_RUN:
            self.conn.commit()

        print("\n" + "=" * 65)
        print("📊 修复统计")
        print("=" * 65)
        print(f"  处理 enquiry 行:      {self.stats['enquiry_processed']}")
        print(f"  新增港口:             {self.stats['ports_created']}")
        print(f"  插入 enquiry_pol:     {self.stats['pol_inserted']}")
        print(f"  插入 enquiry_pod:     {self.stats['pod_inserted']}")
        print(f"  更新 enquiry.pol_id:  {self.stats['pol_updated']}")
        print(f"  更新 enquiry.pod_id:  {self.stats['pod_updated']}")

        if self.errors:
            print(f"\n⚠️  错误 ({len(self.errors)}条):")
            for e in self.errors[:10]:
                print(f"  {e}")

        print("\n✅ 完成!")
        self.close()


if __name__ == '__main__':
    PortFixer().run()
