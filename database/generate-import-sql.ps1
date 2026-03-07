# ============================================================
# 从 List.csv 生成 SQL 插入脚本
# 生成时间: 2026-02-27
# ============================================================

$csvPath = "c:\logitrack\LogiTrack--update-status-report-20260126023903\database\List.csv"
$outputSql = "c:\logitrack\LogiTrack--update-status-report-20260126023903\database\import_sales_data_generated.sql"

# 国家代码映射表
$countryMapping = @{
    'AGENTS' = 'AG'
    'BELGIUM' = 'BE'
    'CHINA' = 'CN'
    'FRANCE' = 'FR'
    'GERMANY' = 'DE'
    'GREECE' = 'GR'
    'MOROCCO' = 'MA'
    'NETHERLANDS' = 'NL'
    'OTHERS' = 'OT'
    'POLAND' = 'PL'
    'SOUTH AFRICA' = 'ZA'
    'SWITZERLAND' = 'CH'
    'TBA' = 'TB'
    'United Kingdom' = 'GB'
    'USA' = 'US'
}

$countryCnMapping = @{
    'AGENTS' = 'Agents'
    'BELGIUM' = 'Belgium'
    'CHINA' = 'China'
    'FRANCE' = 'France'
    'GERMANY' = 'Germany'
    'GREECE' = 'Greece'
    'MOROCCO' = 'Morocco'
    'NETHERLANDS' = 'Netherlands'
    'OTHERS' = 'Others'
    'POLAND' = 'Poland'
    'SOUTH AFRICA' = 'South Africa'
    'SWITZERLAND' = 'Switzerland'
    'TBA' = 'TBA'
    'United Kingdom' = 'United Kingdom'
    'USA' = 'USA'
}

Write-Host "Reading CSV file..."
$csv = Import-Csv $csvPath -Delimiter "`t" | Where-Object { 
    $_.SALESCOUNTRY -and 
    $_.SALESCOUNTRY -ne 'SALESCOUNTRY' -and
    $_.SALESCOUNTRY.Trim() -ne ''
}

Write-Host "Read $($csv.Count) rows"

# 收集唯一数据
$uniqueCountries = @{}
$uniqueOffices = @{}
$allPics = @()

foreach ($row in $csv) {
    $country = $row.SALESCOUNTRY.Trim()
    $office = $row.SALESOFFICE.Trim()
    $pic = $row.SALESPIC.Trim()
    
    if (-not $country -or -not $office -or -not $pic) {
        continue
    }
    
    $countryCode = $countryMapping[$country]
    if (-not $countryCode) {
        Write-Warning "Unmapped country: $country"
        continue
    }
    
    # Collect countries
    if (-not $uniqueCountries.ContainsKey($countryCode)) {
        $uniqueCountries[$countryCode] = @{
            Code = $countryCode
            NameEn = $country
            NameCn = $countryCnMapping[$country]
            IsCore = if ($countryCode -in @('CN', 'FR', 'DE', 'GB', 'US')) { 1 } else { 0 }
        }
    }
    
    # Collect offices
    $officeKey = "$countryCode|$office"
    if (-not $uniqueOffices.ContainsKey($officeKey)) {
        # Generate office code: Use full normalized name or MD5 hash if too long
        $officeAbbr = ($office -replace '[^A-Za-z0-9]', '').ToUpper()
        if ($officeAbbr.Length -gt 40) {
            # Use first 40 chars for long names
            $officeAbbr = $officeAbbr.Substring(0, 40)
        }
        $officeCode = "$countryCode-$officeAbbr"
        
        # Ensure uniqueness by appending counter if needed
        $counter = 1
        $baseCode = $officeCode
        while ($uniqueOffices.Values | Where-Object { $_.Code -eq $officeCode }) {
            $officeCode = "$baseCode-$counter"
            $counter++
        }
        
        $uniqueOffices[$officeKey] = @{
            Code = $officeCode
            Name = $office
            NameNorm = $office.ToUpper().Trim() -replace '\s+', ' '
            CountryCode = $countryCode
        }
    }
    
    # Collect PICs
    $allPics += @{
        Name = $pic
        NameNorm = $pic.ToUpper().Trim()
        CountryCode = $countryCode
        Office = $office
        OfficeCode = $uniqueOffices[$officeKey].Code
    }
}

Write-Host "Unique countries: $($uniqueCountries.Count)"
Write-Host "Unique offices: $($uniqueOffices.Count)"
Write-Host "Total PICs: $($allPics.Count)"

# Generate SQL
$sqlContent = @"
-- ============================================================
-- Auto-generated SQL import script from List.csv
-- Generated at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- Statistics:
--   - Countries: $($uniqueCountries.Count)
--   - Offices: $($uniqueOffices.Count)
--   - Sales PICs: $($allPics.Count)
-- ============================================================

USE logitrack;
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- Step 1: Insert country data
-- ============================================================

"@

# Generate country INSERT
$sqlContent += "INSERT INTO country (country_code, country_name_en, country_name_cn, is_active, is_core) VALUES`n"
$countryValues = @()
foreach ($c in $uniqueCountries.Values | Sort-Object { $_.Code }) {
    $countryValues += "  ('$($c.Code)', '$($c.NameEn)', '$($c.NameCn)', 1, $($c.IsCore))"
}
$sqlContent += $countryValues -join ",`n"
$sqlContent += "`nON DUPLICATE KEY UPDATE`n"
$sqlContent += "  country_name_en = VALUES(country_name_en),`n"
$sqlContent += "  country_name_cn = VALUES(country_name_cn),`n"
$sqlContent += "  updated_at = CURRENT_TIMESTAMP;`n`n"

