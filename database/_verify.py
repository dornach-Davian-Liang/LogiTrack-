import pymysql

conn = pymysql.connect(host='localhost', user='root', password='ldf123',
                       database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# Find the cargo type column name
cur.execute("SHOW COLUMNS FROM enquiry")
cols = cur.fetchall()
type_cols = [c[0] for c in cols if 'type' in c[0].lower() or 'cargo' in c[0].lower() or 'shipment' in c[0].lower()]
print("Type-related columns:", type_cols)

# Use the correct column
if type_cols:
    col = type_cols[0]
    cur.execute(f"SELECT `{col}`, COUNT(*) FROM enquiry GROUP BY `{col}` ORDER BY COUNT(*) DESC")
    print(f"\n{col} 分布:")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]}")

# FK checks
cur.execute("SELECT COUNT(*) FROM enquiry e LEFT JOIN sales_pic p ON e.sales_pic_id=p.id WHERE e.sales_pic_id IS NOT NULL AND p.id IS NULL")
print(f"\nFK PIC 悬挂: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM enquiry e LEFT JOIN dict_sales_office o ON e.sales_office_id=o.id WHERE e.sales_office_id IS NOT NULL AND o.id IS NULL")
print(f"FK Office 悬挂: {cur.fetchone()[0]}")

# Sample data
cur.execute("SELECT id, reference_number, status, sales_pic_id, sales_office_id FROM enquiry LIMIT 5")
print("\n样本数据:")
for r in cur.fetchall():
    print(f"  id={r[0]} ref={r[1]} status={r[2]} pic={r[3]} office={r[4]}")

conn.close()
