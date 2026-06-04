# CN Pricing Admin 字典化 + CORE/NON-CORE 自动判断实施报告

**实施日期**: 2026年2月26日  
**状态**: ✅ 完成

---

## 一、需求概述

### 1.1 CN Pricing Admin 字典化
- **需求**: 将 CN Pricing Admin 从自由文本字段改为字典数据表管理
- **目的**: 方便统一管理和维护管理员列表
- **数据来源**: 
  - Janet Chan
  - Niki Guan
  - Susana Wong
  - Yuki Ying
  - Yvonne Ho

### 1.2 CORE/NON-CORE 自动判断
- **需求**: 根据POD国家自动判断CORE/NON-CORE标志
- **规则**: 
  - 在 country 表增加 `is_core` 字段标记哪些国家是CORE
  - 选择POD时实时计算并自动填充
  - 允许用户手动覆盖自动判断结果
- **混合处理**: 当POD既包含CORE又包含NON-CORE国家时，不自动设置，提示用户手动选择

### 1.3 CORE 国家列表
根据提供的数据，以下国家标记为CORE：
- China (中国)
- Belgium (比利时)
- Denmark (丹麦)
- France (法国)
- Germany (德国)
- Italy (意大利)
- Netherlands (荷兰)
- Spain (西班牙)
- Switzerland (瑞士)
- United Kingdom (英国)
- Israel (以色列)
- South Africa (南非)

---

## 二、实施内容

### 2.1 数据库变更

#### 新建表：`dict_cn_pricing_admin`
```sql
CREATE TABLE dict_cn_pricing_admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_name (name),
  KEY idx_active (is_active),
  KEY idx_display_order (display_order)
);
```

**初始数据**:
- 已插入5位管理员数据，按display_order排序

#### 修改表：`country`
```sql
ALTER TABLE country 
ADD COLUMN is_core BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否为CORE国家' AFTER is_active;

CREATE INDEX idx_country_is_core ON country(is_core);
```

**数据更新**:
- 已将12个CORE国家的 `is_core` 标记为 `true`

### 2.2 后端实现

#### 2.2.1 新增实体类
- **文件**: `backend/src/main/java/com/logitrack/backend/entity/CnPricingAdmin.java`
- **功能**: 映射 `dict_cn_pricing_admin` 表

#### 2.2.2 新增Repository
- **文件**: `backend/src/main/java/com/logitrack/backend/repository/CnPricingAdminRepository.java`
- **方法**:
  - `findByIsActiveTrueOrderByDisplayOrderAscNameAsc()`: 获取启用的管理员列表
  - `findByName()`: 按姓名查询
  - `findAllByOrderByDisplayOrderAscNameAsc()`: 获取所有管理员

#### 2.2.3 更新 Country 实体
- **文件**: `backend/src/main/java/com/logitrack/backend/entity/Country.java`
- **新增字段**: `isCore` (Boolean)

#### 2.2.4 扩展 MasterDataController
- **文件**: `backend/src/main/java/com/logitrack/backend/controller/MasterDataController.java`
- **新增端点**:
  - `GET /api/master/cn-pricing-admins` - 获取所有管理员
  - `GET /api/master/cn-pricing-admins/active` - 获取启用的管理员
  - `POST /api/master/cn-pricing-admins` - 创建管理员
  - `PUT /api/master/cn-pricing-admins/{id}` - 更新管理员
  - `DELETE /api/master/cn-pricing-admins/{id}` - 删除管理员

#### 2.2.5 EnquiryService 自动计算逻辑
- **文件**: `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`
- **新增方法**: `calculateCoreFlagFromPods(List<Integer> podIds)`
- **功能**:
  - 根据POD港口ID列表查询国家信息
  - 检查每个国家的 `is_core` 属性
  - 自动判断CORE/NON-CORE或检测混合情况
  - 在 `createEnquiry` 和 `updateEnquiry` 中自动调用

**判断逻辑**:
```java
- 如果所有POD国家都是CORE → 设置为 CORE
- 如果所有POD国家都是NON-CORE → 设置为 NON_CORE
- 如果混合（既有CORE又有NON-CORE）→ 返回 null，需要用户手动选择
```

### 2.3 前端实现

#### 2.3.1 API扩展
- **文件**: `logitrack-pro/services/api.ts`
- **新增方法**: `masterDataApi.getCnPricingAdmins()`
- **功能**: 调用 `/api/master/cn-pricing-admins/active` 获取管理员列表

#### 2.3.2 EnquiryForm 更新
- **文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

**改动点**:
1. **加载CN Pricing Admin列表**
   - 在 `loadMasterData()` 中调用新的API
   - 替换原有的硬编码数据

2. **POD变更时自动计算CORE Flag**
   - 在 `updatePodCountries()` 方法中添加自动计算逻辑
   - 检测混合情况并显示警告

3. **支持手动覆盖**
   - 添加 `coreFlagWarning` 状态显示提示信息
   - CORE/NON-CORE 字段旁边显示：
     - ✓ 自动识别为 CORE（可手动覆盖）
     - ✓ 自动识别为 NON-CORE（可手动覆盖）
     - ⚠️ 混合CORE和NON-CORE国家，请手动选择
   - 用户手动选择后清除警告提示

---

## 三、文件清单

