# 🪟 LogiTrack - Windows 完整部署指南

## 📋 目标机器配置

根据您提供的配置信息：
- **操作系统**: Windows 10/11 (64-bit)
- **处理器**: Intel Core i5-7400 @ 3.00GHz
- **内存**: 16.0 GB RAM
- **存储**: 238 GB SSD
- **显卡**: Intel HD Graphics 630 (128 MB)

✅ **该配置完全满足 LogiTrack 系统的运行要求**

---

## 🎯 部署概览

本指南将帮助您在全新的 Windows 机器上从零开始部署 LogiTrack 系统，包括：

1. ✅ 安装所有必需软件
2. ✅ 配置开发环境
3. ✅ 克隆项目代码
4. ✅ 设置 MySQL 数据库
5. ✅ 导入初始数据
6. ✅ 启动后端服务
7. ✅ 启动前端应用
8. ✅ 验证系统正常运行

**预计总耗时**: 30-45 分钟（取决于网络速度）

---

## 📦 第一步：安装必需软件

### 1.1 安装 Java 21 (JDK)

#### 下载 JDK
1. 访问 Oracle JDK 官网: https://www.oracle.com/java/technologies/downloads/#java21
2. 下载 **Windows x64 Installer** (`.msi` 文件)
3. 或者使用 OpenJDK: https://adoptium.net/

#### 安装步骤
1. 双击下载的 `.msi` 文件
2. 点击 "Next" 按照默认选项安装
3. 记住安装路径（默认: `C:\Program Files\Java\jdk-21`）

#### 配置环境变量
1. 右键点击 **此电脑** → **属性** → **高级系统设置** → **环境变量**
2. 在 **系统变量** 中，点击 **新建**：
   - 变量名: `JAVA_HOME`
   - 变量值: `C:\Program Files\Java\jdk-21` (您的实际安装路径)
3. 编辑 **Path** 变量，添加: `%JAVA_HOME%\bin`
4. 点击 **确定** 保存

#### 验证安装
打开 **命令提示符** (CMD) 或 **PowerShell**：
```cmd
java -version
```
应该显示：
```
java version "21.0.x" ...
```

---

### 1.2 安装 Maven 3.9+

#### 下载 Maven
1. 访问: https://maven.apache.org/download.cgi
2. 下载 **Binary zip archive** (`apache-maven-3.9.x-bin.zip`)

#### 安装步骤
1. 解压到 `C:\Program Files\Apache\maven` (或您喜欢的位置)
2. 配置环境变量：
   - 新建系统变量:
     - 变量名: `MAVEN_HOME`
     - 变量值: `C:\Program Files\Apache\maven`
   - 编辑 **Path**，添加: `%MAVEN_HOME%\bin`

#### 验证安装
```cmd
mvn -version
```
应该显示：
```
Apache Maven 3.9.x ...
```

---

### 1.3 安装 Node.js 18+ 和 npm

#### 下载 Node.js
1. 访问: https://nodejs.org/
2. 下载 **LTS 版本** (Windows Installer `.msi`)
3. 推荐版本: Node.js 18.x 或 20.x

#### 安装步骤
1. 双击 `.msi` 文件
2. 勾选 **Automatically install necessary tools**
3. 按默认选项完成安装

#### 验证安装
```cmd
node -v
npm -v
```
应该显示：
```
v18.x.x 或 v20.x.x
10.x.x
```

---

### 1.4 安装 MySQL 8.0

#### 方式一：使用 MySQL Installer (推荐)

1. **下载**:
   - 访问: https://dev.mysql.com/downloads/installer/
   - 下载 **Windows (x86, 32-bit), MSI Installer** (较大的那个，~400MB)

2. **安装**:
   - 双击 `mysql-installer-web-community-8.0.x.msi`
   - 选择 **Developer Default** 或 **Server only**
   - 点击 **Next** → **Execute** 开始下载和安装

