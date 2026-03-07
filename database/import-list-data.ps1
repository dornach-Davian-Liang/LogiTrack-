# ============================================================
# One-Click Import: Generate SQL and Import to Database
# ============================================================

param(
    [string]$MySqlUser = "root",
    [string]$MySqlPassword = "",
    [string]$MySqlHost = "localhost",
    [string]$MySqlPort = "3306",
    [string]$Database = "logitrack"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LogiTrack - List.csv Import Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$csvPath = Join-Path $scriptDir "List.csv"
$sqlPath = Join-Path $scriptDir "import_sales_data_generated.sql"

# Check if CSV exists
if (-not (Test-Path $csvPath)) {
    Write-Host "ERROR: List.csv not found at $csvPath" -ForegroundColor Red
    exit 1
}

# Step 1: Generate SQL
Write-Host "Step 1: Generating SQL from CSV..." -ForegroundColor Yellow
try {
    & (Join-Path $scriptDir "generate-import-sql.ps1")
    Write-Host "SQL generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR generating SQL: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if SQL was generated
if (-not (Test-Path $sqlPath)) {
    Write-Host "ERROR: SQL file not generated" -ForegroundColor Red
    exit 1
}

# Step 2: Ask for MySQL password if not provided
if ([string]::IsNullOrEmpty($MySqlPassword)) {
    Write-Host "Step 2: MySQL Connection" -ForegroundColor Yellow
    $securePassword = Read-Host "Enter MySQL password for user '$MySqlUser'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $MySqlPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""

# Step 3: Check MySQL connection
Write-Host "Step 3: Testing MySQL connection..." -ForegroundColor Yellow
$testQuery = "SELECT VERSION();"
$mysqlCmd = "mysql -h$MySqlHost -P$MySqlPort -u$MySqlUser -p`"$MySqlPassword`" -e `"$testQuery`" 2>&1"

try {
    $result = Invoke-Expression $mysqlCmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Cannot connect to MySQL" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
    Write-Host "MySQL connection successful!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Execute import
Write-Host "Step 4: Importing data to database..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor Gray

$importCmd = "mysql -h$MySqlHost -P$MySqlPort -u$MySqlUser -p`"$MySqlPassword`" $Database"
try {
    Get-Content $sqlPath | & mysql -h$MySqlHost -P$MySqlPort -u$MySqlUser -p"$MySqlPassword" $Database 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Data imported successfully!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Import completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR during import: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Verify results
Write-Host "Step 5: Verifying import..." -ForegroundColor Yellow

$verifyQuery = @"
SELECT 
  'Countries' AS type, 
  COUNT(*) AS count 
FROM country 
WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'Offices', COUNT(*) FROM dict_sales_office WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'PICs', COUNT(*) FROM sales_pic WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US');
"@

try {
    $result = & mysql -h$MySqlHost -P$MySqlPort -u$MySqlUser -p"$MySqlPassword" $Database -e $verifyQuery -t
    Write-Host $result
} catch {
    Write-Host "Could not verify results, but import likely succeeded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Import Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the data in MySQL Workbench or phpMyAdmin"
Write-Host "2. Test the Master Data pages in the frontend"
Write-Host "3. Verify dropdown selections work correctly"
Write-Host ""
Write-Host "For detailed verification, run:" -ForegroundColor Yellow
Write-Host "  mysql -u$MySqlUser -p $Database < verify_list_import.sql" -ForegroundColor White
Write-Host ""
