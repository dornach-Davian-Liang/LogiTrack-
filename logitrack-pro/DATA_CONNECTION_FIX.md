# 数据连接和POD映射修复验证

## ✅ 已修复的问题

### 1. POD Country 自动映射失败
**原因:** `countries` 数组只包含有销售人员的国家（FR, UK, DE, AGENTS），不包含CN等其他国家

**修复:**
- 添加 `masterDataApi.getAllCountries()` 返回完整国家列表
- EnquiryForm 现在加载两个列表：
  - `salesCountries`: 用于销售国家下拉框（仅有销售人员的国家）
  - `allCountries`: 用于POD Country映射（所有国家）
- `updatePodCountries()` 现在使用 `allCountries` 查找

**验证步骤:**
1. 打开 http://localhost:3000
2. 点击 "New Enquiry"
3. 在路线信息区块选择 POD = "Shanghai, CN"
4. 查看 "目的港国家 (POD Country)" 字段
5. **预期结果:** 显示 "CHINA" 而不是空白
6. **Console日志验证:**
   ```
   Looking for country CN, found: {value: "CN", label: "CHINA"}
   Final country names: CHINA
   ```

---

### 2. POL/POD 和销售数据"未连接数据库"

**当前状态:** 使用 MOCK 数据模式
- 文件: `/logitrack-pro/services/api.ts`
- 配置: `const USE_MOCK_DATA = true;` (Line 39)

**如何连接真实数据库:**

#### 方法1: 关闭 MOCK 模式（推荐 - 如果后端已就绪）

编辑 `api.ts` line 39:
```typescript
const USE_MOCK_DATA = false; // 改为 false
```

这将自动调用真实API：
- `/api/master/countries` - 所有国家
- `/api/master/sales-countries` - 销售国家
- `/api/master/ports?portType=SEA&keyword=` - 港口数据
- `/api/master/sales-pics?countryCode=FR` - 销售负责人
- `/api/enquiries` - Enquiry CRUD

#### 方法2: 验证后端API是否就绪

```bash
# 测试后端端点
curl http://localhost:8888/api/master/countries
curl http://localhost:8888/api/master/sales-countries
curl http://localhost:8888/api/master/ports?portType=SEA&keyword=
curl http://localhost:8888/api/enquiries?page=0&size=10
```

如果返回正确的JSON数据，则可以安全地关闭MOCK模式。

#### 方法3: 混合模式（部分API使用真实数据）

在 `api.ts` 中为特定API设置独立开关：
```typescript
export const masterDataApi = {
  getAllCountries: async (): Promise<SelectOption[]> => {
    // if (USE_MOCK_DATA) { ... }  // 注释掉这行
    return request<SelectOption[]>('/master/countries'); // 总是调用真实API
  },
  // ... 其他方法类似
};
```

---

### 3. Enquiry 创建后不显示在列表

**检查点:**

1. **提交是否成功?**
   - 打开浏览器 DevTools → Network 标签
   - 提交表单时查看 `POST /api/enquiries` 请求
   - **成功:** Status 200/201，返回包含 `id` 和 `referenceNumber` 的对象
   - **失败:** Status 4xx/5xx，查看错误消息

2. **MOCK模式验证:**
   - MOCK模式下，新数据保存在内存中：`MOCK_ENQUIRIES.unshift(newEnquiry)`
   - 刷新页面会丢失数据（因为内存重置）
   - **解决方案:** 关闭MOCK模式使用真实数据库

3. **真实数据库模式验证:**
   ```bash
   # 检查MySQL数据
   docker exec -it mysql_logitrack mysql -u root -p
   > USE logitrack;
   > SELECT reference_number, status, sales_pic_name, pod_country_name 
   > FROM enquiry 
   > ORDER BY id DESC 
   > LIMIT 5;
   ```

---

## 🧪 完整测试流程

### 测试1: POD Country 自动映射

```javascript
// 浏览器 Console 执行
// 1. 选择一个中国港口 (Shanghai)
// 2. 查看 Console 输出
// 预期: Looking for country CN, found: {value: "CN", label: "CHINA"}

// 3. 选择多个不同国家港口 (Le Havre + Hamburg)
// 预期: Final country names: FRANCE, GERMANY
```

### 测试2: 销售级联选择

1. 选择销售国家 = "FRANCE"
2. **验证:** Sales PIC 下拉框加载 JEAN DUPONT, MARIE MARTIN
3. 选择 Sales PIC = "JEAN DUPONT"  
4. **验证:** 自动填充 Sales Office = "ZIEGLER FRANCE"

### 测试3: Enquiry 创建和列表

**MOCK 模式测试:**
```bash
# 1. 填写并提交表单
# 2. 不要刷新页面
# 3. 返回 Enquiry Management
# 4. 验证: 新记录出现在列表顶部
# 5. 刷新页面
# 6. 验证: MOCK数据丢失（正常）
```

**真实数据库测试:**
```bash
# 1. 设置 USE_MOCK_DATA = false
# 2. 重启前端服务
# 3. 填写并提交表单
# 4. 刷新页面
# 5. 验证: 数据仍然存在
# 6. 检查MySQL: SELECT * FROM enquiry ORDER BY id DESC LIMIT 1;
```

---

## 🔍 调试技巧

### Console 日志位置

**POD Country 映射日志:**
- `EnquiryForm.tsx` line 269-289
- 包含: ports数组、countries数组、匹配结果

**API 请求日志:**
```javascript
// 在 api.ts 的 request() 函数中添加:
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 API Request:', url, options); // 添加这行
  
  const response = await fetch(url, { ...options });
  const data = await response.json();
  console.log('✅ API Response:', data); // 添加这行
  return data;
}
```

### 常见问题

**Q: POD Country 仍然为空**
- 确认 `allCountries` 数组包含所需国家代码
- 检查 `portCode` 和 `countryCode` 是否匹配
- 验证大小写（已处理 toUpperCase）

**Q: 销售国家下拉框为空**
- 检查 `MOCK_SALES_PICS` 是否有数据
- 验证 `getSalesCountries()` 返回值
- 确认 `salesCountries` state 已更新

**Q: Enquiry 提交后报错**
- 查看 Network → Response 标签的错误信息
- 验证后端服务是否运行 (port 8888)
- 检查数据库连接状态

---

## 📋 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `services/api.ts` | 添加 `getAllCountries()` 方法 |
| `components/enquiry/EnquiryForm.tsx` | 分离 `salesCountries` 和 `allCountries` |
| `components/enquiry/EnquiryForm.tsx` | `updatePodCountries()` 使用 `allCountries` |

---

## ✅ 验证清单

- [ ] POD = Shanghai → 显示 "CHINA"
- [ ] POD = Le Havre + Hamburg → 显示 "FRANCE, GERMANY"  
- [ ] 选择销售国家 → Sales PIC 列表更新
- [ ] 选择 Sales PIC → Sales Office 自动填充
- [ ] 提交 Enquiry → Console 无错误
- [ ] Enquiry Management → 新记录出现
- [ ] 关闭MOCK模式 → 真实数据库CRUD正常

---

**如需切换到真实数据库:**
1. 编辑 `logitrack-pro/services/api.ts` line 39
2. 改为 `const USE_MOCK_DATA = false;`
3. 确保后端运行在 http://localhost:8888
4. 重启前端服务
