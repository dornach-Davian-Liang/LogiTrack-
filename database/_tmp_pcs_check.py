import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack')
cur = conn.cursor()
cur.execute("""
    SELECT sp.id, sp.name, sp.country_code, so.code, so.name
    FROM sales_pic sp
    JOIN dict_sales_office so ON so.id = sp.sales_office_id
    WHERE sp.name IN ('HAMID MUMTAZ','IMRAN KHAN','MUHAMMAD')
    ORDER BY sp.id
""")
for r in cur.fetchall():
    print(r)
conn.close()
