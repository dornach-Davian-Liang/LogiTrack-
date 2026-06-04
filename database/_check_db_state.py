"""检查数据库当前状态"""
import pymysql

conn = pymysql.connect(host='localhost', port=3306, user='root', password='ldf123',
                       database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# Port count
cur.execute('SELECT COUNT(*) FROM port')
print(f'Ports: {cur.fetchone()[0]}')

# Container types
cur.execute('SELECT container_code, container_name FROM container_types ORDER BY container_code')
rows = cur.fetchall()
print(f'\nContainer types ({len(rows)}):')
for r in rows:
    print(f'  {r[0]}: {r[1]}')

# SHENZHEN office
cur.execute("SELECT id, name, code, name_norm FROM dict_sales_office WHERE name LIKE '%%SHENZHEN%%'")
print(f'\nSHENZHEN offices: {cur.fetchall()}')

# Sales offices count
cur.execute('SELECT COUNT(*) FROM dict_sales_office')
print(f'\nSales offices total: {cur.fetchone()[0]}')

# Sales PICs count
cur.execute('SELECT COUNT(*) FROM dict_sales_pic')
print(f'Sales PICs total: {cur.fetchone()[0]}')

# Check NA PIC
cur.execute("SELECT id, name FROM dict_sales_pic WHERE name = 'NA'")
print(f'NA PIC: {cur.fetchall()}')

# Countries count
cur.execute('SELECT COUNT(*) FROM country')
print(f'Countries: {cur.fetchone()[0]}')

# Enquiry count
cur.execute('SELECT COUNT(*) FROM enquiry')
print(f'Enquiries: {cur.fetchone()[0]}')

# Check key offices
print('\n--- Key office checks ---')
offices_to_check = [
    'ZIEGLER FRANCE', 'ZIEGLER XIAMEN', 'LEX ULUSLARARASI', 'GUANGZHOU MINTONG TRADING',
    'ZIEGLER WARRINGTON', 'ZIEGLER CAPETOWN', 'PAKISTAN CARGO SERVICE', 'CELERCO',
    'PACIFIC ANCHOR LINE', 'ZIEGLER NEWPORT', 'SAMUDERA', 'WEST COAST AVIATION',
    'STARPOWER EUROPE AG', 'ZIEGLER HONG KONG', 'ZIEGLER JOHANNESBURG',
    'ZIEGLER BELGIUM', 'ZIEGLER NETHERLANDS', 'VAN LOGISTICS BGD',
    'UTC MEDITERRANEAN SRLU', 'QUALITY', 'REXCARGO',
]
for name in offices_to_check:
    cur.execute('SELECT id, name FROM dict_sales_office WHERE UPPER(name) = %s', (name.upper(),))
    r = cur.fetchone()
    status = f'id={r[0]} name={r[1]}' if r else 'NOT FOUND'
    print(f'  [{name}]: {status}')

# Check sales_country codes
print('\n--- Sales country codes ---')
cur.execute('SELECT code, name FROM dict_sales_country ORDER BY code')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

# Check mapping file column headers
print('\n--- Mapping file headers ---')
import csv, os, glob
data_dir = r'C:\Users\Administrator\Desktop\data'
for pattern in ['unmapped_*.csv']:
    for f in sorted(glob.glob(os.path.join(data_dir, pattern))):
        with open(f, 'r', encoding='utf-8-sig') as fh:
            reader = csv.DictReader(fh)
            print(f'  {os.path.basename(f)}: {reader.fieldnames}')

conn.close()
