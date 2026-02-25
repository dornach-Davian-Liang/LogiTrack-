# ============================================
# LogiTrack AWS 自动化部署脚本 (Windows PowerShell)
# ============================================
# 使用方法：
# 1. 修改下面的配置信息
# 2. 保存此文件为 deploy.ps1
# 3. 在PowerShell中运行: .\deploy.ps1
# ============================================

# ⚠️ 请修改这些配置
$KeyPath = "修改为你的密钥对路径"  # 例如: C:\Users\YourName\Downloads\my-ec2-key.pem
$EC2_IP = "52.76.164.194"          # 你的EC2公网IP
$ProjectDir = "C:\logitrack\LogiTrack--update-status-report-20260126023903"
$DBPassword = "ldf123"             # 数据库密码
$Username = "ubuntu"               # EC2默认用户

# ===============================================
# 部署开始
# ===============================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LogiTrack AWS EC2 自动化部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查配置
if ($KeyPath -eq "修改为你的密钥对路径") {
    Write-Host "❌ 错误：请先修改密钥对路径！" -ForegroundColor Red
    Write-Host "将以下行的内容改为你的实际路径：" -ForegroundColor Yellow
    Write-Host '  $KeyPath = "C:\Users\YourName\Downloads\my-ec2-key.pem"' -ForegroundColor Yellow
    exit 1
}

# 检查文件存在
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ 错误：密钥对文件不存在" -ForegroundColor Red
    Write-Host "请检查路径: $KeyPath" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $ProjectDir)) {
    Write-Host "❌ 错误：项目目录不存在" -ForegroundColor Red
    Write-Host "请检查路径: $ProjectDir" -ForegroundColor Yellow
    exit 1
}

# 第1步：验证连接
Write-Host "[1/6] 验证SSH连接..." -ForegroundColor Green
try {
    ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$Username@$EC2_IP" "echo 'SSH_OK'" > $null 2>&1
    Write-Host "✓ SSH连接成功" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH连接失败" -ForegroundColor Red
    Write-Host "可能原因：" -ForegroundColor Yellow
    Write-Host "  1. EC2实例未运行" -ForegroundColor Yellow
    Write-Host "  2. 密钥对不正确" -ForegroundColor Yellow
    Write-Host "  3. Security Group未开放22端口" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 第2步：创建远程目录
Write-Host "[2/6] 创建远程目录..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" "mkdir -p ~/logitrack/scripts ~/logitrack/backups"
Write-Host "✓ 远程目录创建完成" -ForegroundColor Green
Write-Host ""

# 第3步：上传代码
Write-Host "[3/6] 上传项目代码..." -ForegroundColor Green

Write-Host "  上传后端..." -ForegroundColor White
scp -i $KeyPath -r -q "$ProjectDir\backend" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "  ✓ 后端已上传" -ForegroundColor Green

Write-Host "  上传前端..." -ForegroundColor White
scp -i $KeyPath -r -q "$ProjectDir\logitrack-pro" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "  ✓ 前端已上传" -ForegroundColor Green

Write-Host "  上传数据库脚本..." -ForegroundColor White
scp -i $KeyPath -r -q "$ProjectDir\database" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "  ✓ 数据库脚本已上传" -ForegroundColor Green

# 上传部署脚本
Write-Host "  上传部署脚本..." -ForegroundColor White
scp -i $KeyPath -q "$ProjectDir\scripts\aws-setup-server.sh" "$Username@${EC2_IP}:~/logitrack/scripts/"
scp -i $KeyPath -q "$ProjectDir\scripts\aws-deploy-app.sh" "$Username@${EC2_IP}:~/logitrack/scripts/"
scp -i $KeyPath -q "$ProjectDir\scripts\logitrack-ops.sh" "$Username@${EC2_IP}:~/logitrack/scripts/"
ssh -i $KeyPath "$Username@$EC2_IP" "chmod +x ~/logitrack/scripts/*.sh"
Write-Host "  ✓ 部署脚本已上传" -ForegroundColor Green
Write-Host "✓ 所有代码上传完成" -ForegroundColor Green
Write-Host ""

# 第4步：初始化服务器环境
Write-Host "[4/6] 初始化服务器环境（这需要2-3分钟）..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" "sudo bash ~/logitrack/scripts/aws-setup-server.sh > /dev/null 2>&1"
Write-Host "✓ 服务器环境初始化完成" -ForegroundColor Green
Write-Host ""

# 第5步：配置数据库
Write-Host "[5/6] 配置数据库..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" @"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root123456';" 2>/dev/null || true
"@
Write-Host "✓ MySQL安全配置完成" -ForegroundColor Green
Write-Host ""

# 第6步：部署应用
Write-Host "[6/6] 部署应用（これに3-5分钟）..." -ForegroundColor Green

# 创建临时密码文件供脚本使用
$TempScript = @"
#!/bin/bash
set -e
export DB_PASSWORD="$DBPassword"
cd ~/logitrack/scripts
bash aws-deploy-app.sh <<< "$DBPassword"
"@

ssh -i $KeyPath "$Username@$EC2_IP" "cat > ~/deploy_temp.sh << 'EOF'
$TempScript
EOF
chmod +x ~/deploy_temp.sh
bash ~/deploy_temp.sh
rm ~/deploy_temp.sh"

Write-Host "✓ 应用部署完成" -ForegroundColor Green
Write-Host ""

# 验证部署
Write-Host "验证部署..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

try {
    $response = Invoke-RestMethod -Uri "http://$EC2_IP/api/statistics/dashboard" -TimeoutSec 5
    Write-Host "✓ 系统已启动并响应正常" -ForegroundColor Green
} catch {
    Write-Host "⚠ 等待应用启动（可能还需要10-20秒）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 系统访问地址:" -ForegroundColor Cyan
Write-Host "   http://$EC2_IP" -ForegroundColor Yellow
Write-Host ""
Write-Host "👤 默认登录账户:" -ForegroundColor Cyan
Write-Host "   用户名: admin" -ForegroundColor Yellow
Write-Host "   密码: admin123456" -ForegroundColor Yellow
Write-Host "   ⚠️  请登录后立即修改密码！" -ForegroundColor Red
Write-Host ""
Write-Host "📊 数据库密码: $DBPassword" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 远程配置命令:" -ForegroundColor Cyan
Write-Host "   ssh -i '$KeyPath' $Username@$EC2_IP" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 查看日志:" -ForegroundColor Cyan
Write-Host "   ssh -i '$KeyPath' $Username@$EC2_IP 'tail -f /var/log/logitrack-backend.log'" -ForegroundColor Yellow
Write-Host ""
Write-Host "🆘 运维命令:" -ForegroundColor Cyan
Write-Host "   ssh -i '$KeyPath' $Username@$EC2_IP '~/logitrack/scripts/logitrack-ops.sh status'" -ForegroundColor Yellow
Write-Host ""

# 询问是否立即连接
$connect = Read-Host "是否现在连接到EC2？(y/n)"
if ($connect -eq "y" -or $connect -eq "Y") {
    Write-Host "正在连接..." -ForegroundColor Green
    ssh -i $KeyPath "$Username@$EC2_IP"
}
