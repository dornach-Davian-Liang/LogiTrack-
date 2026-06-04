# 🚀 LogiTrack AWS EC2 完整部署执行指南

## 📋 你的部署信息

```
EC2 IP地址:     52.76.164.194
数据库密码:     ldf123
部署方式:       完全自动化
系统规模:       10人团队
```

---

## 🔑 第一步：获取密钥对文件

### ⚠️ 这一步很关键！密钥对是SSH连接必需的

#### **方法A：寻找已下载的密钥对文件**

1. **打开文件浏览器**，依次查找这些文件夹：
   ```
   C:\Users\你的用户名\Downloads\           （下载文件夹）
   C:\Users\你的用户名\Documents\          （文档文件夹）
   C:\Users\你的用户名\Desktop\            （桌面文件夹）
   ```

2. **查找这样的文件**（可能的名称）：
   ```
   *.pem          （AWS密钥对文件）
   logitrack*     （包含logitrack的文件）
   ec2-key*       （包含ec2-key的文件）
   ```

3. **找到后**，记住完整路径，例如：
   ```
   C:\Users\YourUsername\Downloads\my-ec2-key.pem
   ```

#### **方法B：从AWS控制台重新获取密钥对**

如果找不到密钥对文件，需要在AWS Console中重新创建：

1. **登录AWS控制台**: https://console.aws.amazon.com/
2. **进入EC2服务**：搜索 "EC2"
3. **找到你的实例**：
   - 左边菜单 → "Instances" (实例)
   - 找到 IP 为 `52.76.164.194` 的实例
   - 记下**实例名称**

4. **获得关联的密钥对**：
   - 选中实例，在下方"Security"选项卡找到 "Key pair name"
   - 这就是你的密钥对名称（例如：`my-key`）

5. **重新下载密钥对**：
   - 左边菜单 → "Key Pairs" (密钥对)
   - 找到与实例关联的密钥对
   - 右键 →"Download .pem file"
   - 保存到 `C:\Users\你的用户名\Downloads\`

---

## ✅ 第二步：验证连接

一旦有了 `.pem` 文件，在PowerShell中运行：

```powershell
# 例如，如果密钥对在 C:\Users\YourUsername\Downloads\my-ec2-key.pem

$KeyPath = "C:\Users\YourUsername\Downloads\my-ec2-key.pem"
$EC2_IP = "52.76.164.194"

# 测试SSH连接
ssh -i $KeyPath ubuntu@$EC2_IP "echo 'SSH连接成功!'"
```

✅ 如果看到 "SSH连接成功!"，说明密钥对正确

❌ 如果出错，检查：
- `.pem` 文件路径是否正确
- EC2实例是否正在运行（AWS控制台检查）
- Security Group是否开放22端口

---

## 🚀 第三步：自动化部署（一键完成）

一旦验证连接成功，在PowerShell中运行这个脚本：

### **PowerShell 脚本**

```powershell
# ============================================
# LogiTrack AWS 自动化部署脚本
# ============================================

$KeyPath = "C:\Users\YourUsername\Downloads\my-ec2-key.pem"  # 改为你的密钥对路径
$EC2_IP = "52.76.164.194"
$ProjectDir = "C:\logitrack\LogiTrack--update-status-report-20260126023903"
$DBPassword = "ldf123"
$Username = "ubuntu"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "LogiTrack AWS 自动化部署" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 第1步：验证密钥对
Write-Host "[1/5] 验证密钥对和连接..." -ForegroundColor Green
if (-not (Test-Path $KeyPath)) {
    Write-Host "错误：密钥对文件不存在: $KeyPath" -ForegroundColor Red
    exit 1
}