3. **配置**:
   - **Type and Networking**:
     - Config Type: `Development Computer`
     - Port: `3306` (默认)
     - 勾选 `Open Windows Firewall ports for network access`
   
   - **Authentication Method**:
     - 选择 `Use Strong Password Encryption` (推荐)
   
   - **Accounts and Roles**:
     - Root Password: 设置为 `ldf123` (或您自己的密码)
     - ⚠️ **重要**: 记住这个密码，后续配置需要使用
   
   - **Windows Service**:
     - Service Name: `MySQL80`
     - 勾选 `Start the MySQL Server at System Startup`
     - Run Windows Service as: `Standard System Account`
   
   - 点击 **Execute** 完成配置

4. **验证安装**:
   ```cmd
   mysql -u root -pldf123 -e "SELECT VERSION();"
   ```

#### 方式二：使用 Docker Desktop (可选)

如果您偏好使用 Docker：

1. **下载 Docker Desktop**:
   - 访问: https://www.docker.com/products/docker-desktop/
   - 下载 Windows 版本并安装
   - 安装后重启电脑

2. **启动 MySQL 容器**:
   ```cmd
   docker run -d ^
     --name logitrack-mysql ^
     -e MYSQL_ROOT_PASSWORD=ldf123 ^
     -e MYSQL_DATABASE=logitrack ^
     -p 3306:3306 ^
     mysql:8.0
   ```

3. **验证**:
   ```cmd
   docker ps
   ```

---

### 1.5 安装 Git

#### 下载 Git
1. 访问: https://git-scm.com/download/win
2. 下载最新版本

#### 安装步骤
1. 双击 `.exe` 文件
2. 按默认选项安装
3. 建议选择 **Git Bash** 作为默认终端

#### 验证安装
```cmd
git --version
```

---

### 1.6 安装 Python 3.8+ (用于数据导入脚本)

#### 下载 Python
1. 访问: https://www.python.org/downloads/
2. 下载 Python 3.11 或 3.12

#### 安装步骤
1. 双击 `.exe` 文件
2. ⚠️ **重要**: 勾选 **Add Python to PATH**
3. 点击 **Install Now**

#### 验证安装
```cmd
python --version
pip --version
```

#### 安装必需的 Python 包
```cmd
pip install pandas pymysql cryptography
```

---

## 💻 第二步：克隆项目代码

### 2.1 选择项目目录

建议在您的用户目录下创建项目文件夹：
```cmd
cd %USERPROFILE%
mkdir Projects
cd Projects
```

### 2.2 克隆 GitHub 仓库

```cmd
git clone https://github.com/dornach-Davian-Liang/LogiTrack-.git
cd LogiTrack-
```

### 2.3 查看项目结构

```cmd
dir
```

您应该看到：
```
backend/           - Spring Boot 后端
logitrack-pro/     - React 前端
database/          - 数据库脚本和迁移工具
Test.csv           - 测试数据
README.md          - 项目说明
```

---

## 🗄️ 第三步：配置 MySQL 数据库

### 3.1 确认 MySQL 服务运行

```cmd
# 检查服务状态
sc query MySQL80

# 如果未运行，启动服务
net start MySQL80
```

### 3.2 创建数据库

打开命令提示符，登录 MySQL：
```cmd
mysql -u root -pldf123
```

在 MySQL 提示符中执行：
```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS logitrack 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 查看数据库
SHOW DATABASES;

-- 退出
exit;
```

### 3.3 执行建表脚本

在项目根目录下：
```cmd
cd %USERPROFILE%\Projects\LogiTrack-\database

mysql -u root -pldf123 logitrack < schema.sql
```

### 3.4 验证表创建

```cmd
mysql -u root -pldf123 -D logitrack -e "SHOW TABLES;"
```

应该看到：
```
+--------------------+
| Tables_in_logitrack|
+--------------------+
| enquiry_records    |
+--------------------+
```

### 3.5 导入测试数据

在 `database` 目录下：
```cmd
python import_csv_pymysql.py
```

您应该看到：
```
成功连接到 MySQL 数据库
正在读取 CSV 文件...
成功导入 5 条记录
```

### 3.6 验证数据

```cmd
mysql -u root -pldf123 -D logitrack -e "SELECT COUNT(*) FROM enquiry_records;"
```

应该显示 5 条记录。

---

## 🔧 第四步：配置并启动后端

### 4.1 配置数据库连接

编辑 `backend\src\main\resources\application.properties`:

```cmd
cd %USERPROFILE%\Projects\LogiTrack-\backend\src\main\resources
notepad application.properties
```

