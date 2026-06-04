# GitHub Codespaces 访问指南

## 🔧 问题解决：无法访问 localhost

**症状**: 在 Codespaces 中尝试访问 `http://localhost:3000` 时显示"意外终止了连接"

**原因**: GitHub Codespaces 运行在远程容器中，`localhost` 仅指向容器内部网络，浏览器无法直接访问。

---

## ✅ 正确的访问方式

### 前端应用
**使用 Codespaces 生成的公共URL**:
```
https://congenial-rotary-phone-5g77qv55674g254w-3000.app.github.dev
```

### 后端 API（如需测试）
```
https://congenial-rotary-phone-5g77qv55674g254w-8888.app.github.dev
```

---

## 📋 服务状态

当前所有服务已成功启动：

### ✅ 数据库 (MySQL)
- **容器**: logitrack-mysql
- **端口**: 3306
- **状态**: 运行中

### ✅ 后端 (Spring Boot)
- **进程**: Java (PID: 35114)
- **端口**: 8888
- **API测试**:
  ```bash
  curl -s http://localhost:8888/api/enquiries?page=0&size=1
  ```
- **状态**: ✅ 正常响应，共 22 条记录

### ✅ 前端 (Vite)
- **进程**: Node.js (PID: 41870)
- **端口**: 3000
- **版本**: Vite 6.4.1
- **启动时间**: 161ms
- **状态**: ✅ 已就绪

---

## 🎯 如何找到你的 Codespace URL

### 方法 1: VS Code 端口面板
1. 在 VS Code 底部，点击 **"端口"** (Ports) 标签
2. 找到端口 `3000` 的行
3. 右键点击 → 选择 **"在浏览器中打开"**
4. 或复制 **"转发的地址"** (Forwarded Address) 列中的URL

### 方法 2: 手动构造URL
格式: `https://{codespace-name}-{port}.app.github.dev`

- `{codespace-name}`: 你的 Codespace 名称（如 `congenial-rotary-phone-5g77qv55674g254w`）
- `{port}`: 服务端口号（前端是 `3000`，后端是 `8888`）

---

## 🧪 验证服务是否正常

### 1. 在终端中测试
```bash
# 测试后端API
curl -s http://localhost:8888/api/enquiries?page=0&size=1 | python3 -m json.tool

# 检查前端服务
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 应返回: 200
```

### 2. 检查进程状态
```bash
# 查看所有服务
ps aux | grep -E "(java.*logitrack|node.*vite)" | grep -v grep

# 应看到:
# - java -jar ... logitrack-backend-1.0.0.jar
# - node ... vite
```

### 3. 查看日志
```bash
# 后端日志
tail -f /workspaces/LogiTrack-/backend/backend.log

# 前端日志
tail -f /tmp/frontend.log
```

---

## 🚀 重启服务（如果需要）

### 重启所有服务
```bash
cd /workspaces/LogiTrack-
./start-all.sh
```

### 仅重启前端
```bash
pkill -f "node.*vite"
cd /workspaces/LogiTrack-/logitrack-pro
npm run dev
```

### 仅重启后端
```bash
pkill -f "java.*logitrack"
cd /workspaces/LogiTrack-/backend
nohup java -jar target/logitrack-backend-1.0.0.jar --spring.profiles.active=mysql > backend.log 2>&1 &
```

---

## 📝 测试多港口功能

一旦你能访问前端URL，请按照以下步骤测试：

### 1. 创建新询价
1. 打开前端URL
2. 点击 **"Create New Enquiry"**
3. 在 **"Port of Loading (POL)"** 字段：
   - 点击下拉框（应立即打开，无卡顿）
   - 输入 "shanghai" 搜索（应即时过滤）
   - 选择 3-5 个港口
4. 在 **"Port of Discharge (POD)"** 字段：
   - 同样操作，选择 3-5 个港口
5. 填写其他必填字段
6. 点击保存
7. **预期结果**: 
   - ✅ 保存成功
   - ✅ 无页面卡顿或冻结

### 2. 编辑现有询价
1. 在列表中找到刚创建的记录
2. 点击编辑按钮
3. **预期**: 已选港口正确显示为标签
4. 尝试：
   - 移除 1-2 个港口（点击标签上的 ×）
   - 添加 2-3 个新港口
5. 点击保存
6. **预期结果**: 
   - ✅ 更新成功
   - ✅ 港口更改已保存

### 3. 性能测试
1. 打开 POL 或 POD 下拉框
2. **预期**: <200ms 打开，无卡顿
3. 输入搜索关键字
4. **预期**: <50ms 过滤响应
5. 滚动港口列表
6. **预期**: 流畅 60fps

---

## ⚠️ 常见问题

### Q: 端口转发显示 "Private"
**A**: 右键点击端口 → 更改端口可见性 → 选择 **"Public"**

### Q: URL 返回 404
**A**: 检查服务是否正常运行：
```bash
ps aux | grep -E "(java|vite)" | grep -v grep
```

### Q: 页面加载很慢
**A**: Codespaces 网络可能延迟，这是正常的。如果超过10秒无响应，检查服务日志。

### Q: API 返回错误
**A**: 检查后端日志：
```bash
tail -50 /workspaces/LogiTrack-/backend/backend.log
```

---

## 📊 端到端测试报告

完整的测试结果和详细说明请查看：
- [E2E_TEST_REPORT_MULTIPORT.md](E2E_TEST_REPORT_MULTIPORT.md)

---

**最后更新**: 2026-02-04  
**服务状态**: ✅ 全部正常运行，准备就绪
