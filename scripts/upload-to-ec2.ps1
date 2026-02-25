# LogiTrack 上传到AWS EC2的PowerShell脚本
# 使用方法：在PowerShell中运行此脚本
#   .\upload-to-ec2.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_IP,
    
    [Parameter(Mandatory=$true)]
    [string]$KeyPath,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "ubuntu"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LogiTrack 上传到 AWS EC2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 验证密钥文件存在
if (-not (Test-Path $KeyPath)) {
    Write-Host "错误：密钥文件不存在: $KeyPath" -ForegroundColor Red
    exit 1
}

# 当前项目目录
$ProjectDir = $PSScriptRoot
if ($PSScriptRoot -eq "") {
    $ProjectDir = Get-Location
}

Write-Host "项目目录: $ProjectDir" -ForegroundColor Yellow
Write-Host "EC2地址: $EC2_IP" -ForegroundColor Yellow
Write-Host "SSH密钥: $KeyPath" -ForegroundColor Yellow
Write-Host ""

# 测试SSH连接
Write-Host ">> 测试SSH连接..." -ForegroundColor Green
try {
    ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$Username@$EC2_IP" "echo 'SSH连接成功'"
    Write-Host "✓ SSH连接正常" -ForegroundColor Green
} catch {
    Write-Host "✗ SSH连接失败，请检查：" -ForegroundColor Red
    Write-Host "  1. EC2实例是否运行" -ForegroundColor Yellow
    Write-Host "  2. Security Group是否开放22端口" -ForegroundColor Yellow
    Write-Host "  3. 密钥文件是否正确" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 在EC2上创建目录
Write-Host ">> 在EC2上创建项目目录..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" "mkdir -p ~/logitrack"
Write-Host "✓ 目录创建完成" -ForegroundColor Green
Write-Host ""

# 上传backend
Write-Host ">> 上传后端代码..." -ForegroundColor Green
scp -i $KeyPath -o StrictHostKeyChecking=no -r "$ProjectDir\backend" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "✓ 后端代码上传完成" -ForegroundColor Green
Write-Host ""

# 上传frontend
Write-Host ">> 上传前端代码..." -ForegroundColor Green
scp -i $KeyPath -o StrictHostKeyChecking=no -r "$ProjectDir\logitrack-pro" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "✓ 前端代码上传完成" -ForegroundColor Green
Write-Host ""

# 上传database
Write-Host ">> 上传数据库脚本..." -ForegroundColor Green
scp -i $KeyPath -o StrictHostKeyChecking=no -r "$ProjectDir\database" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "✓ 数据库脚本上传完成" -ForegroundColor Green
Write-Host ""

# 上传CSV文件
Write-Host ">> 上传CSV数据文件..." -ForegroundColor Green
$csvFiles = Get-ChildItem -Path $ProjectDir -Filter "*.csv" -File
foreach ($csv in $csvFiles) {
    Write-Host "   上传 $($csv.Name)..."
    scp -i $KeyPath -o StrictHostKeyChecking=no "$($csv.FullName)" "$Username@${EC2_IP}:~/logitrack/"
}
Write-Host "✓ CSV文件上传完成" -ForegroundColor Green
Write-Host ""

# 上传部署脚本
Write-Host ">> 上传部署脚本..." -ForegroundColor Green
scp -i $KeyPath -o StrictHostKeyChecking=no -r "$ProjectDir\scripts" "$Username@${EC2_IP}:~/logitrack/"
ssh -i $KeyPath "$Username@$EC2_IP" "chmod +x ~/logitrack/scripts/*.sh"
Write-Host "✓ 部署脚本上传完成" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 上传完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 连接到EC2：" -ForegroundColor White
Write-Host "   ssh -i $KeyPath $Username@$EC2_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 运行部署脚本：" -ForegroundColor White
Write-Host "   cd ~/logitrack/scripts" -ForegroundColor Cyan
Write-Host "   ./aws-deploy-app.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 访问系统：" -ForegroundColor White
Write-Host "   http://$EC2_IP" -ForegroundColor Cyan
Write-Host ""

# 询问是否立即连接
$connect = Read-Host "是否立即SSH连接到EC2？(y/n)"
if ($connect -eq "y") {
    Write-Host ""
    Write-Host "正在连接到EC2..." -ForegroundColor Green
    ssh -i $KeyPath "$Username@$EC2_IP"
}
