# List.csv Import - Quick Reference

## Files Created

| File | Purpose |
|------|---------|
| `List.csv` | Source data (SALESCOUNTRY, SALESOFFICE, SALESPIC) |
| `generate-import-sql.ps1` | PowerShell script to parse CSV and generate SQL |
| `import_sales_data_generated.sql` | Auto-generated SQL with INSERT statements |
| `import-list-data.ps1` | One-click import tool (generates SQL + imports to MySQL) |
| `verify_list_import.sql` | Verification queries to check import results |
| `LIST_CSV_IMPORT_GUIDE.md` | Detailed documentation |

## Quick Start

### Option 1: One-Click Import (Recommended)

```powershell
cd c:\logitrack\LogiTrack--update-status-report-20260126023903\database
.\import-list-data.ps1
```

Enter your MySQL password when prompted. The script will:
1. Generate SQL from CSV
2. Test MySQL connection  
3. Import all data
4. Show verification results

### Option 2: Manual Import

```powershell
# Step 1: Generate SQL
.\generate-import-sql.ps1

# Step 2: Import to MySQL
mysql -u root -p logitrack < import_sales_data_generated.sql

# Step 3: Verify
mysql -u root -p logitrack < verify_list_import.sql
```

## What Gets Imported

From **1,472 rows** in List.csv:

- **15 countries** (AG, BE, CN, FR, DE, GR, MA, NL, OT, PL, ZA, CH, TB, GB, US)
- **210 sales offices** (unique by country + office name)
- **735 sales PICs** (deduplicated by country + office + name)

### Special Countries

- **AGENTS** (AG) - Represents various agents/代理商
- **OTHERS** (OT) - Other miscellaneous entries/其他
- **TBA** (TB) - To Be Assigned/待定

All are imported as valid countries to maintain data integrity.

## Verification

After import, check counts:

```sql
SELECT 
  c.country_code,
  c.country_name_en,
  COUNT(DISTINCT so.id) AS offices,
  COUNT(DISTINCT sp.id) AS pics
FROM country c
LEFT JOIN dict_sales_office so ON so.country_code = c.country_code
LEFT JOIN sales_pic sp ON sp.country_code = c.country_code
WHERE c.country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
GROUP BY c.country_code, c.country_name_en
ORDER BY pics DESC;
```

Expected top results:
- AGENTS (AG): ~70 offices, ~250 PICs
- FRANCE (FR): ~45 offices, ~180 PICs  
- United Kingdom (GB): ~25 offices, ~80 PICs

## Troubleshooting

**Error: List.csv not found**
- Ensure you're in the database folder
- Check file name is exactly "List.csv"

**Error: MySQL connection failed**
- Verify MySQL is running
- Check username/password
- Confirm database "logitrack" exists

**Error: Duplicate key**
- This is normal if re-importing
- SQL uses `ON DUPLICATE KEY UPDATE` to handle this
- Existing records will be updated, not duplicated

## Files Already in Database?

The import is **safe to run multiple times**. It uses `ON DUPLICATE KEY UPDATE` which means:
- New records will be inserted
- Existing records will be updated
- No duplicates will be created

## Documentation

For detailed information, see:
- [LIST_CSV_IMPORT_GUIDE.md](LIST_CSV_IMPORT_GUIDE.md) - Complete documentation
- [import_sales_data_generated.sql](import_sales_data_generated.sql) - Generated SQL (review before importing)

## Date

Generated: 2026-02-27
