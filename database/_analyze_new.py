import csv

with open('chinese Pricing.csv', 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()
print(f'Total lines: {len(lines)}')

# Find CN2602217
for i, line in enumerate(lines):
    if 'CN2602217' in line:
        cols = line.strip().split('\t')
        print(f'Found at line {i}, ref={cols[2]}, total_cols={len(cols)}')
        break

# Count new data lines from CN2602217 onwards
count = 0
first_ref = None
last_ref = None
refs = []
for i, line in enumerate(lines):
    cols = line.strip().split('\t')
    if len(cols) > 2 and cols[2] >= 'CN2602217':
        count += 1
        if not first_ref:
            first_ref = cols[2]
        last_ref = cols[2]
        refs.append(cols[2])

print(f'New data rows: {count}')
print(f'Range: {first_ref} ~ {last_ref}')

# Check if any of these refs already exist in DB
import pymysql
conn = pymysql.connect(host='localhost', user='root', password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM enquiry')
print(f'\nCurrent enquiry count: {cur.fetchone()[0]}')
cur.execute("SELECT ref_number FROM enquiry WHERE ref_number >= 'CN2602217' ORDER BY ref_number LIMIT 5")
existing = cur.fetchall()
print(f'Existing refs >= CN2602217: {[r[0] for r in existing]}')

# Check max ref
cur.execute('SELECT MAX(ref_number) FROM enquiry')
print(f'Max ref in DB: {cur.fetchone()[0]}')

# Check offices
for office in ['PARTEX AEROMARINE LOGISTICS PVT LTD', 'DYNAMEX FREIGHT LTD', 'HAWK FREIGHT SERVICES']:
    cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (office.upper(),))
    r = cur.fetchone()
    print(f'Office "{office}": id={r[0] if r else "NOT FOUND"}')

# Check PICs
for pic in ['BIKASH BHATTACHARJEE', 'GULSHAN', 'MICHAEL MWANGI', 'CRYSTAL LABORTE']:
    cur.execute('SELECT id FROM dict_sales_pic WHERE UPPER(name) = %s', (pic.upper(),))
    r = cur.fetchone()
    print(f'PIC "{pic}": id={r[0] if r else "NOT FOUND"}')

conn.close()

# Show last 5 data lines
print('\nLast 5 data lines:')
for i in range(len(lines)-6, len(lines)):
    l = lines[i].strip()
    if l:
        cols = l.split('\t')
        ref = cols[2] if len(cols) > 2 else '?'
        print(f'  Line {i}: ref={ref}, cols={len(cols)}')