$sqlContent += "SELECT 'Inserted/updated $($uniqueCountries.Count) countries' AS status;`n`n"

# Generate office INSERT
$sqlContent += "-- ============================================================`n"
$sqlContent += "-- Step 2: Insert sales office data`n"
$sqlContent += "-- ============================================================`n`n"

$sqlContent += "INSERT INTO dict_sales_office (code, name, name_norm, country_code, is_active, sort_order) VALUES`n"
$officeValues = @()
$sortOrder = 0
foreach ($o in $uniqueOffices.Values | Sort-Object { $_.CountryCode, $_.Name }) {
    $name = $o.Name -replace "'", "''"
    $nameNorm = $o.NameNorm -replace "'", "''"
    $officeValues += "  ('$($o.Code)', '$name', '$nameNorm', '$($o.CountryCode)', 1, $sortOrder)"
    $sortOrder += 10
}
$sqlContent += $officeValues -join ",`n"
$sqlContent += "`nON DUPLICATE KEY UPDATE`n"
$sqlContent += "  name = VALUES(name),`n"
$sqlContent += "  name_norm = VALUES(name_norm),`n"
$sqlContent += "  country_code = VALUES(country_code),`n"
$sqlContent += "  updated_at = CURRENT_TIMESTAMP;`n`n"

$sqlContent += "SELECT 'Inserted/updated $($uniqueOffices.Count) sales offices' AS status;`n`n"

# Generate PIC INSERT (deduplicated)
$sqlContent += "-- ============================================================`n"
$sqlContent += "-- Step 3: Insert sales PIC data (deduplicated)`n"
$sqlContent += "-- ============================================================`n`n"

# PIC deduplication: Only keep one per country+office+PIC name
$uniquePics = @{}
foreach ($pic in $allPics) {
    $picKey = "$($pic.CountryCode)|$($pic.Office)|$($pic.NameNorm)"
    if (-not $uniquePics.ContainsKey($picKey)) {
        $uniquePics[$picKey] = $pic
    }
}

Write-Host "PICs after deduplication: $($uniquePics.Count)"

$sqlContent += "INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id, is_active)`n"
$sqlContent += "SELECT`n"
$sqlContent += "  pic_data.name,`n"
$sqlContent += "  pic_data.name_norm,`n"
$sqlContent += "  pic_data.country_code,`n"
$sqlContent += "  so.id AS sales_office_id,`n"
$sqlContent += "  1 AS is_active`n"
$sqlContent += "FROM (`n"

# Use UNION ALL for MySQL 5.7 compatibility instead of VALUES row constructor
$picValues = @()
$isFirst = $true
foreach ($pic in $uniquePics.Values | Sort-Object { $_.CountryCode, $_.Office, $_.Name }) {
    $name = $pic.Name -replace "'", "''"
    $nameNorm = $pic.NameNorm -replace "'", "''"
    if ($isFirst) {
        $picValues += "  SELECT '$name' AS name, '$nameNorm' AS name_norm, '$($pic.CountryCode)' AS country_code, '$($pic.OfficeCode)' AS office_code"
        $isFirst = $false
    } else {
        $picValues += "  UNION ALL SELECT '$name', '$nameNorm', '$($pic.CountryCode)', '$($pic.OfficeCode)'"
    }
}
$sqlContent += $picValues -join "`n"
$sqlContent += "`n) AS pic_data`n"
$sqlContent += "INNER JOIN dict_sales_office so ON so.code = pic_data.office_code`n"
$sqlContent += "ON DUPLICATE KEY UPDATE`n"
$sqlContent += "  name = VALUES(name),`n"
$sqlContent += "  name_norm = VALUES(name_norm),`n"
$sqlContent += "  updated_at = CURRENT_TIMESTAMP;`n`n"

$sqlContent += "SELECT 'Inserted/updated $($uniquePics.Count) sales PICs' AS status;`n`n"

# Validation SQL
$sqlContent += @"
-- ============================================================
-- Step 4: Verify import results
-- ============================================================

SELECT '=== 按国家统计 ===' AS status;
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

-- AGENTS 示例数据
SELECT '=== AGENTS 示例（前10条） ===' AS status;
SELECT 
  c.country_name_en AS country,
  so.name AS office,
  sp.name AS pic
FROM sales_pic sp
INNER JOIN dict_sales_office so ON sp.sales_office_id = so.id
INNER JOIN country c ON sp.country_code = c.country_code
WHERE c.country_code = 'AG'
LIMIT 10;

-- FRANCE 示例数据
SELECT '=== FRANCE 示例（前10条） ===' AS status;
SELECT 
  c.country_name_en AS country,
  so.name AS office,
  sp.name AS pic
FROM sales_pic sp
INNER JOIN dict_sales_office so ON sp.sales_office_id = so.id
INNER JOIN country c ON sp.country_code = c.country_code
WHERE c.country_code = 'FR'
LIMIT 10;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== Import completed! ===' AS status;
"@

# Save SQL file
$sqlContent | Out-File -FilePath $outputSql -Encoding UTF8

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SQL script generated:" -ForegroundColor Green
Write-Host $outputSql -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nStatistics:"
Write-Host "  - Countries: $($uniqueCountries.Count)"
Write-Host "  - Offices: $($uniqueOffices.Count)"
Write-Host "  - Sales PICs (deduplicated): $($uniquePics.Count)"
Write-Host "`nHow to execute:"
Write-Host "  mysql -u root -p logitrack < `"$outputSql`"" -ForegroundColor Yellow
Write-Host ""
