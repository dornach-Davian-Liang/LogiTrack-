#!/bin/bash
# Copy和Increase功能验证脚本

echo "=== Copy和Increase功能测试 ==="
echo ""

# 测试数据
ENQUIRY_ID=40

echo "1. 检查测试enquiry (ID=$ENQUIRY_ID)..."
enquiry=$(curl -s "http://localhost:8888/api/enquiries/$ENQUIRY_ID")
if [ $? -eq 0 ]; then
    refNum=$(echo $enquiry | jq -r '.referenceNumber')
    polCount=$(echo $enquiry | jq '.polIds | length')
    podCount=$(echo $enquiry | jq '.podIds | length')
    echo "   Reference: $refNum"
    echo "   POL数量: $polCount, POD数量: $podCount"
    echo "   ✅ 测试数据存在"
else
    echo "   ❌ 无法获取测试数据"
    exit 1
fi
echo ""

echo "2. 测试Increase API..."
increase=$(curl -s "http://localhost:8888/api/enquiries/$ENQUIRY_ID/reference/increase")
if [ $? -eq 0 ]; then
    newRef=$(echo $increase | jq -r '.referenceNumber')
    echo "   新Reference: $newRef"
    echo "   ✅ Increase API正常"
else
    echo "   ❌ Increase API失败"
    exit 1
fi
echo ""

echo "3. 检查前端编译..."
if [ -f "/workspaces/LogiTrack-/logitrack-pro/dist/index.html" ]; then
    jsFile=$(ls -t /workspaces/LogiTrack-/logitrack-pro/dist/assets/*.js | head -1)
    jsSize=$(ls -lh "$jsFile" | awk '{print $5}')
    echo "   最新Bundle: $(basename $jsFile)"
    echo "   大小: $jsSize"
    echo "   ✅ 前端已编译"
else
    echo "   ❌ 前端未编译"
    exit 1
fi
echo ""

echo "=== 修复说明 ==="
echo ""
echo "问题原因："
echo "  Copy/Increase创建的copied对象id=undefined（用于创建新记录）"
echo "  但handleEditEnquiry尝试用undefined调用getById() → 报错"
echo ""
echo "修复方案："
echo "  在handleEditEnquiry中添加判断："
echo "  - 如果id不存在 → 直接使用传入的数据（Copy/Increase场景）"
echo "  - 如果id存在 → 调用getById获取完整数据（编辑场景）"
echo ""
echo "=== 浏览器测试步骤 ==="
echo ""
echo "1. 硬刷新浏览器 (Ctrl+Shift+R)"
echo "   URL: https://congenial-rotary-phone-5g77qv55674g254w-3000.app.github.dev"
echo ""
echo "2. 测试Copy功能："
echo "   - 找到enquiry $refNum (ID=$ENQUIRY_ID)"
echo "   - 点击绿色Copy按钮"
echo "   - 应该打开编辑表单，显示所有POL ($polCount个) 和POD ($podCount个)"
echo "   - Reference Number应该为空"
echo "   - Status应该为'New'"
echo "   - Console应该显示: 📝 New enquiry (Copy/Increase), using provided data"
echo ""
echo "3. 测试Increase功能："
echo "   - 返回列表，找到 $refNum"
echo "   - 点击青色Increase按钮"
echo "   - 应该打开编辑表单"
echo "   - Reference Number应该是: $newRef"
echo "   - 所有POL和POD应该保留"
echo "   - Console应该显示: 📝 New enquiry (Copy/Increase), using provided data"
echo ""
echo "4. 测试正常Edit功能（确保没有破坏）："
echo "   - 点击蓝色Edit按钮"
echo "   - Console应该显示: 📥 Loading full enquiry data for edit: $ENQUIRY_ID"
echo "   - 然后显示: ✅ Full enquiry data loaded: {...}"
echo ""
