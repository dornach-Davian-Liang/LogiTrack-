# Period Comparison API Test Script
Write-Host "`n=== LogiTrack Period Comparison Test ===" -ForegroundColor Cyan
Write-Host "Testing monthly and quarterly comparison features...`n" -ForegroundColor Yellow

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 35

# Test 1: Monthly Comparison (2 months)
Write-Host "Test 1: Compare 2 months (Jan 2026 vs Feb 2026)" -ForegroundColor Green
try {
    $monthlyRequest = @{
        comparisonType = "MONTHLY"
        periods = @("2026-01", "2026-02")
        coreFlags = $null
        cnOffice = $null
    } | ConvertTo-Json
    
    $result1 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/comparison" `
        -Method POST `
        -Body $monthlyRequest `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Comparison Type: $($result1.comparisonType)"
    Write-Host "   Periods Compared: $($result1.periodStats.Count)"
    Write-Host ""
    Write-Host "   Period Statistics:"
    foreach ($period in $result1.periodStats) {
        $changeText = if ($period.changeFromPrevious -ne $null) { 
            "($($period.changeFromPrevious)% from previous)" 
        } else { 
            "(baseline)" 
        }
        Write-Host "     $($period.period): $($period.totalEnquiries) enquiries, $($period.quoted) quoted, $($period.confirmed) confirmed $changeText"
    }
    
    Write-Host ""
    Write-Host "   Summary:"
    Write-Host "     Grand Total: $($result1.summary.grandTotal)"
    Write-Host "     Avg Conversion Rate: $($result1.summary.avgConversionRate)%"
    Write-Host "     Best Period: $($result1.summary.bestPeriod)"
    Write-Host "     Worst Period: $($result1.summary.worstPeriod)"
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 2: Quarterly Comparison
Write-Host "Test 2: Compare quarters (Q4 2025 vs Q1 2026)" -ForegroundColor Green
try {
    $quarterlyRequest = @{
        comparisonType = "QUARTERLY"
        periods = @("2025-Q4", "2026-Q1")
    } | ConvertTo-Json
    
    $result2 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/comparison" `
        -Method POST `
        -Body $quarterlyRequest `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Quarterly Statistics:"
    foreach ($period in $result2.periodStats) {
        $changeText = if ($period.changeFromPrevious -ne $null) { 
            "($($period.changeFromPrevious)%)" 
        } else { 
            "" 
        }
        Write-Host "     $($period.period): $($period.totalEnquiries) enquiries $changeText"
        Write-Host "       Date Range: $($period.startDate) to $($period.endDate)"
        Write-Host "       Conversion Rate: $($period.conversionRate)%"
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 3: Multiple months with Core Flag filter
Write-Host "Test 3: Compare 3 months with CORE flag" -ForegroundColor Green
try {
    $filteredRequest = @{
        comparisonType = "MONTHLY"
        periods = @("2026-01", "2026-02", "2026-03")
        coreFlags = @("CORE")
    } | ConvertTo-Json
    
    $result3 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/comparison" `
        -Method POST `
        -Body $filteredRequest `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Filter: CORE flag only"
    Write-Host "   Grand Total (CORE): $($result3.summary.grandTotal)"
    Write-Host ""
    Write-Host "   Trend Data (for charting):"
    Write-Host "     Total Enquiries: $($result3.trendData.totalEnquiries -join ', ')"
    Write-Host "     Quoted: $($result3.trendData.quoted -join ', ')"
    Write-Host "     Confirmed: $($result3.trendData.confirmed -join ', ')"
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray

# Test 4: Error handling - invalid format
Write-Host "Test 4: Error Handling (invalid quarter format)" -ForegroundColor Green
try {
    $invalidRequest = @{
        comparisonType = "QUARTERLY"
        periods = @("2026-Q5")  # Invalid quarter
    } | ConvertTo-Json
    
    $result4 = Invoke-RestMethod -Uri "http://localhost:8080/api/statistics/comparison" `
        -Method POST `
        -Body $invalidRequest `
        -ContentType "application/json"
    
    Write-Host "⚠ Unexpected success - should have failed" -ForegroundColor Yellow
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Correctly rejected invalid input" -ForegroundColor Green
    Write-Host "   Error: $($errorResponse.message)"
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
