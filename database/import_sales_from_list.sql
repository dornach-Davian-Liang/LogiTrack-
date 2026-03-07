-- ============================================================
-- 从 List.csv 导入销售数据到 LogiTrack 数据库
-- 包含：Country -> Sales Office -> Sales PIC
-- 生成时间: 2026-02-27
-- ============================================================

USE logitrack;

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 第一步：插入国家数据（如果不存在）
-- 包括 AGENTS、OTHERS、TBA 等非标准国家
-- ============================================================

INSERT INTO country (country_code, country_name_en, country_name_cn, is_active, is_core)
VALUES
  ('AG', 'AGENTS', '代理商', 1, 0),
  ('BE', 'BELGIUM', '比利时', 1, 0),
  ('CN', 'CHINA', '中国', 1, 1),
  ('FR', 'FRANCE', '法国', 1, 1),
  ('DE', 'GERMANY', '德国', 1, 1),
  ('GR', 'GREECE', '希腊', 1, 0),
  ('MA', 'MOROCCO', '摩洛哥', 1, 0),
  ('NL', 'NETHERLANDS', '荷兰', 1, 0),
  ('OT', 'OTHERS', '其他', 1, 0),
  ('PL', 'POLAND', '波兰', 1, 0),
  ('ZA', 'SOUTH AFRICA', '南非', 1, 0),
  ('CH', 'SWITZERLAND', '瑞士', 1, 0),
  ('TB', 'TBA', '待定', 1, 0),
  ('GB', 'UNITED KINGDOM', '英国', 1, 1),
  ('US', 'USA', '美国', 1, 1),
  ('UK', 'UNITED KINGDOM', '英国', 1, 1) -- 别名，因为CSV中使用的是 United Kingdom
ON DUPLICATE KEY UPDATE
  country_name_en = VALUES(country_name_en),
  updated_at = CURRENT_TIMESTAMP;

-- 验证插入的国家
SELECT '=== 国家导入完成 ===' AS status;
SELECT country_code, country_name_en, is_core, is_active 
FROM country 
WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US', 'UK')
ORDER BY country_code;

-- ============================================================
-- 第二步：创建临时表用于数据处理  
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS temp_sales_data;
CREATE TEMPORARY TABLE temp_sales_data (
  sales_country VARCHAR(100),
  sales_office VARCHAR(200),
  sales_pic VARCHAR(200),
  country_code VARCHAR(10),
  INDEX idx_country (sales_country),
  INDEX idx_office (sales_office)
);

-- ============================================================
-- 第三步：加载CSV数据到临时表（需要手动执行LOAD DATA或使用脚本）
-- PowerShell脚本见下方
-- ============================================================

-- 数据映射规则
UPDATE temp_sales_data SET country_code = CASE sales_country
  WHEN 'AGENTS' THEN 'AG'
  WHEN 'BELGIUM' THEN 'BE'
  WHEN 'CHINA' THEN 'CN'
  WHEN 'FRANCE' THEN 'FR'
  WHEN 'GERMANY' THEN 'DE'
  WHEN 'GREECE' THEN 'GR'
  WHEN 'MOROCCO' THEN 'MA'
  WHEN 'NETHERLANDS' THEN 'NL'
  WHEN 'OTHERS' THEN 'OT'
  WHEN 'POLAND' THEN 'PL'
  WHEN 'SOUTH AFRICA' THEN 'ZA'
  WHEN 'SWITZERLAND' THEN 'CH'
  WHEN 'TBA' THEN 'TB'
  WHEN 'United Kingdom' THEN 'GB'
  WHEN 'USA' THEN 'US'
  ELSE NULL
END
WHERE sales_country IS NOT NULL AND sales_country != '';

-- ============================================================
-- 第四步：插入 Sales Office 数据
-- ============================================================

-- 注意：sales_office表需要有country_code字段才能建立关联
-- 如果表结构中使用的是country_id，需要先确认表结构

-- 获取唯一的office和对应的country
INSERT INTO sales_office (code, name, country_code, is_active)
SELECT DISTINCT
  UPPER(REPLACE(REPLACE(t.sales_office, ' ', '_'), '-', '_')) AS code,
  t.sales_office AS name,
  t.country_code,
  1 AS is_active
FROM temp_sales_data t
WHERE t.sales_office IS NOT NULL 
  AND t.sales_office != ''
  AND t.country_code IS NOT NULL
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  country_code = VALUES(country_code),
  updated_at = CURRENT_TIMESTAMP;

