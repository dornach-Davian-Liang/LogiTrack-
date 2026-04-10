import pymysql
conn = pymysql.connect(host="localhost", user="root", password="ldf123", db="logitrack", charset="utf8mb4", autocommit=True)
cur = conn.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS dict_currency (id INT AUTO_INCREMENT PRIMARY KEY, currency_code VARCHAR(10) NOT NULL UNIQUE, currency_name VARCHAR(50) NOT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")
print("Table created")
for code, name, order in [("USD","US Dollar",1),("EUR","Euro",2),("GBP","British Pound",3),("CNY","Chinese Yuan",4),("HKD","Hong Kong Dollar",5),("VND","Vietnamese Dong",6)]:
    cur.execute("INSERT INTO dict_currency (currency_code, currency_name, sort_order) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE currency_name=VALUES(currency_name)", (code, name, order))
print("Seeds done")
cur.execute("ALTER TABLE offer ADD COLUMN IF NOT EXISTS container_currency VARCHAR(10) NULL DEFAULT NULL")
cur.execute("ALTER TABLE offer ADD COLUMN IF NOT EXISTS local_charge_currency VARCHAR(10) NULL DEFAULT NULL")
print("Offer columns added")
cur.execute("SELECT currency_code, currency_name FROM dict_currency ORDER BY sort_order")
print("Currencies:", cur.fetchall())
cur.execute("SHOW COLUMNS FROM offer")
for r in cur.fetchall():
    if "currency" in r[0]: print("Offer col:", r)
conn.close()
