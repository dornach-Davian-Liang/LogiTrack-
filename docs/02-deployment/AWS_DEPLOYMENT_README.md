# AWS EC2 部署文件总览

## 📁 部署相关文件

本项目包含完整的AWS EC2部署方案，适合10人规模团队使用。

### 📋 文档文件

| 文件 | 说明 | 用途 |
|------|------|------|
| **[AWS_EC2_DEPLOYMENT_GUIDE.md](AWS_EC2_DEPLOYMENT_GUIDE.md)** | 完整部署指南 | 详细的分步部署文档，包含所有配置细节 |
| **[AWS_QUICK_REFERENCE.md](AWS_QUICK_REFERENCE.md)** | 快速参考卡片 | 常用命令速查、故障排查、运维操作 |
| 本文件 | 文件索引 | 帮助你找到需要的文档和脚本 |

### 🔧 部署脚本

所有脚本位于 `scripts/` 目录：

| 脚本 | 用途 | 运行位置 | 命令 |
|------|------|----------|------|
| **upload-to-ec2.ps1** | 上传代码到EC2 | 本地Windows | `.\scripts\upload-to-ec2.ps1 -EC2_IP "x.x.x.x" -KeyPath "xxx.pem"` |
| **aws-setup-server.sh** | 初始化EC2环境 | EC2服务器 | `sudo ./aws-setup-server.sh` |
| **aws-deploy-app.sh** | 部署应用 | EC2服务器 | `./aws-deploy-app.sh` |
| **logitrack-ops.sh** | 日常运维管理 | EC2服务器 | `./logitrack-ops.sh [command]` |

---

## 🚀 快速开始（3步完成部署）

### 第1步：创建EC2实例（10分钟）
在AWS控制台创建EC2实例：
- 实例类型：**t3.small** (2核2GB内存)
- 系统镜像：**Ubuntu 22.04 LTS**
- 存储：**30GB gp3**
- 安全组：开放 **22, 80, 443** 端口
- 创建密钥对并下载 `.pem` 文件

### 第2步：上传代码并初始化（5分钟）
在本地Windows PowerShell运行：
```powershell
cd C:\logitrack\LogiTrack--update-status-report-20260126023903

# 上传代码
.\scripts\upload-to-ec2.ps1 -EC2_IP "你的EC2公网IP" -KeyPath "C:\path\to\your-key.pem"

# 连接到EC2
ssh -i "C:\path\to\your-key.pem" ubuntu@你的EC2公网IP

# 在EC2上初始化环境
cd ~/logitrack/scripts
sudo ./aws-setup-server.sh

# 配置MySQL安全设置
sudo mysql_secure_installation
```

### 第3步：部署应用（5分钟）
在EC2上运行：
```bash
cd ~/logitrack/scripts
./aws-deploy-app.sh
# 按提示输入数据库密码（建议使用强密码）

# 部署完成！浏览器访问：
# http://你的EC2公网IP
```

---

## 📖 使用指南

### 🎯 我应该看哪个文档？

#### 情况1：首次部署
👉 阅读 **[AWS_EC2_DEPLOYMENT_GUIDE.md](AWS_EC2_DEPLOYMENT_GUIDE.md)**
- 包含完整的部署步骤
- 详细的配置说明
- 故障排查指南

#### 情况2：快速查询命令
👉 查看 **[AWS_QUICK_REFERENCE.md](AWS_QUICK_REFERENCE.md)**
- 常用命令速查表
- 快速故障排查
- 运维操作指南

#### 情况3：日常运维
👉 使用运维脚本：
```bash
./scripts/logitrack-ops.sh status    # 查看状态
./scripts/logitrack-ops.sh restart   # 重启服务
./scripts/logitrack-ops.sh logs      # 查看日志
./scripts/logitrack-ops.sh health    # 健康检查
./scripts/logitrack-ops.sh backup    # 备份数据库
```

---

## 🔑 关键信息速查

### 系统架构
```
单服务器部署（EC2 t3.small）
├── MySQL 8.0          (端口3306，仅本地访问)
├── Spring Boot后端    (端口8080，仅本地访问)  
└── Nginx前端          (端口80，公网访问)
```

### 访问地址
- **系统入口**: `http://<EC2公网IP>`
- **默认账户**: admin / admin123456 （⚠️ 请尽快修改）

### 重要路径
```bash
# 应用代码
~/logitrack/backend/           # 后端
~/logitrack/logitrack-pro/     # 前端
~/logitrack/database/          # 数据库

# 配置文件
~/logitrack/backend/src/main/resources/application.properties
/etc/nginx/sites-available/logitrack
/etc/systemd/system/logitrack-backend.service

# 日志文件
/var/log/logitrack-backend.log
/var/log/nginx/logitrack-access.log
```

### 月度成本
```
EC2 t3.small:    $15-20
EBS 30GB:        $2.4
数据传输:        $0-5
────────────────────────
预计总计:        ~$18-27/月
```

---

## ⚡ 常用命令

