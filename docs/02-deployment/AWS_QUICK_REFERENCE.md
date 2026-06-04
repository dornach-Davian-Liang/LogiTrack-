# 🚀 LogiTrack AWS EC2 快速部署卡片

## 📋 部署步骤速览（30分钟）

### 阶段1️⃣：创建EC2实例（10分钟）
```bash
实例类型: t3.small (2核2GB)
系统镜像: Ubuntu 22.04 LTS
存储: 30GB gp3
安全组: 开放 22, 80, 443 端口
密钥对: 创建并下载 logitrack-key.pem
弹性IP: 分配并绑定（可选但推荐）
```

### 阶段2️⃣：初始化服务器（10分钟）
```bash
# 1. 连接到EC2
ssh -i logitrack-key.pem ubuntu@<EC2-IP>

# 2. 上传项目代码
# (在本地Windows机器上运行)
.\scripts\upload-to-ec2.ps1 -EC2_IP "你的EC2-IP" -KeyPath "C:\path\to\logitrack-key.pem"

# 3. 在EC2上运行初始化脚本
cd ~/logitrack/scripts
sudo ./aws-setup-server.sh

# 4. 配置MySQL安全设置
sudo mysql_secure_installation
```

### 阶段3️⃣：部署应用（10分钟）
```bash
# 运行部署脚本
cd ~/logitrack/scripts
./aws-deploy-app.sh
# 按提示输入数据库密码

# 完成！访问系统
# http://<你的EC2-IP>
```

---

## 🔑 关键命令速查

### 服务管理
```bash
# 使用运维脚本（推荐）
./scripts/logitrack-ops.sh status    # 查看状态
./scripts/logitrack-ops.sh restart   # 重启服务
./scripts/logitrack-ops.sh logs      # 查看日志
./scripts/logitrack-ops.sh health    # 健康检查
./scripts/logitrack-ops.sh backup    # 备份数据库

# 直接使用systemctl
sudo systemctl status logitrack-backend
sudo systemctl restart logitrack-backend
sudo systemctl restart nginx
```

### 日志查看
```bash
# 后端日志
sudo tail -f /var/log/logitrack-backend.log

# Nginx日志
sudo tail -f /var/log/nginx/logitrack-access.log

# 系统日志
sudo journalctl -u logitrack-backend -f
```

### 数据库操作
```bash
# 登录数据库
mysql -u logitrack_user -p logitrack

# 备份数据库
./scripts/logitrack-ops.sh backup

# 手动备份
mysqldump -u logitrack_user -p logitrack | gzip > backup.sql.gz

# 恢复数据库
gunzip < backup.sql.gz | mysql -u logitrack_user -p logitrack
```

---

## 🔒 Security Group配置

```
入站规则：
┌──────┬──────┬──────┬─────────────┬────────────┐
│ Type │ 协议 │ 端口 │ 来源        │ 说明       │
├──────┼──────┼──────┼─────────────┼────────────┤
│ HTTP │ TCP  │ 80   │ 0.0.0.0/0   │ Web访问    │
│ HTTPS│ TCP  │ 443  │ 0.0.0.0/0   │ HTTPS(可选)│
│ SSH  │ TCP  │ 22   │ 你的IP/32   │ SSH管理    │
└──────┴──────┴──────┴─────────────┴────────────┘

⚠️ 不要开放 3306(MySQL) 和 8080(Backend) 端口！
```

---

## 📂 重要文件路径

```
应用代码:
  ~/logitrack/backend/              # 后端代码
  ~/logitrack/logitrack-pro/        # 前端代码
  ~/logitrack/database/             # 数据库脚本

配置文件:
  ~/logitrack/backend/src/main/resources/application.properties
  /etc/nginx/sites-available/logitrack
  /etc/systemd/system/logitrack-backend.service

日志文件:
  /var/log/logitrack-backend.log
  /var/log/logitrack-backend-error.log
  /var/log/nginx/logitrack-access.log
  /var/log/nginx/logitrack-error.log

备份目录:
  ~/backups/                        # 数据库备份
```

---

## 🔧 常见问题排查

### ❌ 后端无法启动
```bash
# 查看详细错误
sudo journalctl -u logitrack-backend -n 50

# 检查端口占用
sudo lsof -i :8080

# 检查数据库连接
mysql -u logitrack_user -p logitrack -e "SELECT 1"

# 检查磁盘空间
df -h
```

### ❌ 前端无法访问
```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/logitrack-error.log

# 检查文件权限
ls -la ~/logitrack/logitrack-pro/dist/

# 重启Nginx
sudo systemctl restart nginx
```

### ❌ API请求504超时
```bash
# 检查后端是否响应
curl http://localhost:8080/api/statistics/dashboard

# 增加Nginx超时（编辑 /etc/nginx/sites-available/logitrack）
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;

# 重启Nginx
sudo systemctl restart nginx
```

