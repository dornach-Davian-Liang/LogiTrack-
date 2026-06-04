"""
M31 异常修复: 添加截图中的 Office/PIC 主数据，然后重试 3 条 PENDING migration_exceptions
对应 ref: CN2604039-A, CN2604154-S, CN2604249-A
"""
import pymysql, os, sys, importlib.util

DB = dict(host='localhost', user='root', password='ldf123', database='logitrack', charset='utf8mb4')


def gen_code(name, cur):
    """从名称首字母生成唯一 code"""
    base = ''.join(w[0] for w in name.split() if w).upper()[:10]
    code = base
    i = 2
    while True:
        cur.execute('SELECT id FROM dict_sales_office WHERE code = %s', (code,))
        if not cur.fetchone():
            return code
        code = f'{base}{i}'
        i += 1


def ensure_office(cur, name, country_code):
    """幂等地创建 office，返回 office_id"""
    cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (name.upper(),))
    r = cur.fetchone()
    if r:
        print(f'  [Office] 已存在 id={r[0]}: {name}')
        return r[0]
    name_norm = name.upper().strip()
    code = gen_code(name, cur)
    cur.execute(
        'INSERT INTO dict_sales_office (name, name_norm, code, sales_country_code, is_active) VALUES (%s,%s,%s,%s,1)',
        (name, name_norm, code, country_code)
    )
    oid = cur.lastrowid
    print(f'  [Office] 新增 id={oid} code={code}: {name}')
    return oid


def ensure_pic(cur, pic_name, office_id, country_code):
    """幂等地创建 PIC，返回 pic_id"""
    cur.execute('SELECT id FROM dict_sales_pic WHERE UPPER(name) = %s AND sales_office_id = %s',
                (pic_name.upper(), office_id))
    r = cur.fetchone()
    if r:
        print(f'  [PIC]    已存在 id={r[0]}: {pic_name}')
        return r[0]
    cur.execute(
        'INSERT INTO dict_sales_pic (name, sales_country_code, sales_office_id, is_active) VALUES (%s,%s,%s,1)',
        (pic_name, country_code, office_id)
    )
    pid = cur.lastrowid
    print(f'  [PIC]    新增 id={pid}: {pic_name} -> office_id={office_id}')
    return pid