SELECT '=== Sales Office 导入完成 ===' AS status;
SELECT COUNT(*) AS total_offices FROM sales_office;

-- ============================================================
-- 第五步：插入 Sales PIC 数据
-- ============================================================

-- 假设sales_pic表结构包含：name, sales_office_id, country_code
-- 需要通过sales_office的code来关联

INSERT INTO sales_pic (name, name_norm, sales_office_id, country_code, is_active)
SELECT DISTINCT
  t.sales_pic AS name,
  UPPER(TRIM(t.sales_pic)) AS name_norm,
  so.id AS sales_office_id,
  t.country_code,
  1 AS is_active
FROM temp_sales_data t
INNER JOIN sales_office so ON so.name = t.sales_office AND so.country_code = t.country_code
WHERE t.sales_pic IS NOT NULL 
  AND t.sales_pic != ''
  AND t.country_code IS NOT NULL
  AND t.sales_office IS NOT NULL
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_norm = VALUES(name_norm),
  updated_at = CURRENT_TIMESTAMP;

SELECT '=== Sales PIC 导入完成 ===' AS status;
SELECT COUNT(*) AS total_pics FROM sales_pic;

-- ============================================================
-- 第六步：验证导入结果
-- ============================================================

SELECT '=== 按国家统计 ===' AS status;
SELECT 
  c.country_code,
  c.country_name_en,
  COUNT(DISTINCT so.id) AS office_count,
  COUNT(DISTINCT sp.id) AS pic_count
FROM country c
LEFT JOIN sales_office so ON so.country_code = c.country_code
LEFT JOIN sales_pic sp ON sp.country_code = c.country_code
WHERE c.country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US', 'UK')
GROUP BY c.country_code, c.country_name_en
ORDER BY pic_count DESC;

-- 显示部分数据示例
SELECT '=== AGENTS 示例数据 ===' AS status;
SELECT 
  c.country_name_en,
  so.name AS office_name,
  sp.name AS pic_name
FROM sales_pic sp
INNER JOIN sales_office so ON sp.sales_office_id = so.id
INNER JOIN country c ON sp.country_code = c.country_code
WHERE c.country_code = 'AG'
LIMIT 10;

-- 清理临时表
DROP TEMPORARY TABLE IF EXISTS temp_sales_data;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== 导入完成！===' AS status;

-- ============================================================
-- PowerShell 脚本：加载 CSV 到临时表
-- 在执行上面的SQL之前，运行此PowerShell脚本：
-- ============================================================
/*

# PowerShell脚本：import-list-csv.ps1

$csvPath = "c:\logitrack\LogiTrack--update-status-report-20260126023903\database\List.csv"
$connectionString = "server=localhost;port=3306;database=logitrack;uid=root;pwd=your_password;"

# 读取CSV
$csv = Import-Csv $csvPath -Delimiter "`t" | Where-Object { 
    $_.SALESCOUNTRY -and $_.SALESCOUNTRY -ne 'SALESCOUNTRY' 
}

# 连接MySQL（需要安装 MySql.Data）
Add-Type -Path "C:\Program Files\MySQL\MySQL Connector NET 8.0\MySql.Data.dll"
$conn = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
$conn.Open()

# 插入数据
$insertCmd = $conn.CreateCommand()
$insertCmd.CommandText = @"
INSERT INTO temp_sales_data (sales_country, sales_office, sales_pic)
VALUES (@country, @office, @pic)
"@

$insertCmd.Parameters.Add("@country", [MySql.Data.MySqlClient.MySqlDbType]::VarChar) | Out-Null
$insertCmd.Parameters.Add("@office", [MySql.Data.MySqlClient.MySqlDbType]::VarChar) | Out-Null
$insertCmd.Parameters.Add("@pic", [MySql.Data.MySqlClient.MySqlDbType]::VarChar) | Out-Null

$count = 0
foreach ($row in $csv) {
    $insertCmd.Parameters["@country"].Value = $row.SALESCOUNTRY
    $insertCmd.Parameters["@office"].Value = $row.SALESOFFICE
    $insertCmd.Parameters["@pic"].Value = $row.SALESPIC
    $insertCmd.ExecuteNonQuery() | Out-Null
    $count++
    if ($count % 100 -eq 0) {
        Write-Host "已导入 $count 条记录..."
    }
}

$conn.Close()
Write-Host "总共导入 $count 条记录"

*/
