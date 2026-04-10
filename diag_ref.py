import pymysql
conn = pymysql.connect(host="localhost", user="root", password="ldf123", db="logitrack", charset="utf8mb4")
cur = conn.cursor()
cur.execute("SELECT id, ref_number, monthly_sequence, serial_number, reference_month, product_code FROM enquiry WHERE ref_number LIKE '%2604%' ORDER BY id DESC LIMIT 30")
for r in cur.fetchall(): print(r)
print("---")
cur.execute("SELECT MAX(monthly_sequence) as max_seq, MAX(serial_number) as max_ser FROM enquiry WHERE reference_month='2604'")
print("Max seq/ser:", cur.fetchone())
conn.close()