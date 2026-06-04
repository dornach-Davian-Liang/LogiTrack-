# ========================================
# CORE/NON-CORE 混合情况测试脚本
# ========================================

$baseUrl = "http://localhost:8080/api"
$username = "admin"
$password = "admin123456"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORE Flag 自动计算测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. 登录获取Token
Write-Host "[1/5] 正在登录..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = $username
        password = $password
    } | ConvertTo-Json
    
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResp.token
    Write-Host "✓ 登录成功，Token: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ 登录失败: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. 获取国家信息（验证isCore字段）
Write-Host "`n[2/5] 获取国家信息..." -ForegroundColor Yellow
try {
    $countries = Invoke-RestMethod -Uri "$baseUrl/master/countries" `
        -Method Get `
        -Headers $headers
    
    $coreCountries = $countries | Where-Object { $_.isCore -eq $true }
    $nonCoreCountries = $countries | Where-Object { $_.isCore -ne $true }
    
    Write-Host "✓ 获取国家: $($countries.Count) 个" -ForegroundColor Green
    Write-Host "  - CORE国家: $($coreCountries.Count) 个" -ForegroundColor Green
    Write-Host "  - NON-CORE国家: $($nonCoreCountries.Count) 个" -ForegroundColor Green
    
    # 显示几个示例
    $coreSample = $coreCountries | Select-Object -First 3 | ForEach-Object { "$($_.countryCode):$($_.countryNameEn)" }
    $nonCoreSample = $nonCoreCountries | Select-Object -First 3 | ForEach-Object { "$($_.countryCode):$($_.countryNameEn)" }
    Write-Host "  - CORE示例: $($coreSample -join ', ')" -ForegroundColor Cyan
    Write-Host "  - NON-CORE示例: $($nonCoreSample -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "✗ 获取国家失败: $_" -ForegroundColor Red
    exit 1
}