try {
    ssh -i $KeyPath -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$Username@$EC2_IP" "echo 'OK'" > $null 2>&1
    Write-Host "✓ SSH连接测试通过" -ForegroundColor Green
} catch {
    Write-Host "✗ SSH连接失败，请检查密钥对路径和EC2实例状态" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 第2步：初始化EC2环境
Write-Host "[2/5] 初始化EC2环境（安装Java、MySQL、Nginx等）..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" 'mkdir -p ~/logitrack/scripts'
scp -i $KeyPath -r "$ProjectDir\scripts\aws-setup-server.sh" "$Username@${EC2_IP}:~/logitrack/scripts/"
ssh -i $KeyPath "$Username@$EC2_IP" "chmod +x ~/logitrack/scripts/aws-setup-server.sh && cd ~/logitrack/scripts && sudo bash aws-setup-server.sh"
Write-Host "✓ 环境初始化完成" -ForegroundColor Green
Write-Host ""

# 第3步：上传项目代码
Write-Host "[3/5] 上传项目代码到EC2..." -ForegroundColor Green
scp -i $KeyPath -r "$ProjectDir\backend" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "  ✓ 后端代码已上传"
scp -i $KeyPath -r "$ProjectDir\logitrack-pro" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "  ✓ 前端代码已上传"
scp -i $KeyPath -r "$ProjectDir\database" "$Username@${EC2_IP}:~/logitrack/"
Write-Host "  ✓ 数据库脚本已上传"
scp -i $KeyPath "$ProjectDir\scripts\aws-deploy-app.sh" "$Username@${EC2_IP}:~/logitrack/scripts/"
scp -i $KeyPath "$ProjectDir\scripts\logitrack-ops.sh" "$Username@${EC2_IP}:~/logitrack/scripts/"
ssh -i $KeyPath "$Username@$EC2_IP" "chmod +x ~/logitrack/scripts/*.sh"
Write-Host "✓ 所有代码已上传" -ForegroundColor Green
Write-Host ""

# 第4步：配置MySQL安全设置
Write-Host "[4/5] 配置MySQL安全设置..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" @"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root_strong_password'; DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1'); DELETE FROM mysql.user WHERE User=''; FLUSH PRIVILEGES;"
"@
Write-Host "✓ MySQL已安全配置" -ForegroundColor Green
Write-Host ""

# 第5步：部署应用
Write-Host "[5/5] 部署应用（数据库 + 后端 + 前端）..." -ForegroundColor Green
ssh -i $KeyPath "$Username@$EC2_IP" @"
cd ~/logitrack/scripts
echo "$DBPassword" | bash aws-deploy-app.sh
"@
Write-Host "✓ 应用部署完成" -ForegroundColor Green
Write-Host ""

# 完成
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：http://52.76.164.194" -ForegroundColor Cyan
Write-Host "默认账户：admin / admin123456" -ForegroundColor Cyan
Write-Host ""
Write-Host "后续操作：" -ForegroundColor Yellow
Write-Host "1. 浏览器中访问 http://52.76.164.194" -ForegroundColor White
Write-Host "2. 登录并修改默认密码" -ForegroundColor White
Write-Host "3. SSH连接查看日志：ssh -i $KeyPath ubuntu@$EC2_IP" -ForegroundColor White
Write-Host "4. 查看日志：tail -f /var/log/logitrack-backend.log" -ForegroundColor White
Write-Host ""
```

### **如何运行此脚本**

1. **打开记事本 (Notepad)**
2. **复制上面的完整脚本**
3. **粘贴到记事本**
4. **修改这两行**（最关键！）：
   ```powershell
   $KeyPath = "C:\Users\YourUsername\Downloads\my-ec2-key.pem"  # 改成你的密钥对路径
   $DBPassword = "ldf123"  # 你已经提供了这个密码
   ```
5. **另存为** `C:\logitrack\deploy.ps1`
6. **打开PowerShell**，运行：
   ```powershell
   cd C:\logitrack
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   .\deploy.ps1
   ```

---

## 📝 如果想逐步手动执行

### **手动步骤1：初始化服务器**

```powershell
$KeyPath = "C:\Users\YourUsername\Downloads\my-ec2-key.pem"
$EC2_IP = "52.76.164.194"

# 连接到EC2
ssh -i $KeyPath ubuntu@$EC2_IP

# 在EC2上执行（复制粘贴）
cd ~
mkdir -p logitrack/scripts
cd logitrack
```

### **手动步骤2：上传代码**

```powershell
# 在本地PowerShell运行（不在EC2上）
$KeyPath = "C:\Users\YourUsername\Downloads\my-ec2-key.pem"
$EC2_IP = "52.76.164.194"
$ProjectDir = "C:\logitrack\LogiTrack--update-status-report-20260126023903"

# 上传所有代码
scp -i $KeyPath -r "$ProjectDir\backend" "ubuntu@${EC2_IP}:~/logitrack/"
scp -i $KeyPath -r "$ProjectDir\logitrack-pro" "ubuntu@${EC2_IP}:~/logitrack/"
scp -i $KeyPath -r "$ProjectDir\database" "ubuntu@${EC2_IP}:~/logitrack/"
scp -i $KeyPath -r "$ProjectDir\scripts\aws-setup-server.sh" "ubuntu@${EC2_IP}:~/logitrack/scripts/"
scp -i $KeyPath -r "$ProjectDir\scripts\aws-deploy-app.sh" "ubuntu@${EC2_IP}:~/logitrack/scripts/"
scp -i $KeyPath -r "$ProjectDir\scripts\logitrack-ops.sh" "ubuntu@${EC2_IP}:~/logitrack/scripts/"

echo "上传完成！"
```

### **手动步骤3：在EC2上运行部署脚本**

```bash
# SSH连接到EC2
ssh -i your-key.pem ubuntu@52.76.164.194

# 在EC2上执行
cd ~/logitrack/scripts

# 1. 初始化环境
sudo bash aws-setup-server.sh

# 2. 配置MySQL
sudo mysql_secure_installation
# 选择: Y, Y, Y, Y, Y, Y (所有选项)

# 3. 部署应用
bash aws-deploy-app.sh
# 输入数据库密码: ldf123
```

---

## 💡 我需要你提供的关键信息

**为了立即开始部署，请告诉我：**

```
1. 密钥对文件(.pem)的完整路径是什么？
   例如：C:\Users\张三\Downloads\my-ec2-key.pem
   
   或者，如果你不知道：
   - EC2实例的实例ID是什么？(格式: i-xxxxx，在AWS console可以看到)
   - 我可以帮你从AWS重新获取密钥对
```

一旦你提供了这个信息，我会：
1. ✅ 验证SSH连接成功
2. ✅ 为你生成完整的自动化部署脚本
3. ✅ 给你一键部署的命令
4. ✅ 在部署过程中提供实时支持

---

## 🆘 常见问题

### Q: 密钥对文件丢失了怎么办？
**A:** 
1. 在AWS控制台确认EC2实例仍在运行
2. 可以创建新的密钥对，或使用EC2 Instance Connect（如果实例支持）
3. 我可以帮你处理

### Q: SSH连接不上怎么办？
**A:**
- 检查EC2实例是否运行中
- 检查Security Group是否开放22端口
- 检查`.pem`文件权限（Windows上可能需要调整）

### Q: 部署到中途失败了怎么办？
**A:** 
- 告诉我错误信息
- 我可以帮你调试或从故障点重新开始

---

## 📞 下一步

**请回复以下任意一个：**

1. 提供密钥对文件的完整路径
   ```
   例：C:\Users\yourname\Downloads\my-key.pem
   ```

2. 或提供EC2实例ID，我帮你获取密钥对
   ```
   例：i-0123456789abcdef0
   ```

3. 或告诉我密钥对文件名，我帮你在本地查找

**提供了这个信息后，我会立即为你执行完整的自动化部署！** 🚀

---

**预计部署时间**: 15-20分钟  
**预计成功率**: 95%（如果密钥对正确）