确保内容为：
```properties
# 服务器配置
server.port=8080

# MySQL 数据库配置
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=ldf123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate 配置
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true

# 连接池配置
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# 日志配置
logging.level.com.logitrack.backend=INFO
logging.level.org.springframework.web=INFO
```

⚠️ **注意**: 如果您设置的 MySQL 密码不是 `ldf123`，请修改 `spring.datasource.password`

### 4.2 构建后端项目

在项目根目录：
```cmd
cd %USERPROFILE%\Projects\LogiTrack-\backend
mvn clean package -DskipTests
```

这将下载依赖并构建项目（首次运行可能需要 5-10 分钟）。

### 4.3 启动后端服务

#### 方式一：使用 Maven (开发模式)
```cmd
mvn spring-boot:run
```

#### 方式二：使用 JAR 文件 (生产模式)
```cmd
java -jar target\logitrack-backend-0.0.1-SNAPSHOT.jar
```

### 4.4 验证后端运行

打开新的命令提示符窗口：
```cmd
curl http://localhost:8080/api/enquiries
```

或在浏览器中访问: http://localhost:8080/api/enquiries

您应该看到 JSON 格式的 5 条记录数据。

---

## 🎨 第五步：配置并启动前端

### 5.1 安装前端依赖

打开**新的命令提示符窗口**（保持后端运行）：
```cmd
cd %USERPROFILE%\Projects\LogiTrack-\logitrack-pro
npm install
```

这将下载所有 Node.js 依赖（可能需要 3-5 分钟）。

### 5.2 验证配置文件

确保 `vite.config.ts` 配置正确：
```cmd
notepad vite.config.ts
```

应该包含代理配置：
```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      // ... 其他配置
    };
});
```

### 5.3 启动前端开发服务器

```cmd
npm run dev
```

您应该看到：
```
  VITE v6.4.1  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

---

## 🚀 第六步：访问系统

### 6.1 打开浏览器

推荐使用 **Chrome**、**Edge** 或 **Firefox**。

访问: **http://localhost:3000**

### 6.2 登录系统

- 点击 **Login** 按钮（密码随意，系统为演示模式）

### 6.3 验证功能

您应该看到：
- ✅ **Dashboard** 页面
- ✅ **Total Enquiries**: 5
- ✅ **Recent Enquiries** 表格显示 5 条记录
- ✅ 可以点击记录进行编辑
- ✅ 可以复制记录
- ✅ 可以创建新记录

---

## 🔍 第七步：系统验证检查清单

### 7.1 后端验证

在浏览器中测试以下 API：

1. **获取所有记录**:
   ```
   http://localhost:8080/api/enquiries
   ```
   应返回 5 条 JSON 记录

2. **按状态查询**:
   ```
   http://localhost:8080/api/enquiries/status/Quoted
   ```

3. **创建记录** (使用 Postman 或 curl):
   ```cmd
   curl -X POST http://localhost:8080/api/enquiries ^
     -H "Content-Type: application/json" ^
     -d "{\"referenceNumber\":\"TEST001\",\"status\":\"New\",\"product\":\"AIR\"}"
   ```

### 7.2 前端验证

- [ ] Dashboard 正确显示统计数据
- [ ] Recent Enquiries 表格可以滚动和查看
- [ ] 搜索功能正常（输入参考号、国家或状态）
- [ ] 点击 "New Enquiry" 可以打开表单
- [ ] 表单可以填写并提交
- [ ] 编辑功能正常
- [ ] 复制功能正常

### 7.3 数据库验证

```cmd
mysql -u root -pldf123 -D logitrack -e "SELECT reference_number, status, product FROM enquiry_records LIMIT 5;"
```

---

## 🛠️ 常见问题排查

### 问题 1: MySQL 无法启动

**解决方案**:
```cmd
# 查看服务状态
sc query MySQL80

# 尝试手动启动
net start MySQL80

# 检查错误日志
notepad "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err"
```

### 问题 2: 后端启动失败 - 端口占用

**错误信息**: `Port 8080 is already in use`

**解决方案**:
```cmd
# 查找占用 8080 端口的进程
netstat -ano | findstr :8080

# 结束进程 (PID 从上一步获取)
taskkill /PID <PID> /F