def main():
    conn = pymysql.connect(**DB, autocommit=False)
    cur = conn.cursor()

    print('=' * 60)
    print('Step 1: 添加 Office 主数据 (来自截图)')
    print('=' * 60)

    # country code 映射: AGENTS->AG, GERMANY->DE, UK->GB
    # 截图中全部 office 及其国家
    offices_from_screenshot = [
        ('ATLAS LOGISTICS PVT LTD',                       'AG'),
        ('ZIEGLER GERMANY',                               'DE'),
        ('ZIEGLER FELIXSTOWE',                            'GB'),
        ('SOUTH ASIA SHIPPING & LOGISTICS (PVT.) LIMITED', 'AG'),
        ('HECNY FRANCE',                                  'AG'),
        ('PT FIDO',                                       'AG'),
        ('PT SILKARGO INDONESIA',                         'AG'),
    ]

    office_id_map = {}
    for office_name, cc in offices_from_screenshot:
        oid = ensure_office(cur, office_name, cc)
        office_id_map[office_name] = oid

    conn.commit()

    print('\n' + '=' * 60)
    print('Step 2: 添加 PIC 主数据 (来自截图)')
    print('=' * 60)

    # 截图中全部 PIC 及其对应 office
    pics_from_screenshot = [
        ('PREMCHANDRA GUPTA',      'ATLAS LOGISTICS PVT LTD'),
        ('THOMAS SCHRODER',        'ZIEGLER GERMANY'),
        ('ASHLEY HARRIS',          'ZIEGLER FELIXSTOWE'),
        ('MEHAK RAZAAQ',           'SOUTH ASIA SHIPPING & LOGISTICS (PVT.) LIMITED'),
        ('SYLVAIN CHIRAT',         'HECNY FRANCE'),
        ('BERND STEZYCKI',         'ZIEGLER GERMANY'),
        ('MAULANA SAPTAJI',        'PT FIDO'),
        ('ARIN PUTRI ADIWARDANI',  'PT SILKARGO INDONESIA'),
    ]

    for pic_name, office_name in pics_from_screenshot:
        oid = office_id_map.get(office_name)
        if oid is None:
            print(f'  !! office {office_name} not in map, skip {pic_name}')
            continue
        # Get the country code for this office
        cur.execute('SELECT sales_country_code FROM dict_sales_office WHERE id = %s', (oid,))
        row = cur.fetchone()
        cc = row[0] if row else 'AG'
        ensure_pic(cur, pic_name, oid, cc)

    conn.commit()

    print('\n' + '=' * 60)
    print('Step 3: Retry PENDING migration_exceptions')
    print('=' * 60)

    cur.execute("SELECT id, csv_line, ref_number, raw_data FROM migration_exceptions WHERE status = 'PENDING'")
    pending = cur.fetchall()
    print(f'  PENDING 记录数: {len(pending)}')
    if not pending:
        print('  无需处理')
        conn.close()
        return

    # Load MigratorV4
    this_dir = os.path.dirname(os.path.abspath(__file__))
    spec = importlib.util.spec_from_file_location(
        'migrate_v4', os.path.join(this_dir, 'migrate_v4.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    migrator = mod.MigratorV4()
    migrator.conn = conn
    migrator.cur = cur
    migrator.load_caches()
    migrator.load_mappings()

    success = 0
    still_failed = 0

    for exc_id, csv_line, ref_number, raw_data in pending:
        print(f'\n  处理 [{ref_number}] (exception id={exc_id})')

        # Skip if already imported
        cur.execute('SELECT id FROM enquiry WHERE ref_number = %s', (ref_number,))
        if cur.fetchone():
            cur.execute(
                "UPDATE migration_exceptions SET status='RESOLVED', resolved_at=NOW(), "
                "resolution='Already exists in DB' WHERE id=%s", (exc_id,))
            conn.commit()
            print(f'    -> 已存在于DB，标记 RESOLVED')
            success += 1
            continue

        # Parse raw_data as tab-separated row
        cols = raw_data.split('\t')
        while len(cols) < 34:
            cols.append('')

        err_before = len(migrator.errors)
        try:
            migrator._process_row(csv_line, cols, ref_number)
            conn.commit()
        except Exception as e:
            conn.rollback()
            cur.execute(
                "UPDATE migration_exceptions SET status='FAILED', resolved_at=NOW(), "
                "resolution=%s WHERE id=%s",
                (f'Exception: {e}'[:500], exc_id))
            conn.commit()
            print(f'    X Exception: {e}')
            still_failed += 1
            continue

        if len(migrator.errors) > err_before:
            new_err = migrator.errors[-1]
            err_msg = new_err[2] if len(new_err) > 2 else str(new_err)
            cur.execute(
                "UPDATE migration_exceptions SET status='FAILED', resolved_at=NOW(), "
                "resolution=%s WHERE id=%s",
                (f'Still failing: {err_msg}'[:500], exc_id))
            conn.commit()
            print(f'    X 仍然失败: {err_msg}')
            still_failed += 1
        else:
            cur.execute(
                "UPDATE migration_exceptions SET status='RESOLVED', resolved_at=NOW(), "
                "resolved_by='fix_m31.py', resolution='Auto-resolved after adding offices/PICs' "
                "WHERE id=%s", (exc_id,))
            conn.commit()
            print(f'    ✅ 成功导入!')
            success += 1

    print(f'\n结果: 成功={success}, 仍失败={still_failed}')

    # Final stats
    cur.execute('SELECT COUNT(*) FROM enquiry')
    print(f'\nTotal enquiry: {cur.fetchone()[0]}')
    cur.execute("SELECT COUNT(*) FROM migration_exceptions WHERE status='PENDING'")
    print(f'Pending exceptions: {cur.fetchone()[0]}')
    cur.execute('SELECT status, COUNT(*) FROM enquiry GROUP BY status ORDER BY COUNT(*) DESC')
    print('状态分布:')
    for row in cur.fetchall():
        print(f'  {row[0]}: {row[1]}')

    conn.close()
    print('\n✅ 完成!')


if __name__ == '__main__':
    main()
