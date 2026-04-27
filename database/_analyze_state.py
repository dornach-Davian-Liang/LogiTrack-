"""Quick analysis of current DB and CSV state"""
import csv, pymysql

conn = pymysql.connect(host='localhost', user='root', password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# DB state
cur.execute('SELECT COUNT(*) FROM enquiry')
print(f'Total enquiry: {cur.fetchone()[0]}')
cur.execute('SELECT COUNT(*) FROM enquiry WHERE id > 18968')
print(f'Demo (id>18968): {cur.fetchone()[0]}')
cur.execute('SELECT MIN(id), MAX(id), MIN(ref_number), MAX(ref_number) FROM enquiry WHERE id > 18968')
r = cur.fetchone()
print(f'Demo range: id={r[0]}..{r[1]}, ref={r[2]}..{r[3]}')
cur.execute('SELECT COUNT(*) FROM enquiry WHERE id <= 18968')
print(f'Real data (id<=18968): {cur.fetchone()[0]}')
cur.execute('SELECT MAX(ref_number) FROM enquiry WHERE id <= 18968')
print(f'Max ref in real data: {cur.fetchone()[0]}')

# CSV state
with open('chinese Pricing copy.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    header = next(reader)
    all_rows = list(reader)
print(f'\nCSV total rows: {len(all_rows)}')

new_count = 0
for cols in all_rows:
    while len(cols) < 34:
        cols.append('')
    ref = cols[2].strip()
    if ref and ref >= 'CN2604038':
        new_count += 1
print(f'CSV new rows (>=CN2604038): {new_count}')

# Status sync scope
cur.execute("SELECT COUNT(*) FROM enquiry WHERE id <= 18968 AND enquiry_created_date >= '2026-01-01'")
print(f'\nDB records for status sync (id<=18968, date>=2026): {cur.fetchone()[0]}')

# migration_exceptions
cur.execute("SELECT COUNT(*) FROM migration_exceptions")
total_exc = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM migration_exceptions WHERE status='PENDING'")
pending_exc = cur.fetchone()[0]
print(f'migration_exceptions: total={total_exc}, pending={pending_exc}')

# Sample demo data
cur.execute('SELECT id, ref_number, status FROM enquiry WHERE id > 18968 ORDER BY id LIMIT 10')
print('\nSample demo data:')
for r in cur.fetchall():
    print(f'  id={r[0]} ref={r[1]} status={r[2]}')

conn.close()
