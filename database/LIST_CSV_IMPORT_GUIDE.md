# List.csv Sales Data Import Guide

## Overview
This guide explains how to import sales data from `List.csv` into the LogiTrack database, including:
- Countries (including AGENTS, OTHERS, TBA)
- Sales Offices
- Sales PICs

## Generated Files

1. **generate-import-sql.ps1** - PowerShell script to generate SQL from CSV
2. **import_sales_data_generated.sql** - Auto-generated SQL insert statements

## Data Statistics

From the List.csv file:
- **Total rows**: 1,472
- **Unique countries**: 15
- **Unique offices**: 210  
- **Unique PICs** (after deduplication): 735

### Country Mapping

The CSV uses text country names. These are mapped to standard codes:

| CSV Name | Country Code | Chinese Name | Is Core |
|----------|--------------|--------------|---------|
| AGENTS | AG | Agents | No |
| BELGIUM | BE | Belgium | No |
| CHINA | CN | China | Yes |
| FRANCE | FR | France | Yes |
| GERMANY | DE | Germany | Yes |
| GREECE | GR | Greece | No |
| MOROCCO | MA | Morocco | No |
| NETHERLANDS | NL | Netherlands | No |
| OTHERS | OT | Others | No |
| POLAND | PL | Poland | No |
| SOUTH AFRICA | ZA | South Africa | No |
| SWITZERLAND | CH | Switzerland | No |
| TBA | TB | TBA | No |
| United Kingdom | GB | United Kingdom | Yes |
| USA | US | USA | Yes |

## How to Execute

### Step 1: Generate SQL (if needed)

If you need to regenerate the SQL from the CSV:

```powershell
cd c:\logitrack\LogiTrack--update-status-report-20260126023903\database
.\generate-import-sql.ps1
```

This will create/update `import_sales_data_generated.sql`.

### Step 2: Import to Database

**Option A: Using MySQL command line**

```bash
mysql -u root -p logitrack < import_sales_data_generated.sql
```

**Option B: Using MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your logitrack database
3. File → Run SQL Script...
4. Select `import_sales_data_generated.sql`
5. Click "Run"

**Option C: Using PowerShell with MySQL**

```powershell
Get-Content import_sales_data_generated.sql | mysql -u root -p logitrack
```

## SQL Structure

The generated SQL performs these steps:

### 1. Insert Countries (15 countries)
```sql
INSERT INTO country (country_code, country_name_en, country_name_cn, is_active, is_core)
VALUES
  ('AG', 'AGENTS', 'Agents', 1, 0),
  ('BE', 'BELGIUM', 'Belgium', 1, 0),
  ...
ON DUPLICATE KEY UPDATE
  country_name_en = VALUES(country_name_en),
  updated_at = CURRENT_TIMESTAMP;
```

### 2. Insert Sales Offices (210 offices)
```sql
INSERT INTO dict_sales_office (code, name, name_norm, country_code, is_active, sort_order)
VALUES
  ('AG-AABITORT', 'AABITORT', 'AABITORT', 'AG', 1, 0),
  ('FR-ZIEGLERFRANCE', 'ZIEGLER FRANCE', 'ZIEGLER FRANCE', 'FR', 1, 10),
  ...
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  updated_at = CURRENT_TIMESTAMP;
```

Office codes are generated as: `{COUNTRY_CODE}-{OFFICE_NAME_NORMALIZED}`

### 3. Insert Sales PICs (735 unique PICs)
```sql
INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id, is_active)
SELECT
  pic_data.name,
  pic_data.name_norm,
  pic_data.country_code,
  so.id AS sales_office_id,
  1 AS is_active
FROM (...)
INNER JOIN dict_sales_office so ON so.code = pic_data.office_code
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  updated_at = CURRENT_TIMESTAMP;
```

### 4. Verification Queries

The SQL includes verification queries that show:
- Count by country
- Sample AGENTS data (first 10)
- Sample FRANCE data (first 10)

## Important Notes

### Deduplication

- **PICs are deduplicated** by (country_code, office, name_norm)
- Original 1,472 rows reduced to 735 unique PICs
- Duplicate entries from CSV (same person listed multiple times) are merged

### ON DUPLICATE KEY UPDATE

The SQL uses `ON DUPLICATE KEY UPDATE` which means:
- If the record exists (by unique key), it will be UPDATED
- If the record doesn't exist, it will be INSERTED
- Safe to run multiple times

### Data Quality

- All names are trimmed and normalized
- Office codes are generated to be unique
- Empty/null values in CSV are skipped
- Special characters in office names are removed for code generation

## Verification After Import

Run these queries to verify the import:

```sql
-- Check country counts
SELECT 
  c.country_code,
  c.country_name_en,
  COUNT(DISTINCT so.id) AS office_count,
  COUNT(DISTINCT sp.id) AS pic_count
FROM country c
LEFT JOIN dict_sales_office so ON so.country_code = c.country_code
LEFT JOIN sales_pic sp ON sp.country_code = c.country_code
WHERE c.country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
GROUP BY c.country_code, c.country_name_en
ORDER BY pic_count DESC;

-- Check AGENTS data
SELECT 
  c.country_name_en AS country,
  so.name AS office,
  sp.name AS pic
FROM sales_pic sp
INNER JOIN dict_sales_office so ON sp.sales_office_id = so.id
INNER JOIN country c ON sp.country_code = c.country_code
WHERE c.country_code = 'AG'
ORDER BY so.name, sp.name
LIMIT 20;

-- Check total counts
SELECT 'Countries' AS type, COUNT(*) AS count FROM country WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'Offices', COUNT(*) FROM dict_sales_office WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'PICs', COUNT(*) FROM sales_pic WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US');
```

## Troubleshooting

### Issue: Duplicate office code error

If you see an error about duplicate office codes:
- Check the `dict_sales_office` table for existing records
- The SQL uses ON DUPLICATE KEY UPDATE, so it should handle duplicates
- If still having issues, manually check which codes conflict

### Issue: Foreign key constraint fails

If you see foreign key errors:
- Ensure the country records are inserted first
- Check that `country_code` values match between tables
- Verify that `dict_sales_office` records exist before inserting PICs

### Issue: Character encoding problems

If you see garbled Chinese characters in the SQL file:
- This is a known issue with PowerShell's Out-File encoding
- The data itself (names, codes) are in English and won't be affected  
- Only cosmetic issue in SQL comments

## Rollback

If you need to remove the imported data:

```sql
-- Remove PICs
DELETE FROM sales_pic 
WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US');

-- Remove offices
DELETE FROM dict_sales_office 
WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US');

-- Remove countries (optional - only if these were newly added)
DELETE FROM country 
WHERE country_code IN ('AG', 'BE', 'GR', 'MA', 'PL', 'ZA', 'CH', 'TB', 'OT', 'GB', 'US');
```

## Contact

For issues or questions about the import process, refer to the main project documentation.
