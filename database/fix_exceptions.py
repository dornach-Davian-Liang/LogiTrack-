"""
补录 3 个 Office + 4 个 PIC，然后重新处理 migration_exceptions 中的 9 条 PENDING 记录
"""
import pymysql
import csv
import os
import sys
import re
from datetime import datetime

DB = dict(host='localhost', user='root', password='ldf123', database='logitrack', charset='utf8mb4')

def main():
    conn = pymysql.connect(**DB, autocommit=False)
    cur = conn.cursor()

    # ================================================================
    # Step 1: 添加 3 个新 Office
    # ================================================================
    print('='*60)
    print('Step 1: 添加 Office')
    print('='*60)

    new_offices = [
        ('PARTEX AEROMARINE LOGISTICS PVT LTD', 'OT'),  # Bangladesh -> OTHERS
        ('DYNAMEX FREIGHT LTD', 'OT'),                    # Kenya -> OTHERS
        ('HAWK FREIGHT SERVICES', 'OT'),                   # Philippines -> OTHERS
    ]

    for office_name, country_code in new_offices:
        cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (office_name.upper(),))
        row = cur.fetchone()
        if row:
            print(f'  already exists: {office_name} (id={row[0]})')
        else:
            # name_norm = uppercase normalized, code = abbreviation
            name_norm = office_name.upper().strip()
            # Generate a short code from initials
            code = ''.join(w[0] for w in office_name.split() if w)[:10]
            # Ensure unique code
            cur.execute('SELECT id FROM dict_sales_office WHERE code = %s', (code,))
            if cur.fetchone():
                code = code + str(len(code))
            cur.execute('''INSERT INTO dict_sales_office (name, name_norm, code, sales_country_code, is_active)
                           VALUES (%s, %s, %s, %s, 1)''',
                        (office_name, name_norm, code, country_code))
            print(f'  + {office_name} (id={cur.lastrowid})')

    conn.commit()

    # ================================================================
    # Step 2: 添加 4 个新 PIC (关联到对应 Office)
    # ================================================================
    print('\n' + '='*60)
    print('Step 2: 添加 PIC')
    print('='*60)

    new_pics = [
        ('BIKASH BHATTACHARJEE', 'PARTEX AEROMARINE LOGISTICS PVT LTD'),
        ('GULSHAN', 'PARTEX AEROMARINE LOGISTICS PVT LTD'),
        ('MICHAEL MWANGI', 'DYNAMEX FREIGHT LTD'),
        ('CRYSTAL LABORTE', 'HAWK FREIGHT SERVICES'),
    ]

    for pic_name, office_name in new_pics:
        cur.execute('SELECT id FROM dict_sales_pic WHERE UPPER(name) = %s', (pic_name.upper(),))
        row = cur.fetchone()
        if row:
            print(f'  already exists: {pic_name} (id={row[0]})')
            # Ensure office association is correct
            cur.execute('SELECT o.name FROM dict_sales_pic p JOIN dict_sales_office o ON p.sales_office_id=o.id WHERE p.id=%s', (row[0],))
            orow = cur.fetchone()
            if orow and orow[0].upper() != office_name.upper():
                cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (office_name.upper(),))
                oid = cur.fetchone()
                if oid:
                    cur.execute('UPDATE dict_sales_pic SET sales_office_id = %s WHERE id = %s', (oid[0], row[0]))
                    print(f'    -> updated office: {orow[0]} -> {office_name}')
        else:
            cur.execute('SELECT id, sales_country_code FROM dict_sales_office WHERE UPPER(name) = %s', (office_name.upper(),))
            orow = cur.fetchone()
            if not orow:
                print(f'  !! Office {office_name} not found, skip {pic_name}')
                continue
            office_id, country_code = orow
            cur.execute('''INSERT INTO dict_sales_pic (name, sales_country_code, sales_office_id, is_active)
                           VALUES (%s, %s, %s, 1)''',
                        (pic_name, country_code, office_id))
            print(f'  + {pic_name} (id={cur.lastrowid}, office={office_name})')

    conn.commit()

    # ================================================================
    # Step 3: 重新处理 migration_exceptions 中的 PENDING 记录
    # ================================================================
    print('\n' + '='*60)
    print('Step 3: Retry PENDING exceptions')
    print('='*60)

    cur.execute("SELECT id, csv_line, ref_number, raw_data FROM migration_exceptions WHERE status = 'PENDING'")
    pending = cur.fetchall()
    print(f'  PENDING count: {len(pending)}')

    if not pending:
        print('  Nothing to do')
        conn.close()
        return

    # Import MigratorV4 from migrate_v4.py
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import importlib.util
    spec = importlib.util.spec_from_file_location("migrate_v4",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "migrate_v4.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)

    migrator = m.MigratorV4()
    migrator.conn = conn
    migrator.cur = cur
    migrator.load_caches()
    migrator.load_mappings()

    # Process each pending exception
    success = 0
    still_failed = 0

    for exc_id, csv_line, ref_number, raw_data in pending:
        print(f'\n  [{ref_number}] (exception id={exc_id})')

        # Check if ref already exists
        cur.execute('SELECT id FROM enquiry WHERE ref_number = %s', (ref_number,))
        if cur.fetchone():
            cur.execute("UPDATE migration_exceptions SET status = 'RESOLVED', resolved_at = NOW(), resolution = 'Already exists in DB' WHERE id = %s", (exc_id,))
            print(f'    -> Already exists, marked RESOLVED')
            success += 1
            continue

        # Parse the raw_data (tab-separated)
        cols = raw_data.split('\t')
        # Pad to 34 cols like migrate_v4 does
        while len(cols) < 34:
            cols.append('')

        # Track errors before and after
        err_before = len(migrator.errors)

        try:
            migrator._process_row(csv_line, cols, ref_number)
            conn.commit()

            # Check if _process_row added an error (it returns early on error)
            if len(migrator.errors) > err_before:
                new_err = migrator.errors[-1]
                err_msg = new_err[2] if len(new_err) > 2 else str(new_err)
                cur.execute("UPDATE migration_exceptions SET status = 'FAILED', resolved_at = NOW(), resolution = %s WHERE id = %s",
                            (f'Still failing: {err_msg}'[:500], exc_id))
                print(f'    X Still failed: {err_msg}')
                still_failed += 1
            else:
                cur.execute("UPDATE migration_exceptions SET status = 'RESOLVED', resolved_at = NOW(), resolution = 'Auto-resolved after adding offices/PICs' WHERE id = %s", (exc_id,))
                print(f'    + Imported successfully')
                success += 1

        except Exception as e:
            conn.rollback()
            cur.execute("UPDATE migration_exceptions SET status = 'FAILED', resolved_at = NOW(), resolution = %s WHERE id = %s",
                        (str(e)[:500], exc_id))
            print(f'    X Exception: {e}')
            still_failed += 1

    conn.commit()

    print(f'\n' + '='*60)
    print(f'Result: success={success}, still_failed={still_failed}')
    print('='*60)

    # Final verification
    cur.execute('SELECT COUNT(*) FROM enquiry')
    print(f'Total enquiries: {cur.fetchone()[0]}')
    cur.execute("SELECT COUNT(*) FROM migration_exceptions WHERE status = 'PENDING'")
    print(f'Remaining PENDING: {cur.fetchone()[0]}')
    cur.execute("SELECT COUNT(*) FROM migration_exceptions WHERE status = 'RESOLVED'")
    print(f'RESOLVED: {cur.fetchone()[0]}')
    cur.execute("SELECT COUNT(*) FROM migration_exceptions WHERE status = 'FAILED'")
    print(f'FAILED: {cur.fetchone()[0]}')

    conn.close()

if __name__ == '__main__':
    main()
