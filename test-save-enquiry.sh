#!/bin/bash
# 测试保存enquiry功能

echo "=== 测试保存Enquiry API ==="
echo ""

# 测试数据 - 包含container lines
TEST_DATA='{
  "enquiryReceivedDate": "2026-02-02",
  "issueDate": "2026-02-02",
  "productCode": "SEA",
  "productAbbr": "S",
  "status": "New",
  "cnPricingAdmin": "test_admin",
  "salesCountryCode": "FR",
  "salesOfficeId": 1,
  "salesPicId": 1,
  "assignedCnOfficeCode": "SHANGHAI",
  "cargoTypeCode": "FCL",
  "volumeCbm": 50.5,
  "quantity": 100,
  "quantityUomCode": "CTN",
  "commodity": "Test Product",
  "polId": 1,
  "podId": 5,
  "podCountryCode": "FR",
  "bookingConfirmed": "Pending",
  "containerLines": [
    {
      "containerTypeId": 1,
      "containerQty": 2
    },
    {
      "containerTypeId": 2,
      "containerQty": 1
    }
  ]
}'

echo "发送POST请求到 http://localhost:8888/api/enquiries"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  http://localhost:8888/api/enquiries)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP状态码: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 创建成功！"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo "❌ 创建失败！"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo ""
echo "=== 测试完成 ==="
