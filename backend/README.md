# LogiTrack Backend

Spring Boot 后端服务，为 LogiTrack Pro 物流管理系统提供 RESTful API。

## 技术栈

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **H2 Database** (开发环境)
- **Maven**
- **Lombok**

## 项目结构

```
backend/
├── src/
│   └── main/
│       ├── java/com/logitrack/backend/
│       │   ├── LogiTrackApplication.java       # 主应用程序入口
│       │   ├── entity/
│       │   │   └── EnquiryRecord.java          # 实体类
│       │   ├── repository/
│       │   │   └── EnquiryRepository.java      # JPA Repository
│       │   ├── service/
│       │   │   └── EnquiryService.java         # 业务逻辑层
│       │   ├── controller/
│       │   │   └── EnquiryController.java      # REST API 控制器
│       │   └── config/
│       │       ├── WebConfig.java              # CORS 配置
│       │       └── DataInitializer.java        # 初始数据加载
│       └── resources/
│           └── application.properties          # 应用配置
├── pom.xml                                     # Maven 依赖配置
└── start-backend.sh                            # 启动脚本
```

## 前置要求

- Java 17 或更高版本
- Maven 3.6+

### 安装 Java 和 Maven

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk maven
```

**MacOS:**
```bash
brew install openjdk@17 maven
```

**验证安装:**
```bash
java -version
mvn -version
```

## 快速开始

### 方法 1: 使用启动脚本 (推荐)

```bash
cd backend
chmod +x start-backend.sh
./start-backend.sh
```

### 方法 2: 使用 Maven 命令

```bash
cd backend

# 构建项目
mvn clean install

# 运行应用
mvn spring-boot:run
```

### 方法 3: 使用打包的 JAR

```bash
cd backend

# 打包
mvn clean package

# 运行
java -jar target/logitrack-backend-1.0.0.jar
```

## API 端点

后端服务运行在 `http://localhost:8080`

### 询价记录 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/enquiries` | 获取所有询价记录 |
| GET | `/api/enquiries/{id}` | 根据 ID 获取询价记录 |
| POST | `/api/enquiries` | 创建新询价记录 |
| PUT | `/api/enquiries/{id}` | 更新询价记录 |
| DELETE | `/api/enquiries/{id}` | 删除询价记录 |
| GET | `/api/enquiries/status/{status}` | 根据状态筛选 |
| GET | `/api/enquiries/booking/{bookingStatus}` | 根据预订状态筛选 |

### 示例请求

**获取所有记录:**
```bash
curl http://localhost:8080/api/enquiries
```

**创建新记录:**
```bash
curl -X POST http://localhost:8080/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "referenceNumber": "CN2401011-A",
    "product": "SEA",
    "status": "New",
    "salesCountry": "USA",
    "commodity": "Electronics"
  }'
```

**更新记录:**
```bash
curl -X PUT http://localhost:8080/api/enquiries/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "id": "xxx",
    "status": "Quoted",
    ...
  }'
```

## 数据库访问

### H2 控制台

开发环境使用 H2 内存数据库，可以通过 H2 控制台查看数据：

- **URL:** http://localhost:8080/h2-console
- **JDBC URL:** `jdbc:h2:mem:logitrack`
- **用户名:** `sa`
- **密码:** (留空)

## 配置

### application.properties

主要配置项：

```properties
# 服务器端口
server.port=8080

# 数据库配置
spring.datasource.url=jdbc:h2:mem:logitrack
spring.datasource.username=sa
spring.datasource.password=

# JPA 配置
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true

# H2 控制台
spring.h2.console.enabled=true
```

### CORS 配置

已配置允许来自前端的跨域请求：
- `http://localhost:5173` (Vite 默认端口)
- `http://localhost:3000`

## 初始数据

应用启动时会自动加载 5 条示例询价记录，由 `DataInitializer.java` 负责初始化。

## 开发说明

### 添加新字段

1. 在 `EnquiryRecord.java` 实体类中添加字段
2. 重启应用，H2 会自动更新表结构

### 切换到 MySQL

1. 修改 `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
```

2. 确保 MySQL 数据库已创建：
```sql
CREATE DATABASE logitrack;
```

## 测试

运行单元测试：
```bash
mvn test
```

## 打包部署

创建生产环境 JAR：
```bash
mvn clean package -DskipTests
```

生成的 JAR 文件位于 `target/logitrack-backend-1.0.0.jar`

## 日志

日志级别在 `application.properties` 中配置：

```properties
logging.level.com.logitrack=DEBUG
logging.level.org.springframework.web=INFO
```

## 故障排除

### 端口已被占用

如果 8080 端口已被占用，可以在 `application.properties` 中修改：
```properties
server.port=8081
```

同时需要更新前端的 `dataService.ts` 中的 `API_BASE_URL`。

### 构建失败

清理 Maven 缓存并重新构建：
```bash
mvn clean
rm -rf ~/.m2/repository
mvn install
```

## 许可证

MIT License
