import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack')
cur = conn.cursor()

cur.execute("SELECT id, code, name, name_norm, country_code FROM dict_sales_office WHERE name_norm='PCS' OR name='PCS' OR code LIKE '%-PCS'")
rows = cur.fetchall()
print("PCS 相关记录:")
for r in rows:
    print(r)

cur.execute("SHOW INDEX FROM dict_sales_office WHERE Key_name != 'PRIMARY'")
idx = cur.fetchall()
print("\n唯一索引:")
for r in idx:
    print(f"  {r[2]}  col={r[4]}")

conn.close()
