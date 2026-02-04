# Bug修复报告 - 2026-02-02

## 问题概述

用户报告了两个关键问题：
1. **保存数据时报错500**：错误信息 "Column 'container_qty' cannot be null"
2. **列表不显示数据**：EnquiryList组件没有显示数据库中已有的10条记录

## 问题分析

### 问题1：Container Lines保存失败

**根本原因**：前端与后端之间的字段映射不匹配，以及后端实体与数据库schema不一致

**问题链**：
1. 前端 `EnquiryForm.tsx` 中容器行使用 `quantity` 字段
2. 后端 `EnquiryContainerLine` 实体期望 `containerQty` 字段
3. 后端实体缺少数据库必填字段：`container_code` 和 `teu_per_unit`
4. 后端Service缺少对其他必填字段的默认值设置

### 问题2：列表显示问题

**根本原因**：需要通过浏览器测试验证（已添加debug日志）

## 修复措施

### 1. 前端字段映射修复

**文件**：`/workspaces/LogiTrack-/logitrack-pro/components/enquiry/EnquiryForm.tsx` (line 372-380)

```typescript
// 修复前：直接使用quantity字段，字段名不匹配
enquiryToSubmit.containerLines = enquiryToSubmit.containerLines.map(...)

// 修复后：明确映射字段名
enquiryToSubmit.containerLines = enquiryToSubmit.containerLines.map((line: any) => ({
  containerTypeId: line.containerTypeId,
  containerQty: line.quantity || line.containerQty || 1,  // ✅ 明确映射
  rawText: line.rawText || null,
}));
```

### 2. 后端实体完整性修复

**文件**：`/workspaces/LogiTrack-/backend/src/main/java/com/logitrack/backend/entity/EnquiryContainerLine.java`

添加了数据库必填字段：
```java
@Column(name = "container_code", length = 20, nullable = false)
private String containerCode;

@Column(name = "teu_per_unit", precision = 6, scale = 2, nullable = false)
private java.math.BigDecimal teuPerUnit;
```

### 3. 后端Service逻辑增强

**文件**：`/workspaces/LogiTrack-/backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`

#### 3.1 Container Lines字段填充 (lines 138-160)

```java
// 查询ContainerType获取containerCode和teuPerUnit
if (line.getContainerTypeId() != null) {
    Optional<ContainerType> maybeCt = containerTypeRepository.findById(line.getContainerTypeId());
    if (maybeCt.isPresent()) {
        ContainerType ct = maybeCt.get();
        
        // 填充containerCode (必填字段)
        if (line.getContainerCode() == null || line.getContainerCode().isEmpty()) {
            line.setContainerCode(ct.getContainerCode());
        }
        
        // 填充teuPerUnit (必填字段)
        if (line.getTeuPerUnit() == null) {
            line.setTeuPerUnit(ct.getTeuValue() != null ? ct.getTeuValue() : BigDecimal.ONE);
        }
    }
}
```

#### 3.2 Enquiry必填字段默认值设置 (lines 83-110)

```java
// 设置所有数据库NOT NULL字段的默认值
if (enquiry.getAssignedCnOfficeCode() == null || enquiry.getAssignedCnOfficeCode().isEmpty()) {
    enquiry.setAssignedCnOfficeCode("SHANGHAI");
}
if (enquiry.getCargoTypeCode() == null || enquiry.getCargoTypeCode().isEmpty()) {
    enquiry.setCargoTypeCode("FCL");
}
if (enquiry.getCnPricingAdmin() == null || enquiry.getCnPricingAdmin().isEmpty()) {
    enquiry.setCnPricingAdmin("SYSTEM_ADMIN");
}
if (enquiry.getSalesCountryCode() == null || enquiry.getSalesCountryCode().isEmpty()) {
    enquiry.setSalesCountryCode("CN");
}
if (enquiry.getSalesOfficeId() == null) {
    enquiry.setSalesOfficeId(1);
}
if (enquiry.getPolId() == null) {
    enquiry.setPolId(1);
}
if (enquiry.getPodId() == null) {
    enquiry.setPodId(1);
}
if (enquiry.getBookingConfirmed() == null) {
    enquiry.setBookingConfirmed(Enquiry.BookingConfirmed.Pending);
}
if (enquiry.getStatus() == null) {
    enquiry.setStatus(Enquiry.EnquiryStatus.New);
}
if (enquiry.getEnquiryReceivedDate() == null) {
    enquiry.setEnquiryReceivedDate(LocalDate.now());
}
```

### 4. 前端调试增强

**文件**：`/workspaces/LogiTrack-/logitrack-pro/components/enquiry/EnquiryList.tsx` (lines 42-47)

添加了详细的控制台日志：
```typescript
console.log('[EnquiryList] API response:', {
  totalElements: response.totalElements,
  totalPages: response.totalPages,
  contentLength: response.content?.length,
  firstItem: response.content?.[0]
});
```

