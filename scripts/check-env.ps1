# 验证本地SSH工具
Write-Host "检查SSH工具..." -ForegroundColor Cyan

# 检查ssh命令
try {
    ssh -V 2>$null
    Write-Host "✓ SSH已可用" -ForegroundColor Green
} catch {
    Write-Host "✗ SSH不可用，正在尝试使用PuTTY或其他工具..." -ForegroundColor Yellow
}

# 检查SCP命令
try {
    scp -V 2>$null
    Write-Host "✓ SCP已可用" -ForegroundColor Green
} catch {
    Write-Host "✗ SCP不可用" -ForegroundColor Yellow
}

# 检查项目目录
$ProjectDir = "C:\logitrack\LogiTrack--update-status-report-20260126023903"
if (Test-Path $ProjectDir) {
    Write-Host "✓ 项目目录存在: $ProjectDir" -ForegroundColor Green
} else {
    Write-Host "✗ 项目目录不存在: $ProjectDir" -ForegroundColor Red
    exit 1
}

Write-Host "`n环境检查完成！" -ForegroundColor Green
