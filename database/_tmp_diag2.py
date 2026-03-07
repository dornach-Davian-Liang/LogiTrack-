import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack')
cur = conn.cursor()

# Check PCS PICs
print("=== AG-PCS2 office details ===")
cur.execute("SELECT id, code, name, country_code FROM dict_sales_office WHERE code='AG-PCS2'")
for r in cur.fetchall(): print(r)

print("\n=== Sales PICs linked to AG-PCS2 ===")
cur.execute("SELECT sp.id, sp.name, sp.name_norm, sp.country_code FROM sales_pic sp JOIN dict_sales_office so ON so.id=sp.sales_office_id WHERE so.code='AG-PCS2'")
for r in cur.fetchall(): print(r)

# Check unique constraints on sales_pic
print("\n=== sales_pic UNIQUE indexes ===")
cur.execute("SHOW INDEX FROM sales_pic WHERE Key_name != 'PRIMARY'")
for r in cur.fetchall(): print(r[2], r[4])

# Check FR ZIEGLER FRANCE PICs
print("\n=== FR/ZIEGLER FRANCE PICs in DB ===")
cur.execute("SELECT sp.id, sp.name, sp.country_code FROM sales_pic sp JOIN dict_sales_office so ON so.id=sp.sales_office_id WHERE so.name='ZIEGLER FRANCE' AND sp.country_code='FR'")
for r in cur.fetchall(): print(r)

conn.close()
