# LogiTrack Pro - Audit Log E2E Test (Simple Version)
# Test Date: 2026-02-24

$ErrorActionPreference = 'Continue'

Write-Host "`n========================================"
Write-Host "  LogiTrack Pro - Audit Log E2E Test"
Write-Host "========================================`n"

$baseUrl = "http://localhost:8080"
$pass = 0
$fail = 0

# Test 1
Write-Host "Test 1: Get Audit Logs (No Filter)" -ForegroundColor Yellow
try {
    $url = $baseUrl + "/api/audit-logs?page=0&size=10"
    $r1 = Invoke-RestMethod -Uri $url -TimeoutSec 10
    Write-Host "  PASS - Total: $($r1.totalElements)" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 2
Write-Host "`nTest 2: Filter by Action (UPDATE)" -ForegroundColor Yellow
try {
    $url = $baseUrl + "/api/audit-logs?action=UPDATE&page=0&size=5"
    $r2 = Invoke-RestMethod -Uri $url -TimeoutSec 10
    Write-Host "  PASS - Found: $($r2.content.Count) records" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 3
Write-Host "`nTest 3: Filter by Resource Type (ENQUIRY)" -ForegroundColor Yellow
try {
    $url = $baseUrl + "/api/audit-logs?resourceType=ENQUIRY&page=0&size=5"
    $r3 = Invoke-RestMethod -Uri $url -TimeoutSec 10
    Write-Host "  PASS - Found: $($r3.content.Count) records" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 4
Write-Host "`nTest 4: Pagination (Page 2)" -ForegroundColor Yellow
try {
    $url = $baseUrl + "/api/audit-logs?page=1&size=5"
    $r4 = Invoke-RestMethod -Uri $url -TimeoutSec 10
    Write-Host "  PASS - Page 2 Records: $($r4.content.Count)" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 5
Write-Host "`nTest 5: Resource History (ENQUIRY/9)" -ForegroundColor Yellow
try {
    $url = $baseUrl + "/api/audit-logs/resource-history?resourceType=ENQUIRY&resourceId=9"
    $r5 = Invoke-RestMethod -Uri $url -TimeoutSec 10
    Write-Host "  PASS - History Count: $($r5.Count)" -ForegroundColor Green
    if ($r5.Count -gt 0) {
        Write-Host "    Latest: $($r5[0].action) at $($r5[0].createdAt)"
    }
    $pass++
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 6
Write-Host "`nTest 6: Export Audit Logs" -ForegroundColor Yellow
try {
    $url = $baseUrl + "/api/audit-logs/export?page=0&size=10"
    $r6 = Invoke-RestMethod -Uri $url -TimeoutSec 10
    Write-Host "  PASS - Export records: $($r6.Count)" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Summary
Write-Host "`n========================================"
Write-Host "  Test Summary"
Write-Host "========================================`n"
Write-Host "Total Tests: $($pass + $fail)"
Write-Host "PASSED: $pass" -ForegroundColor Green
Write-Host "FAILED: $fail" -ForegroundColor Red

if ($fail -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nSOME TESTS FAILED!" -ForegroundColor Red
}

Write-Host "`n========================================"
Write-Host "  Frontend Testing Guide"
Write-Host "========================================`n"
Write-Host "Visit: http://localhost:3000"
Write-Host "`nSteps:"
Write-Host "  1. Login with admin/admin123456"
Write-Host "  2. Click 'Settings' in sidebar"
Write-Host "  3. Check Audit Log tab"
Write-Host "  4. Verify table displays correctly"
Write-Host "  5. Test filters (date, user, action)"
Write-Host "  6. Test pagination"
Write-Host "  7. Test export and refresh buttons"
Write-Host "`n========================================`n"