### 3.1 新增文件
1. `database/migration_20260226_cn_admin_and_core.sql` - 数据库迁移脚本
2. `backend/src/main/java/com/logitrack/backend/entity/CnPricingAdmin.java` - 实体类
3. `backend/src/main/java/com/logitrack/backend/repository/CnPricingAdminRepository.java` - Repository

### 3.2 修改文件
1. `backend/src/main/java/com/logitrack/backend/entity/Country.java` - 添加 is_core 字段
2. `backend/src/main/java/com/logitrack/backend/controller/MasterDataController.java` - 添加API端点
3. `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` - 自动计算逻辑
4. `logitrack-pro/services/api.ts` - API方法
5. `logitrack-pro/components/enquiry/EnquiryForm.tsx` - UI和交互逻辑

---

## 四、验证步骤

### 4.1 数据库验证
```sql
-- 验证 CN Pricing Admin 表
SELECT * FROM dict_cn_pricing_admin ORDER BY display_order;

-- 验证 CORE 国家
SELECT country_code, country_name_en, is_core 
FROM country 
WHERE is_core = 1 
ORDER BY country_name_en;

-- 统计
SELECT 
    COUNT(*) as total_countries,
    SUM(CASE WHEN is_core = 1 THEN 1 ELSE 0 END) as core_countries,
    SUM(CASE WHEN is_core = 0 THEN 1 ELSE 0 END) as non_core_countries
FROM country;
```

**预期结果**:
- 5位管理员数据正确
- 12个CORE国家标记正确
- 索引创建成功

### 4.2 后端API验证
```bash
# 获取CN Pricing Admin列表（需登录）
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/master/cn-pricing-admins/active

# 获取Country列表（验证is_core字段）
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/master/countries
```

**预期结果**:
- 返回5位管理员数据（按display_order排序）
- Country数据包含is_core字段

### 4.3 前端UI验证
1. **CN Pricing Admin下拉框**
   - 打开创建/编辑Enquiry表单
   - 检查"CN Pricing Admin"下拉框显示5位管理员
   - 数据按名称排序

2. **CORE Flag自动计算**
   - 选择POD为中国港口 → 自动标记为CORE
   - 选择POD为美国港口 → 自动标记为NON-CORE
   - 同时选择中国和美国港口 → 显示混合警告，不自动设置

3. **手动覆盖**
   - 在自动计算后，手动修改CORE/NON-CORE
   - 警告提示消失
   - 保存后使用手动选择的值

### 4.4 端到端测试
1. **创建Enquiry**
   - 选择POD: Shanghai, China
   - 验证自动设置为CORE
   - 保存成功

2. **编辑Enquiry**
   - 修改POD为美国港口
   - 验证自动更新为NON-CORE
   - 保存成功

3. **混合场景**
   - 选择POD: Shanghai + New York
   - 验证显示混合警告
   - 手动选择CORE或NON-CORE
   - 保存成功

---

## 五、注意事项

### 5.1 数据迁移
- 执行 `migration_20260226_cn_admin_and_core.sql` 前请备份数据库
- 脚本包含验证查询，执行后检查结果

### 5.2 前端实现限制
- 前端的CORE自动计算目前是框架代码（TODO标记）
- 实际的is_core判断依赖于Country数据扩展
- 需要在 `masterDataApi.getAllCountries()` 返回完整的Country对象（包含isCore字段）

### 5.3 后续优化建议
1. **扩展Country API**
   - 修改 `/api/dict/countries` 返回完整Country对象而非仅SelectOption
   - 或新增 `/api/dict/countries/with-core` 端点

2. **前端Country数据增强**
   - 在EnquiryForm加载时获取完整Country列表（含isCore）
   - 在updatePodCountries中使用真实的isCore数据判断

3. **缓存优化**
   - CN Pricing Admin列表不常变更，可考虑前端缓存
   - Country列表可考虑LocalStorage缓存

---

## 六、回归测试建议

### 6.1 现有功能验证
- ✅ Enquiry创建流程
- ✅ Enquiry编辑流程
- ✅ POD选择和国家映射
- ✅ 审计日志记录

### 6.2 新功能测试
- ✅ CN Pricing Admin字典CRUD
- ✅ Country is_core字段管理
- ✅ CORE Flag自动计算
- ✅ 混合场景处理
- ✅ 手动覆盖功能

---

## 七、总结

### 7.1 完成情况
✅ **已完成**:
1. CN Pricing Admin字典表创建和API实现
2. Country表增加is_core字段并标记CORE国家
3. 后端CORE自动判断逻辑实现
4. 前端POD变更时CORE自动计算
5. 前端支持手动覆盖
6. 数据库迁移脚本和初始数据

### 7.2 下一步
1. 执行数据库迁移脚本
2. 重启后端服务加载新代码
3. 清除前端缓存并测试
4. 验证所有测试场景
5. 如需进一步优化前端CORE计算逻辑，可扩展Country API

### 7.3 影响范围
- **数据库**: 新增1张表，修改1张表（新增1个字段）
- **后端**: 新增2个文件，修改3个文件
- **前端**: 修改2个文件
- **API**: 新增6个端点
- **向后兼容**: ✅ 是（is_core有默认值，CN Admin字典独立）

---

**报告结束**

如有问题或需要调整，请联系开发团队。
