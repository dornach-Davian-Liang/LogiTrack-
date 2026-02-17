# Dashboard 增强功能测试脚本
Write-Host "`n=== LogiTrack Dashboard Enhanced API Test ===" -ForegroundColor Cyan
Write-Host "Testing new filtering capabilities...`n" -ForegroundColor Yellow

# Test 1: Date Range Filter
Write-Host "Test 1: Date Range (2026-02-01 to 2026-02-28)" -ForegroundColor Green
try {
    $result1 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/dashboard/filtered?startDate=2026-02-01&endDate=2026-02-28" -Method GET
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Enquiries: $($result1.overview.totalEnquiries)"
    Write-Host "   Quoted: $($result1.overview.quoted)"
    Write-Host "   Confirmed: $($result1.overview.confirmed)"
    if ($result1.cnOfficeStats) {
        Write-Host "   CN Offices: $($result1.cnOfficeStats.Count) offices"
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 2: Core Flag Filter  
Write-Host "Test 2: Date Range + Core Flag (CORE only)" -ForegroundColor Green
try {
    $result2 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/dashboard/filtered?startDate=2026-02-01&endDate=2026-02-28&coreFlags=CORE" -Method GET
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Enquiries (CORE): $($result2.overview.totalEnquiries)"
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 3: Multiple Core Flags
Write-Host "Test 3: Date Range + Multiple Core Flags" -ForegroundColor Green
try {
    $result3 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/dashboard/filtered?startDate=2026-02-01&endDate=2026-02-28&coreFlags=CORE&coreFlags=NON_CORE" -Method GET
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Enquiries (All Flags): $($result3.overview.totalEnquiries)"
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 4: CN Office Stats
Write-Host "Test 4: CN Office Breakdown" -ForegroundColor Green
try {
    $result4 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/dashboard/filtered?startDate=2026-02-01&endDate=2026-02-28" -Method GET
    Write-Host "✅ CN Office Stats:" -ForegroundColor Green
    if ($result4.cnOfficeStats -and $result4.cnOfficeStats.Count -gt 0) {
        $result4.cnOfficeStats | ForEach-Object {
            Write-Host "   $($_.officeName): $($_.totalEnquiries) enquiries, $($_.quoted) quoted, $($_.confirmed) confirmed, $($_.conversionRate) conversion"
        }
    } else {
        Write-Host "   No CN Office data available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 5: Monthly Trend in Date Range
Write-Host "Test 5: Monthly Trend Data" -ForegroundColor Green
try {
    $result5 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/dashboard/filtered?startDate=2026-01-01&endDate=2026-03-31" -Method GET
    Write-Host "✅ Monthly Trend (Q1 2026):" -ForegroundColor Green
    if ($result5.monthlyTrend) {
        $result5.monthlyTrend | ForEach-Object {
            Write-Host "   $($_.month): $($_.totalEnquiries) total, $($_.quoted) quoted, $($_.confirmed) confirmed"
        }
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
