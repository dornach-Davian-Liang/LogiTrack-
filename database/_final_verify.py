import pymysql
conn = pymysql.connect(host='localhost', user='root', password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# Total counts
for t in ['enquiry','enquiry_pol','enquiry_pod','enquiry_container_line','offer','offer_price_line']:
    cur.execute(f'SELECT COUNT(*) FROM {t}')
    print(f'{t}: {cur.fetchone()[0]}')

# FK integrity
cur.execute('SELECT COUNT(*) FROM enquiry e LEFT JOIN dict_sales_pic p ON e.sales_pic_id=p.id WHERE e.sales_pic_id IS NOT NULL AND p.id IS NULL')
print(f'\nFK PIC dangling: {cur.fetchone()[0]}')
cur.execute('SELECT COUNT(*) FROM enquiry e LEFT JOIN dict_sales_office o ON e.sales_office_id=o.id WHERE e.sales_office_id IS NOT NULL AND o.id IS NULL')
print(f'FK Office dangling: {cur.fetchone()[0]}')

# Exceptions
cur.execute("SELECT status, COUNT(*) FROM migration_exceptions GROUP BY status")
print('\nExceptions:')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

# Spot check resolved refs
cur.execute("""SELECT e.ref_number, e.status, o.name 
               FROM enquiry e 
               JOIN dict_sales_office o ON e.sales_office_id=o.id 
               WHERE e.ref_number IN ('CN2603258-S','CN2603278-A','CN2604035-S') 
               ORDER BY e.ref_number""")
print('\nSpot check resolved records:')
for r in cur.fetchall():
    print(f'  {r[0]}: status={r[1]}, office={r[2]}')

# New PICs check
cur.execute("SELECT p.id, p.name, o.name FROM dict_sales_pic p JOIN dict_sales_office o ON p.sales_office_id=o.id WHERE p.id >= 597")
print('\nNew PICs:')
for r in cur.fetchall():
    print(f'  id={r[0]}: {r[1]} @ {r[2]}')

conn.close()
