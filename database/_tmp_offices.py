import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack')
cur = conn.cursor()
cur.execute("SELECT code, name, country_code FROM dict_sales_office WHERE country_code='AG' ORDER BY name LIMIT 30")
rows = cur.fetchall()
print("AG 前30条 offices (code, name, country_code):")
for r in rows:
    print(r)
conn.close()
