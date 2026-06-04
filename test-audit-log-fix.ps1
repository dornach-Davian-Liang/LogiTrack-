# 审计日志修复验证脚本
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  审计日志字段修复验证测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$API_BASE = "http://localhost:8080/api"

# 1. 登录获取token
Write-Host "[步骤 1] 登录系统..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"admin","password":"admin123456"}'
    
    $token = $loginResponse.token
    $username = $loginResponse.username
    $role = $loginResponse.roles[0]
    
    Write-Host "✓ 登录成功！" -ForegroundColor Green
    Write-Host "  用户名: $username" -ForegroundColor White
    Write-Host "  角色: $role" -ForegroundColor White
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor White
} catch {
    Write-Host "✗ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "X-Username" = $username
    "X-User-Role" = $role
}

# 2. 查询一个Enquiry
Write-Host "`n[步骤 2] 查询Enquiry #43..." -ForegroundColor Yellow
try {
    $enquiry = Invoke-RestMethod -Uri "$API_BASE/enquiries/43" -Headers $headers
    Write-Host "✓ 查询成功" -ForegroundColor Green
    Write-Host "  参考编号: $($enquiry.referenceNumber)" -ForegroundColor White
    Write-Host "  状态: $($enquiry.status)" -ForegroundColor White
    Write-Host "  数量: $($enquiry.quantity)" -ForegroundColor White
    Write-Host "  CN Pricing Admin: $($enquiry.cnPricingAdmin)" -ForegroundColor White
} catch {
    Write-Host "✗ 查询失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 更新Enquiry（修改状态和数量）
Write-Host "`n[步骤 3] 更新Enquiry #43（模拟浏览器操作）..." -ForegroundColor Yellow

$updateData = @{
    id = $enquiry.id
    referenceNumber = $enquiry.referenceNumber
    referenceMonth = $enquiry.referenceMonth
    monthlySequence = $enquiry.monthlySequence
    serialNumber = $enquiry.serialNumber
    enquiryReceivedDate = $enquiry.enquiryReceivedDate
    issueDate = $enquiry.issueDate
    productCode = $enquiry.productCode
    productAbbr = $enquiry.productAbbr
    status = "Quoted"  # 修改状态
    salesCountryCode = $enquiry.salesCountryCode
    salesOfficeId = $enquiry.salesOfficeId
    salesPicId = $enquiry.salesPicId
    cargoTypeCode = $enquiry.cargoTypeCode
    quantity = 150  # 修改数量
    quantityUomCode = $enquiry.quantityUomCode
    volumeCbm = $enquiry.volumeCbm
    commodity = $enquiry.commodity
    cnPricingAdmin = "admin_test_user"  # 设置CN Pricing Admin
    assignedCnOfficeCode = $enquiry.assignedCnOfficeCode
    polId = $enquiry.polId
    podId = $enquiry.podId
    bookingConfirmed = $enquiry.bookingConfirmed
} | ConvertTo-Json -Depth 5

try {
    $updated = Invoke-RestMethod -Uri "$API_BASE/enquiries/43" -Method PUT `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $updateData
    
    Write-Host "✓ 更新成功！" -ForegroundColor Green
    Write-Host "  新状态: $($updated.status)" -ForegroundColor White
    Write-Host "  新数量: $($updated.quantity)" -ForegroundColor White
    Write-Host "  CN Pricing Admin: $($updated.cnPricingAdmin)" -ForegroundColor White
} catch {
    Write-Host "✗ 更新失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. 等待审计日志生成
Write-Host "`n[步骤 4] 等待审计日志生成..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 5. 查询最新的审计日志
Write-Host "`n[步骤 5] 查询最新审计日志..." -ForegroundColor Yellow
try {
    $auditUrl = $API_BASE + '/audit-logs?page=0&size=1'
    $auditLogs = Invoke-RestMethod -Uri $auditUrl -Headers $headers
    
    if ($auditLogs.content.Count -gt 0) {
        $latestLog = $auditLogs.content[0]
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  最新审计日志 (ID: $($latestLog.id))" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "时间: $($latestLog.createdAt)" -ForegroundColor White
        Write-Host "用户名: $($latestLog.username)" -ForegroundColor $(if ($latestLog.username -eq "admin") { "Green" } else { "Red" })
        Write-Host "权限等级: $($latestLog.userRole)" -ForegroundColor $(if ($latestLog.userRole) { "Green" } else { "Red" })
        Write-Host "CN Pricing Admin: $($latestLog.cnPricingAdmin)" -ForegroundColor $(if ($latestLog.cnPricingAdmin) { "Green" } else { "Red" })
        Write-Host "变更详情: $($latestLog.details)" -ForegroundColor $(if ($latestLog.details) { "Green" } else { "Red" })
        Write-Host "操作: $($latestLog.action)" -ForegroundColor White
        Write-Host "资源: $($latestLog.resourceType) #$($latestLog.resourceId)" -ForegroundColor White
        Write-Host "状态: $($latestLog.status)" -ForegroundColor White
        
        # 验证结果
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  验证结果" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        
        $allPass = $true
        
        if ($latestLog.username -eq "admin") {
            Write-Host "✓ 用户名正确: admin" -ForegroundColor Green
        } else {
            Write-Host "✗ 用户名错误: $($latestLog.username) (期望: admin)" -ForegroundColor Red
            $allPass = $false
        }
        
        if ($latestLog.userRole) {
            Write-Host "✓ 权限等级已记录: $($latestLog.userRole)" -ForegroundColor Green
        } else {
            Write-Host "✗ 权限等级为空" -ForegroundColor Red
            $allPass = $false
        }
        
        if ($latestLog.cnPricingAdmin) {
            Write-Host "✓ CN Pricing Admin已记录: $($latestLog.cnPricingAdmin)" -ForegroundColor Green
        } else {
            Write-Host "✗ CN Pricing Admin为空" -ForegroundColor Red
            $allPass = $false
        }
        
        if ($latestLog.details) {
            Write-Host "✓ 变更详情已生成: $($latestLog.details.Substring(0, [Math]::Min(50, $latestLog.details.Length)))..." -ForegroundColor Green
        } else {
            Write-Host "✗ 变更详情为空" -ForegroundColor Red
            $allPass = $false
        }
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        if ($allPass) {
            Write-Host "  ✓✓✓ 所有字段验证通过！" -ForegroundColor Green
        } else {
            Write-Host "  ✗✗✗ 部分字段验证失败" -ForegroundColor Red
        }
        Write-Host "========================================`n" -ForegroundColor Cyan
        
    } else {
        Write-Host "✗ 未找到审计日志" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 查询审计日志失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
