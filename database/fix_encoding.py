import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack')
conn.autocommit = False
cur = conn.cursor()

# Fix 1: AG-PCS PICs country_code AGENTS -> AG
cur.execute("""
    UPDATE sales_pic
    SET country_code = 'AG', updated_at = CURRENT_TIMESTAMP
    WHERE sales_office_id = (SELECT id FROM dict_sales_office WHERE code = 'AG-PCS2')
      AND country_code = 'AGENTS'
""")
print(f"Fix 1 - PCS PICs country_code: {cur.rowcount} rows updated")

# Fix 2: Replace non-breaking space \xa0 in sales_pic names
cur.execute("""
    UPDATE sales_pic
    SET name = REPLACE(name, CHAR(160), ' '),
        name_norm = REPLACE(name_norm, CHAR(160), ' '),
        updated_at = CURRENT_TIMESTAMP
    WHERE name LIKE CONCAT('%', CHAR(160), '%')
""")
print(f"Fix 2 - Remove non-breaking spaces: {cur.rowcount} rows updated")

# Fix 3: Same in dict_sales_office
cur.execute("""
    UPDATE dict_sales_office
    SET name = REPLACE(name, CHAR(160), ' '),
        name_norm = REPLACE(name_norm, CHAR(160), ' '),
        updated_at = CURRENT_TIMESTAMP
    WHERE name LIKE CONCAT('%', CHAR(160), '%')
""")
print(f"Fix 3 - Offices non-breaking spaces: {cur.rowcount} rows updated")

# Fix 4: Update JEMIMA -> JÉMIMA to match CSV (accent on É)
# The CSV has JÉMIMA FARATIANA but DB has JEMIMA FARATIANA
# Let's leave the DB as-is (JEMIMA) and just ensure check script handles it
# No duplicate insert needed - same person

conn.commit()
print("\nAll fixes committed!")
conn.close()
