import pymysql

conn = pymysql.connect(host='localhost', user='root', password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# Check if migration_exceptions table exists
cur.execute("SHOW TABLES LIKE 'migration_exceptions'")
has_exc = cur.fetchone()
print(f'migration_exceptions table exists: {bool(has_exc)}')

if has_exc:
    cur.execute('SELECT COUNT(*) FROM migration_exceptions')
    print(f'Exception count: {cur.fetchone()[0]}')
    cur.execute('SELECT id, csv_line, ref_number, error_type, LEFT(error_msg,80), status FROM migration_exceptions ORDER BY id')
    for r in cur.fetchall():
        print(f'  id={r[0]} line={r[1]} ref={r[2]} type={r[3]} msg={r[4]} status={r[5]}')

# Count records in CN2602217+ range
cur.execute("SELECT COUNT(*) FROM enquiry WHERE ref_number >= 'CN2602217'")
print(f'\nRecords >= CN2602217: {cur.fetchone()[0]}')

cur.execute('SELECT COUNT(*) FROM enquiry')
print(f'Total enquiries: {cur.fetchone()[0]}')

# Get all CSV refs in new range
with open('chinese Pricing.csv', 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()

csv_refs = set()
for line in lines[1:]:
    cols = line.strip().split('\t')
    if len(cols) > 2 and cols[2] >= 'CN2602217':
        csv_refs.add(cols[2])

print(f'CSV refs in new range: {len(csv_refs)}')

# Check which are missing from DB
ref_list = sorted(csv_refs)
cur.execute('SELECT ref_number FROM enquiry WHERE ref_number >= "CN2602217"')
db_refs = set(r[0] for r in cur.fetchall())
missing = csv_refs - db_refs
print(f'Already in DB: {len(db_refs)}')
print(f'Missing from DB: {len(missing)}')
if missing:
    for r in sorted(missing)[:30]:
        print(f'  {r}')
    if len(missing) > 30:
        print(f'  ... and {len(missing)-30} more')

conn.close()
