# -*- coding: utf-8 -*-
import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack',charset='utf8mb4')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM country'); c1=cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM dict_sales_office'); c2=cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM sales_pic'); c3=cur.fetchone()[0]
print(f'countries={c1}, offices={c2}, PICs={c3}')

cur.execute("SELECT code, name, country_code FROM dict_sales_office WHERE country_code IN ('GB','ZA') ORDER BY country_code, name")
print('\nUK/SA offices:')
for r in cur.fetchall(): print(f'  [{r[2]}] {r[0]} -> {r[1]}')

cur.execute("SELECT code, name FROM dict_sales_office ORDER BY id DESC LIMIT 15")
print('\n最近插入的 offices (last 15):')
for r in cur.fetchall(): print(f'  {r[0]} -> {r[1]}')
cur.close(); conn.close()
