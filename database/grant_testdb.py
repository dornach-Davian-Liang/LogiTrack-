import pymysql

# 授权 logitrack 用户访问 logitrack_test
c = pymysql.connect(host='localhost', user='root', password='ldf123', charset='utf8mb4')
cur = c.cursor()
# MySQL 8.0 语法：先建用户（如果不存在），再授权
try:
    cur.execute("CREATE USER IF NOT EXISTS 'logitrack'@'localhost' IDENTIFIED BY 'ldf123456'")
except Exception:
    pass
cur.execute("GRANT ALL PRIVILEGES ON `logitrack_test`.* TO 'logitrack'@'localhost'")
cur.execute('FLUSH PRIVILEGES')
c.commit()
print('OK: logitrack@localhost granted on logitrack_test')
c.close()

# 验证
c2 = pymysql.connect(host='localhost', user='logitrack', password='ldf123456', database='logitrack_test', charset='utf8mb4')
cur2 = c2.cursor()
cur2.execute('SELECT COUNT(*) FROM email_processing_log')
print('verify: email_processing_log rows =', cur2.fetchone()[0])
cur2.execute('SELECT COUNT(*) FROM enquiry')
print('verify: enquiry rows =', cur2.fetchone()[0])
c2.close()
print('DONE')
