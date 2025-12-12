# Windows MySQL 连接指南

## 🔍 当前状态

❌ 无法连接到本地 MySQL 服务器

## ✅ 解决步骤

### 步骤 1: 启动 Windows MySQL 服务

#### 方法一：通过服务管理器
1. 按 `Win + R`，输入 `services.msc`，回车
2. 找到 `MySQL` 或 `MySQL80` 服务
3. 右键点击 → **启动**

#### 方法二：通过命令行（以管理员身份运行）
```cmd
net start MySQL
# 或
net start MySQL80
```

#### 方法三：通过 MySQL Workbench
1. 打开 MySQL Workbench
2. 点击服务器管理
3. 点击 "启动服务器"

---

### 步骤 2: 验证 MySQL 是否运行

在 Windows 命令提示符中运行：
```cmd
mysql -u root -pldf123 -e "SELECT 1"
```

如果成功，应该显示：
```
+---+
| 1 |
+---+
| 1 |
+---+
```

---

### 步骤 3: 配置防火墙（如果使用 Docker/WSL）

如果您在 Docker 容器或 WSL 中运行项目，需要：

1. **检查 MySQL 监听地址**
   
   编辑 MySQL 配置文件 `my.ini`（通常在 `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`）：
   
   ```ini
   [mysqld]
   bind-address = 0.0.0.0  # 允许所有地址访问
   # 或
   bind-address = 127.0.0.1  # 仅本地访问
   ```

2. **重启 MySQL 服务**
   ```cmd
   net stop MySQL80
   net start MySQL80
   ```

3. **允许防火墙规则**
   ```cmd
   netsh advfirewall firewall add rule name="MySQL" dir=in action=allow protocol=TCP localport=3306
   ```

---

### 步骤 4: 创建数据库和表

一旦 MySQL 启动，在 **Windows 命令提示符** 中运行：

```cmd
# 1. 登录 MySQL
mysql -u root -pldf123

# 2. 创建数据库
CREATE DATABASE IF NOT EXISTS logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logitrack;

# 3. 退出
exit;

# 4. 执行建表脚本
mysql -u root -pldf123 logitrack < "C:\path\to\LogiTrack-\database\schema.sql"
```

**注意**: 将路径替换为您的实际项目路径。

---

### 步骤 5: WSL/Docker 访问 Windows MySQL

如果您的项目运行在 WSL 或 Docker 中：

#### 方案 A: 使用 Windows 主机 IP

1. 在 Windows PowerShell 中获取 IP：
   ```powershell
   ipconfig | findstr IPv4
   ```
   
   例如得到：`192.168.1.100`

2. 在 WSL/Docker 中测试连接：
   ```bash
   python3 -c "
   import mysql.connector
   conn = mysql.connector.connect(
       host='192.168.1.100',  # 替换为您的 Windows IP
       port=3306,
       user='root',
       password='ldf123'
   )
   print('连接成功!')
   conn.close()
   "
   ```

3. 更新 `application.properties`：
   ```properties
   spring.datasource.url=jdbc:mysql://192.168.1.100:3306/logitrack
   ```

#### 方案 B: 使用 host.docker.internal（Docker）

如果使用 Docker Desktop：
```properties
spring.datasource.url=jdbc:mysql://host.docker.internal:3306/logitrack
```

#### 方案 C: 使用 localhost.localdomain（WSL2）

在 WSL2 中，可以通过以下方式获取 Windows 主机 IP：
```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```

---

### 步骤 6: 导入 CSV 数据

在 **Windows 命令提示符** 中：

```cmd
# 进入项目目录
cd C:\path\to\LogiTrack-\database

# 安装 Python 依赖（如果未安装）
pip install pandas mysql-connector-python

# 运行导入脚本
python import_csv.py
```

---

## 🔧 快速检查清单

完成启动后，请运行此检查：

```bash
# 在 WSL/Docker 终端中运行
cd /workspaces/LogiTrack-/database
python3 check_mysql.py
```

应该看到：
- ✅ MySQL 连接成功
- ✅ logitrack 数据库存在
- ✅ enquiry_records 表存在
- 📊 记录数: X 条

---

## 🚨 常见问题

### 问题 1: "MySQL 服务未找到"

**解决方案**:
- 确认 MySQL 已安装
- 检查服务名称是否为 `MySQL80` 或其他版本号
- 在服务管理器中查看实际服务名

### 问题 2: "拒绝访问"

**解决方案**:
```sql
-- 在 MySQL 中运行
mysql -u root -pldf123
CREATE USER 'root'@'%' IDENTIFIED BY 'ldf123';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

### 问题 3: "端口 3306 被占用"

**解决方案**:
```cmd
# 检查端口占用
netstat -ano | findstr :3306

# 如果被其他程序占用，修改 MySQL 端口或停止占用程序
```

### 问题 4: WSL 无法连接到 Windows MySQL

**解决方案**:
1. 关闭 Windows 防火墙（临时测试）
2. 或添加防火墙入站规则允许端口 3306
3. 确保 MySQL 配置文件中 `bind-address = 0.0.0.0`

---

## 📞 下一步

1. ✅ 启动 Windows MySQL 服务
2. ✅ 验证连接成功
3. ✅ 创建数据库
4. ✅ 执行建表脚本
5. ✅ 导入 CSV 数据
6. ✅ 启动后端服务
7. ✅ 测试系统

**完成后，返回终端运行自动化测试！**