### ❌ 数据库连接失败
```bash
# 检查MySQL状态
sudo systemctl status mysql

# 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log

# 测试连接
mysql -u logitrack_user -p logitrack

# 重启MySQL
sudo systemctl restart mysql
```

---

## 🔄 更新应用流程

### 方式1：使用脚本（推荐）
```bash
cd ~/logitrack/scripts
./logitrack-ops.sh update
```

### 方式2：手动更新
```bash
# 1. 停止服务
sudo systemctl stop logitrack-backend

# 2. 备份当前版本
cd ~/logitrack/backend
cp target/logitrack-backend-1.0.0.jar target/logitrack-backend-1.0.0.jar.backup

# 3. 上传新代码（从本地）
# 或使用 git pull

# 4. 重新构建后端
mvn clean package -DskipTests

# 5. 重新构建前端
cd ../logitrack-pro
npm run build

# 6. 重启服务
sudo systemctl start logitrack-backend
sudo systemctl restart nginx

# 7. 验证
./scripts/logitrack-ops.sh health
```

---

## 💾 备份策略

### 自动备份（推荐）
```bash
# 添加定时任务
crontab -e

# 每天凌晨2点自动备份
0 2 * * * ~/logitrack/scripts/logitrack-ops.sh backup >> /var/log/logitrack-backup.log 2>&1
```

### 手动备份
```bash
# 使用运维脚本
./scripts/logitrack-ops.sh backup

# 备份文件位置
ls -lh ~/backups/

# 下载备份到本地（在本地Windows运行）
scp -i logitrack-key.pem ubuntu@<EC2-IP>:~/backups/logitrack_backup_*.sql.gz ./
```

---

## 📊 系统监控

### 实时监控
```bash
# 查看服务状态
./scripts/logitrack-ops.sh status

# 健康检查
./scripts/logitrack-ops.sh health

# 系统资源
./scripts/logitrack-ops.sh monitor

# 实时日志
./scripts/logitrack-ops.sh logs-live
```

### AWS CloudWatch（可选）
```bash
# 在EC2控制台启用详细监控
# 查看CPU、内存、网络、磁盘使用情况
```

---

## 💰 成本控制

### 预估月度费用
```
EC2 t3.small:     $15-20/月
EBS 30GB:         $2.4/月
数据传输:         $0-5/月
─────────────────────────
总计:             ~$18-27/月
```

### 省钱技巧
1. **预留实例**：承诺1年可节省40%
2. **定时关机**：非工作时间关闭实例
   ```bash
   # 停止实例（保留数据）
   aws ec2 stop-instances --instance-ids i-xxxxx
   
   # 启动实例
   aws ec2 start-instances --instance-ids i-xxxxx
   ```
3. **使用预算告警**：AWS Budgets设置月度预算

---

## 🔐 安全检查清单

- [ ] SSH密钥妥善保管，权限设为400
- [ ] Security Group仅开放必要端口
- [ ] SSH端口仅允许特定IP访问
- [ ] MySQL使用强密码
- [ ] MySQL仅监听127.0.0.1
- [ ] 后端端口(8080)不对外开放
- [ ] 定期更新系统: `sudo apt update && upgrade`
- [ ] 配置HTTPS（推荐使用Let's Encrypt）
- [ ] 定期备份数据库
- [ ] 启用AWS CloudTrail审计

---

## 📞 紧急恢复

### 系统完全崩溃
```bash
# 1. 重启EC2实例
aws ec2 reboot-instances --instance-ids i-xxxxx
# 或在AWS控制台重启

# 2. SSH连接后检查服务
./scripts/logitrack-ops.sh status

# 3. 查看日志定位问题
./scripts/logitrack-ops.sh logs

# 4. 重启所有服务
./scripts/logitrack-ops.sh restart
```

### 数据丢失
```bash
# 从最近的备份恢复
cd ~/backups
ls -lt logitrack_backup_*.sql.gz | head -1

# 恢复数据库
gunzip < logitrack_backup_YYYYMMDD_HHMMSS.sql.gz | \
mysql -u logitrack_user -p logitrack

# 重启后端
sudo systemctl restart logitrack-backend
```

---

## 📱 默认账户信息

```
访问地址: http://<EC2-公网IP>

管理员账户:
  用户名: admin
  密码: admin123456

操作员账户:
  用户名: operator
  密码: admin123456

⚠️ 首次登录后请立即修改密码！
```

---

## 📚 更多资源

- 完整部署文档: [AWS_EC2_DEPLOYMENT_GUIDE.md](AWS_EC2_DEPLOYMENT_GUIDE.md)
- 项目文档: [README.md](README.md)
- 本地部署: [DEPLOYMENT.md](DEPLOYMENT.md)
- AWS官方文档: https://docs.aws.amazon.com/ec2/

---

**技巧**: 将此文档打印或保存到手机，随时查阅！

**提示**: 所有脚本都在 `scripts/` 目录，运行前记得 `chmod +x *.sh`