# 或修改端口
# 编辑 application.properties: server.port=8081
```

### 问题 3: Maven 下载依赖慢

**解决方案**: 配置国内镜像源

编辑 `%USERPROFILE%\.m2\settings.xml`:
```xml
<mirrors>
  <mirror>
    <id>aliyun</id>
    <mirrorOf>central</mirrorOf>
    <name>Aliyun Maven</name>
    <url>https://maven.aliyun.com/repository/public</url>
  </mirror>
</mirrors>
```

### 问题 4: npm 安装慢

**解决方案**: 使用淘宝镜像
```cmd
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题 5: 前端无法访问后端 API

**检查步骤**:
1. 确认后端正在运行: `curl http://localhost:8080/api/enquiries`
2. 检查浏览器控制台 (F12) 是否有 CORS 错误
3. 确认 Vite 代理配置正确
4. 重启前端服务

### 问题 6: Python 脚本无法运行

**解决方案**:
```cmd
# 确认 Python 在 PATH 中
python --version

# 安装缺失的包
pip install pandas pymysql cryptography

# 如果提示找不到 python，尝试
python3 --version
py --version
```

---

## 📝 生产环境部署建议

### 1. 数据库优化

- 修改 MySQL root 密码为强密码
- 创建专用数据库用户而非使用 root
- 配置定期备份

```sql
-- 创建专用用户
CREATE USER 'logitrack_app'@'localhost' IDENTIFIED BY '强密码';
GRANT ALL PRIVILEGES ON logitrack.* TO 'logitrack_app'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 后端生产配置

创建 `application-prod.properties`:
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
spring.datasource.username=logitrack_app
spring.datasource.password=您的强密码
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.root=WARN
logging.level.com.logitrack.backend=INFO
```

构建生产版本:
```cmd
mvn clean package -Pprod
```

### 3. 前端生产构建

```cmd
cd logitrack-pro
npm run build
```

构建完成后，`dist` 目录包含所有静态文件，可部署到：
- IIS
- Nginx
- Apache
- 或任何静态文件托管服务

### 4. 使用 Windows 服务

将后端配置为 Windows 服务，使其开机自启：

1. 下载 **NSSM** (Non-Sucking Service Manager): https://nssm.cc/download
2. 安装服务:
   ```cmd
   nssm install LogiTrackBackend "C:\Program Files\Java\jdk-21\bin\java.exe"
   nssm set LogiTrackBackend AppParameters "-jar C:\Projects\LogiTrack-\backend\target\logitrack-backend-0.0.1-SNAPSHOT.jar"
   nssm set LogiTrackBackend AppDirectory "C:\Projects\LogiTrack-\backend"
   nssm start LogiTrackBackend
   ```

---

## 📞 技术支持

### 系统架构
- **后端**: Spring Boot 3.2.0 + MySQL 8.0
- **前端**: React 19 + TypeScript + Vite
- **端口**: 后端 8080, 前端 3000

### 项目仓库
- GitHub: https://github.com/dornach-Davian-Liang/LogiTrack-

### 日志位置
- **后端日志**: 控制台输出
- **MySQL日志**: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.log`
- **前端日志**: 浏览器开发者工具 (F12)

---

## ✅ 部署完成检查清单

部署完成后，确认以下所有项目：

- [ ] Java 21 已安装并配置环境变量
- [ ] Maven 3.9+ 已安装并可用
- [ ] Node.js 18+ 和 npm 已安装
- [ ] MySQL 8.0 已安装并运行
- [ ] Git 已安装
- [ ] Python 3.8+ 及相关包已安装
- [ ] 项目代码已从 GitHub 克隆
- [ ] 数据库 `logitrack` 已创建
- [ ] 表 `enquiry_records` 已创建
- [ ] 测试数据 (5条记录) 已导入
- [ ] 后端在 http://localhost:8080 正常运行
- [ ] 前端在 http://localhost:3000 正常运行
- [ ] 可以在浏览器中访问并操作系统
- [ ] API 端点响应正常
- [ ] 前端可以显示数据库中的记录
- [ ] 可以创建、编辑、复制记录

**恭喜! 🎉 LogiTrack 系统已成功部署在您的 Windows 机器上！**
