# Simple test for mixed CORE/NON-CORE
$baseUrl = "http://localhost:8080/api"

# Login
$loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"username":"admin","password":"admin123456"}' -ContentType "application/json"
$token = $loginResp.token
$headers = @{"Authorization"="Bearer $token";"Content-Type"="application/json"}

Write-Host "`n========== Testing Mixed CORE/NON-CORE PODs ==========" -ForegroundColor Cyan

# Get a NON-CORE port
$ports = Invoke-RestMethod -Uri "$baseUrl/master/ports" -Headers $headers
$countries = Invoke-RestMethod -Uri "$baseUrl/master/countries" -Headers $headers

$corePort = $ports | Where-Object {$_.countryCode -eq 'BE'} | Select-Object -First 1
Write-Host "CORE Port: id=$($corePort.id), $($corePort.portName), $($corePort.countryCode)" -ForegroundColor Green

# Find NON-CORE port
$nonCoreCodes = ($countries | Where-Object {$_.isCore -ne $true}).countryCode
$nonCorePort = $null
foreach ($code in $nonCoreCodes) {
    $port = $ports | Where-Object {$_.countryCode -eq $code} | Select-Object -First 1
    if ($port) {
        $nonCorePort = $port
        break
    }
}

if ($nonCorePort) {
    Write-Host "NON-CORE Port: id=$($nonCorePort.id), $($nonCorePort.portName), $($nonCorePort.countryCode)" -ForegroundColor Yellow
    
    # Test mixed scenario
    $enquiryBody = @{
        salesCountryCode = "BE"
        salesOfficeId = 1
        salesPicId = 1
        assignedCnOfficeCode = "ZS"
        cnPricingAdmin = "Janet Chan"
        enquiryReceivedDate = "2026-02-26"
        issueDate = "2026-02-26"
        productCode = "SEA"
        cargoTypeCode = "FCL"
        polIds = @($corePort.id)
        podIds = @($corePort.id, $nonCorePort.id)
        containerLines = @(@{containerTypeId=1; quantity=1})
    } | ConvertTo-Json -Depth 5
    
    Write-Host "`nCreating enquiry with mixed PODs..." -ForegroundColor Cyan
    $resp = Invoke-RestMethod -Uri "$baseUrl/enquiries" -Method Post -Headers $headers -Body $enquiryBody
    
    $coreFlagResult = if ($resp.coreFlag) { $resp.coreFlag } else { "(null)" }
    Write-Host "Result: coreFlag = $coreFlagResult" -ForegroundColor White
    
    if (-not $resp.coreFlag) {
        Write-Host "`n✓ TEST PASSED: Mixed PODs correctly return null (requires manual selection)" -ForegroundColor Green
    } else {
        Write-Host "`n✗ TEST FAILED: Expected null but got '$($resp.coreFlag)'" -ForegroundColor Red
    }
} else {
    Write-Host "No NON-CORE port found, cannot test mixed scenario" -ForegroundColor Red
}

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "Frontend testing: http://localhost:5174" -ForegroundColor Yellow
Write-Host "1. Create new enquiry" -ForegroundColor Yellow
Write-Host "2. Select multiple PODs (mix CORE and NON-CORE countries)" -ForegroundColor Yellow
Write-Host "3. Check if warning appears: '⚠️ 混合CORE和NON-CORE国家，请手动选择'" -ForegroundColor Yellow
Write-Host "4. Clear POD selection and verify warning disappears" -ForegroundColor Yellow