## 测试结果

### API测试

#### 1. 创建测试（通过curl）
```bash
# 测试1：基本创建
curl -X POST http://localhost:8888/api/enquiries -H "Content-Type: application/json" -d '{...}'
# 结果：✅ 成功创建 ID=19，HTTP 201

# 测试2：多个container lines
curl -X POST http://localhost:8888/api/enquiries -H "Content-Type: application/json" -d '{...}'
# 结果：✅ 成功创建 ID=20，包含2个container lines

# 测试3：不同产品类型
curl -X POST http://localhost:8888/api/enquiries -H "Content-Type: application/json" -d '{...}'
# 结果：✅ 成功创建 ID=21
```

#### 2. 列表查询测试
```bash
curl -s 'http://localhost:8888/api/enquiries?page=0&size=20'
# 结果：✅ 返回13条记录（原10条 + 新增3条）
```

### 数据库验证

```sql
SELECT e.id, e.reference_number, e.status, COUNT(c.id) as container_count 
FROM enquiry e 
LEFT JOIN enquiry_container_line c ON e.id = c.enquiry_id 
WHERE e.id >= 19 
GROUP BY e.id;
```

结果：
```
id | reference_number | status | container_count
19 | CN2602001-A      | New    | 1
20 | CN2602002-S      | New    | 2
21 | CN2602003-A      | New    | 1
```

### 创建的测试数据详情

| ID | Reference Number | Sales PIC | Booking Party | Product | Container Lines | Status |
|----|-----------------|-----------|---------------|---------|----------------|--------|
| 19 | CN2602001-A | API Test User | Test Company Ltd | AIR | 2x20GP | New |
| 20 | CN2602002-S | 张三 | 上海进出口有限公司 | SEA | 5x20GP, 3x40GP | New |
| 21 | CN2602003-A | 李四 | 北京国际贸易公司 | AIR | 2x40HC | New |

## 问题根源分析

### Schema文档不完整

**发现**：`schema_v2.sql` 文件对 `enquiry_container_line` 表的定义不完整

- **文档中的字段**（6个）：id, enquiry_id, container_type_id, container_qty, raw_text, created_at
- **实际数据库字段**（9个）：以上6个 + container_code, teu_per_unit, teu_total

**影响**：
- 后端开发人员基于不完整的schema文件创建实体类
- 导致实体类缺少必填字段
- 插入数据时触发NOT NULL约束违反

**建议**：
1. 更新 `schema_v2.sql` 文件，确保文档与实际数据库一致
2. 使用数据库反向工程工具自动生成schema文档
3. 建立CI/CD检查，验证实体类与数据库schema的一致性

## 部署步骤

### 1. 编译后端
```bash
cd /workspaces/LogiTrack-/backend
mvn clean package -DskipTests
```

### 2. 重启后端
```bash
pkill -f "java -jar.*logitrack"
cd /workspaces/LogiTrack-/backend
nohup java -jar target/logitrack-backend-1.0.0.jar --spring.profiles.active=mysql > backend.log 2>&1 &
```

### 3. 启动前端
```bash
cd /workspaces/LogiTrack-/logitrack-pro
npm run dev
```

### 4. 验证服务状态
```bash
# 检查后端健康
curl http://localhost:8888/actuator/health

# 检查前端
curl http://localhost:3000
```

## 待完成任务

### 高优先级
- [ ] 通过浏览器测试EnquiryList组件的显示功能
- [ ] 验证前端表单UI创建enquiry的完整流程
- [ ] 测试EnquiryDetail页面的5个tab显示

### 中优先级
- [ ] 更新 `schema_v2.sql` 文档，补充缺失的字段定义
- [ ] 创建数据库schema验证脚本
- [ ] 添加单元测试覆盖新的Service逻辑

### 低优先级
- [ ] 优化默认值策略（考虑从配置文件读取）
- [ ] 添加字段验证逻辑
- [ ] 改进错误消息的用户友好性

## 经验教训

1. **始终验证实际数据库schema**：不要完全依赖文档，使用 `DESC table_name` 验证实际结构
2. **字段映射要明确**：前后端使用不同命名风格时，在数据传输边界处明确映射
3. **必填字段要有默认值**：对于数据库NOT NULL字段，在Service层提供合理的默认值
4. **增量修复要彻底测试**：修复一个问题后，要立即测试是否引入新问题

## 技术栈信息

- **后端**: Spring Boot 3.2.0, Java 17, MySQL 8.0
- **前端**: React 19.2.0, TypeScript, Vite 6.4.1
- **数据库**: MySQL 8.0 (Docker容器: logitrack-mysql)
- **端口**: 后端 8888, 前端 3000, MySQL 3306

## 联系人

- **修复日期**: 2026-02-02
- **修复人员**: GitHub Copilot
- **测试状态**: API测试通过 ✅ | UI测试待验证 ⏳