### 服务管理
```bash
# 查看服务状态
sudo systemctl status logitrack-backend
sudo systemctl status nginx
sudo systemctl status mysql

# 重启服务
sudo systemctl restart logitrack-backend
sudo systemctl restart nginx

# 查看日志
sudo tail -f /var/log/logitrack-backend.log
sudo tail -f /var/log/nginx/logitrack-access.log
```

### 运维脚本
```bash
cd ~/logitrack/scripts

./logitrack-ops.sh status      # 查看所有服务状态
./logitrack-ops.sh restart     # 重启应用
./logitrack-ops.sh logs        # 查看日志
./logitrack-ops.sh health      # 健康检查
./logitrack-ops.sh backup      # 备份数据库
./logitrack-ops.sh update      # 更新应用
./logitrack-ops.sh monitor     # 系统监控
```

---

## 🛡️ 安全提示

### ⚠️ 部署前必读
1. **不要使用默认密码**：首次登录后立即修改admin密码
2. **限制SSH访问**：Security Group中SSH端口仅开放给你的IP
3. **不要暴露后端端口**：8080和3306端口不应对外开放
4. **定期备份**：配置自动备份定时任务
5. **更新系统**：定期运行 `sudo apt update && upgrade`

### 🔒 推荐的安全配置
```bash
# 1. 配置HTTPS (使用Let's Encrypt免费证书)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 2. 配置防火墙
sudo ufw status verbose

# 3. 检查开放端口
sudo netstat -tuln | grep LISTEN

# 4. 查看最近登录
last -n 10
```

---

## 🔧 故障排查

### 后端无法访问
```bash
# 1. 检查服务状态
sudo systemctl status logitrack-backend

# 2. 查看日志
sudo tail -n 100 /var/log/logitrack-backend.log

# 3. 检查端口
sudo netstat -tlnp | grep 8080

# 4. 测试API
curl http://localhost:8080/api/statistics/dashboard
```

### 前端无法访问
```bash
# 1. 检查Nginx
sudo systemctl status nginx
sudo nginx -t

# 2. 查看错误日志
sudo tail -f /var/log/nginx/logitrack-error.log

# 3. 检查文件
ls -la ~/logitrack/logitrack-pro/dist/
```

### 数据库连接失败
```bash
# 1. 检查MySQL状态
sudo systemctl status mysql

# 2. 测试连接
mysql -u logitrack_user -p logitrack -e "SELECT 1"

# 3. 查看错误日志
sudo tail -f /var/log/mysql/error.log
```

---

## 📞 获取帮助

### 查看文档
- 完整指南: [AWS_EC2_DEPLOYMENT_GUIDE.md](AWS_EC2_DEPLOYMENT_GUIDE.md)
- 快速参考: [AWS_QUICK_REFERENCE.md](AWS_QUICK_REFERENCE.md)
- 项目文档: [README.md](README.md)

### 运维工具
```bash
# 运维脚本帮助
./scripts/logitrack-ops.sh

# 查看脚本内容
cat ~/logitrack/scripts/logitrack-ops.sh
```

### AWS资源
- EC2文档: https://docs.aws.amazon.com/ec2/
- Security Groups: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html
- CloudWatch: https://docs.aws.amazon.com/cloudwatch/

---

## ✅ 部署检查清单

打印此清单，逐项完成：

### AWS配置
- [ ] EC2实例已创建（t3.small, Ubuntu 22.04）
- [ ] Security Group已配置（22, 80, 443端口）
- [ ] 弹性IP已分配并绑定
- [ ] 密钥对已下载并保存
- [ ] SSH连接测试成功

### 服务器初始化
- [ ] 系统已更新
- [ ] Java 17已安装
- [ ] Maven已安装
- [ ] MySQL已安装并配置
- [ ] Nginx已安装
- [ ] Node.js已安装

### 应用部署
- [ ] 项目代码已上传
- [ ] 数据库已创建
- [ ] 后端服务已启动
- [ ] 前端已构建
- [ ] Nginx已配置
- [ ] 系统可从外网访问

### 运维配置
- [ ] 自动备份已配置
- [ ] 运维脚本已部署
- [ ] 日志轮转已配置
- [ ] 监控脚本已配置

### 安全加固
- [ ] 默认密码已修改
- [ ] SSH仅限特定IP访问
- [ ] MySQL仅本地访问
- [ ] 后端端口未对外开放
- [ ] HTTPS已配置（可选）

---

## 🎉 部署完成

恭喜！您已成功将LogiTrack部署到AWS EC2。

### 后续建议
1. **测试所有功能**：确保系统正常运行
2. **修改默认密码**：提升安全性
3. **配置自动备份**：保护数据安全
4. **设置监控告警**：及时发现问题
5. **培训团队成员**：告知新的访问地址

### 享受使用！
系统访问地址: `http://<你的EC2公网IP>`

---

**文档维护**: 2026-02-19  
**适用版本**: LogiTrack Pro v1.0  
**支持规模**: 10人团队