# 3. 获取港口信息
Write-Host "`n[3/5] 获取港口信息..." -ForegroundColor Yellow
try {
    $ports = Invoke-RestMethod -Uri "$baseUrl/master/ports" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✓ 获取港口: $($ports.Count) 个" -ForegroundColor Green
    
    # 找一个CORE国家的港口（比利时BE）
    $corePort = $ports | Where-Object { $_.countryCode -eq 'BE' } | Select-Object -First 1
    # 找一个NON-CORE国家的港口（阿富汗AF）
    $nonCorePort = $ports | Where-Object { $_.countryCode -eq 'AF' } | Select-Object -First 1
    
    if ($corePort) {
        Write-Host "  - CORE港口: $($corePort.portName) (id=$($corePort.id), country=$($corePort.countryCode))" -ForegroundColor Cyan
    }
    if ($nonCorePort) {
        Write-Host "  - NON-CORE港口: $($nonCorePort.portName) (id=$($nonCorePort.id), country=$($nonCorePort.countryCode))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ 获取港口失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 测试场景1: 仅CORE国家的POD
Write-Host "`n[4/5] 测试场景1: 仅CORE国家 (比利时BE)" -ForegroundColor Yellow
if ($corePort) {
    try {
        $enquiryCore = @{
            salesCountryCode = "BE"
            salesOfficeId = 1
            salesPicId = 1
            assignedCnOfficeCode = "ZS"
            cnPricingAdmin = "Janet Chan"
            enquiryReceivedDate = "2026-02-26"
            issueDate = "2026-02-26"
            productCode = "SEA"
            cargoTypeCode = "FCL"
            polIds = @(1)
            podIds = @($corePort.id)
            containerLines = @(
                @{
                    containerTypeId = 1
                    quantity = 1
                }
            )
        } | ConvertTo-Json -Depth 5
        
        $respCore = Invoke-RestMethod -Uri "$baseUrl/enquiries" `
            -Method Post `
            -Headers $headers `
            -Body $enquiryCore
        
        $coreFlagResult = if ($respCore.coreFlag) { $respCore.coreFlag } else { "(null)" }
        
        if ($respCore.coreFlag -eq "CORE") {
            Write-Host "✓ 测试通过: coreFlag = $coreFlagResult" -ForegroundColor Green
        } else {
            Write-Host "✗ 测试失败: 期望 'CORE'，实际 '$coreFlagResult'" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ 测试失败: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ 跳过：未找到CORE国家港口" -ForegroundColor Yellow
}

# 5. 测试场景2: 仅NON-CORE国家的POD
Write-Host "`n[5/5] 测试场景2: 仅NON-CORE国家 (阿富汗AF)" -ForegroundColor Yellow
if ($nonCorePort) {
    try {
        $enquiryNonCore = @{
            salesCountryCode = "BE"
            salesOfficeId = 1
            salesPicId = 1
            assignedCnOfficeCode = "ZS"
            cnPricingAdmin = "Janet Chan"
            enquiryReceivedDate = "2026-02-26"
            issueDate = "2026-02-26"
            productCode = "SEA"
            cargoTypeCode = "FCL"
            polIds = @(1)
            podIds = @($nonCorePort.id)
            containerLines = @(
                @{
                    containerTypeId = 1
                    quantity = 1
                }
            )
        } | ConvertTo-Json -Depth 5
        
        $respNonCore = Invoke-RestMethod -Uri "$baseUrl/enquiries" `
            -Method Post `
            -Headers $headers `
            -Body $enquiryNonCore
        
        $coreFlagResult = if ($respNonCore.coreFlag) { $respNonCore.coreFlag } else { "(null)" }
        
        if ($respNonCore.coreFlag -eq "NON_CORE") {
            Write-Host "✓ 测试通过: coreFlag = $coreFlagResult" -ForegroundColor Green
        } else {
            Write-Host "✗ 测试失败: 期望 'NON_CORE'，实际 '$coreFlagResult'" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ 测试失败: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ 跳过：未找到NON-CORE国家港口" -ForegroundColor Yellow
}

# 6. 测试场景3: 混合CORE和NON-CORE国家
Write-Host "`n[6/6] 测试场景3: 混合CORE和NON-CORE国家" -ForegroundColor Yellow
if ($corePort -and $nonCorePort) {
    try {
        $enquiryMixed = @{
            salesCountryCode = "BE"
            salesOfficeId = 1
            salesPicId = 1
            assignedCnOfficeCode = "ZS"
            cnPricingAdmin = "Janet Chan"
            enquiryReceivedDate = "2026-02-26"
            issueDate = "2026-02-26"
            productCode = "SEA"
            cargoTypeCode = "FCL"
            polIds = @(1)
            podIds = @($corePort.id, $nonCorePort.id)  # 混合POD
            containerLines = @(
                @{
                    containerTypeId = 1
                    quantity = 1
                }
            )
        } | ConvertTo-Json -Depth 5
        
        $respMixed = Invoke-RestMethod -Uri "$baseUrl/enquiries" `
            -Method Post `
            -Headers $headers `
            -Body $enquiryMixed
        
        $coreFlagResult = if ($respMixed.coreFlag) { $respMixed.coreFlag } else { "(null)" }
        
        if (-not $respMixed.coreFlag) {
            Write-Host "✓ 测试通过: coreFlag = $coreFlagResult (混合情况返回null，需要手动选择)" -ForegroundColor Green
        } else {
            Write-Host "✗ 测试失败: 期望 '(null)'，实际 '$coreFlagResult'" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ 测试失败: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ 跳过：未找到足够的端口用于测试" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n提示：请在浏览器中访问 http://localhost:5174 测试前端混合情况警告显示" -ForegroundColor Yellow
Write-Host "      1. 创建新的Enquiry" -ForegroundColor Yellow
Write-Host "      2. 选择多个POD（包含CORE和NON-CORE国家）" -ForegroundColor Yellow
Write-Host "      3. 观察CORE Flag字段旁是否显示：'⚠️ 混合CORE和NON-CORE国家，请手动选择'" -ForegroundColor Yellow
Write-Host "      4. 清除POD选择后，警告应该消失，coreFlag应该被重置" -ForegroundColor Yellow
