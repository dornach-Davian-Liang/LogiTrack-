# LogiTrack Pro - 审计日志功能端到端测试脚本
# 测试日期: 2026-02-24

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LogiTrack Pro - Audit Log E2E Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080"
$testResults = @()

# 测试函数
function Test-API {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json)
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  ✓ PASS" -ForegroundColor Green
        return @{ Name = $Name; Status = "PASS"; Response = $response }
    }
    catch {
        Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Name = $Name; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

Write-Host "Step 1: 测试审计日志列表API" -ForegroundColor Cyan
Write-Host "-------------------------------------`n"

# 测试1: 获取审计日志列表（无筛选）
$result1 = Test-API -Name "获取审计日志列表（无筛选）" -Url ($baseUrl + '/api/audit-logs?page=0&size=10')
$testResults += $result1

if ($result1.Status -eq "PASS") {
    Write-Host "  Total Elements: $($result1.Response.totalElements)" -ForegroundColor Cyan
    Write-Host "  Total Pages: $($result1.Response.totalPages)" -ForegroundColor Cyan
    Write-Host "  Current Page: $($result1.Response.number)" -ForegroundColor Cyan
    Write-Host "  Page Size: $($result1.Response.size)" -ForegroundColor Cyan
}
Write-Host ""

# 测试2: 获取审计日志列表（按操作类型筛选）
$result2 = Test-API -Name "按操作类型筛选（UPDATE）" -Url ($baseUrl + '/api/audit-logs?action=UPDATE&page=0&size=5')
$testResults += $result2

if ($result2.Status -eq "PASS") {
    Write-Host "  Found $($result2.Response.content.Count) UPDATE actions" -ForegroundColor Cyan
}
Write-Host ""

# 测试3: 获取审计日志列表（按资源类型筛选）
$result3 = Test-API -Name "按资源类型筛选（ENQUIRY）" -Url ($baseUrl + '/api/audit-logs?resourceType=ENQUIRY&page=0&size=5')
$testResults += $result3

if ($result3.Status -eq "PASS") {
    Write-Host "  Found $($result3.Response.content.Count) ENQUIRY actions" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "`nStep 2: 测试分页功能" -ForegroundColor Cyan
Write-Host "-------------------------------------`n"

# 测试4: 获取第2页
$result4 = Test-API -Name "获取第2页审计日志" -Url ($baseUrl + '/api/audit-logs?page=1&size=5')
$testResults += $result4

if ($result4.Status -eq "PASS") {
    Write-Host "  Page 2 records: $($result4.Response.content.Count)" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "`nStep 3: 测试资源历史功能" -ForegroundColor Cyan
Write-Host "-------------------------------------`n"

# 测试5: 获取特定资源的操作历史
$result5 = Test-API -Name "获取资源历史（ENQUIRY/9）" -Url ($baseUrl + '/api/audit-logs/resource-history?resourceType=ENQUIRY&resourceId=9')
$testResults += $result5

if ($result5.Status -eq "PASS") {
    Write-Host "  Resource history count: $($result5.Response.Count)" -ForegroundColor Cyan
    if ($result5.Response.Count -gt 0) {
        Write-Host "  Latest action: $($result5.Response[0].action)" -ForegroundColor Cyan
        Write-Host "  Latest time: $($result5.Response[0].createdAt)" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "`nStep 4: 测试导出功能" -ForegroundColor Cyan
Write-Host "-------------------------------------`n"

# 测试6: 导出审计日志
$result6 = Test-API -Name "导出审计日志" -Url ($baseUrl + '/api/audit-logs/export?page=0&size=10')
$testResults += $result6

if ($result6.Status -eq "PASS") {
    Write-Host "  Export data type: $($result6.Response.GetType().Name)" -ForegroundColor Cyan
    if ($result6.Response -is [array]) {
        Write-Host "  Export records count: $($result6.Response.Count)" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  测试总结" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "总测试数: $($testResults.Count)" -ForegroundColor Cyan
Write-Host "通过: $passCount" -ForegroundColor Green
Write-Host "失败: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n✓ 所有测试通过！" -ForegroundColor Green
} else {
    Write-Host "`n✗ 部分测试失败" -ForegroundColor Red
    Write-Host "`n失败的测试:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  前端测试说明" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "请使用浏览器访问: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`n前端测试步骤:" -ForegroundColor Yellow
Write-Host "  1. 使用 admin/admin123456 登录系统" -ForegroundColor White
Write-Host "  2. 点击左侧菜单的 Settings 按钮" -ForegroundColor White
Write-Host "  3. 确认看到 '📋 操作日志 (Audit Log)' 标签页" -ForegroundColor White
Write-Host "  4. 查看审计日志表格是否正确显示" -ForegroundColor White
Write-Host "  5. 测试筛选功能（按日期、用户、操作类型等）" -ForegroundColor White
Write-Host "  6. 测试分页功能（上一页/下一页按钮）" -ForegroundColor White
Write-Host "  7. 测试导出功能（导出按钮）" -ForegroundColor White
Write-Host "  8. 测试刷新功能（刷新按钮）" -ForegroundColor White

Write-Host "`n预期结果:" -ForegroundColor Yellow
Write-Host "  ✓ 表格正确显示审计日志" -ForegroundColor Green
Write-Host "  ✓ 时间格式正确显示（本地时间）" -ForegroundColor Green
Write-Host "  ✓ 操作类型显示中文标签（新增、修改、删除等）" -ForegroundColor Green
Write-Host "  ✓ 状态显示正确颜色徽章" -ForegroundColor Green
Write-Host "  ✓ 筛选功能正常工作" -ForegroundColor Green
Write-Host "  ✓ 分页功能正常工作" -ForegroundColor Green
Write-Host "  ✓ 导出功能正常下载文件" -ForegroundColor Green

Write-Host "`n========================================`n" -ForegroundColor Cyan
