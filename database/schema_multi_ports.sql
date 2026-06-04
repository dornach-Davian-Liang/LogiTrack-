-- ============================================================
-- POL/POD 多选支持 - 数据库架构升级
-- ============================================================
-- 日期: 2025-02-03
-- 目的: 支持 Enquiry 多个 POL 和 POD
-- ============================================================

-- 1. 创建 POL 关联表（多对多）
DROP TABLE IF EXISTS enquiry_pol;
CREATE TABLE enquiry_pol (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  enquiry_id BIGINT NOT NULL COMMENT '询价ID',
  port_id INT NOT NULL COMMENT '港口ID',
  sequence INT NOT NULL DEFAULT 1 COMMENT '顺序（1=主要港口）',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_enquiry_port (enquiry_id, port_id),
  KEY idx_enquiry_id (enquiry_id),
  KEY idx_port_id (port_id),

  CONSTRAINT fk_enquiry_pol_enquiry
    FOREIGN KEY (enquiry_id) REFERENCES enquiry(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_enquiry_pol_port
    FOREIGN KEY (port_id) REFERENCES port(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价-起运港关联表（多对多）';

-- 2. 创建 POD 关联表（多对多）
DROP TABLE IF EXISTS enquiry_pod;
CREATE TABLE enquiry_pod (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  enquiry_id BIGINT NOT NULL COMMENT '询价ID',
  port_id INT NOT NULL COMMENT '港口ID',
  sequence INT NOT NULL DEFAULT 1 COMMENT '顺序（1=主要港口）',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_enquiry_port (enquiry_id, port_id),
  KEY idx_enquiry_id (enquiry_id),
  KEY idx_port_id (port_id),

  CONSTRAINT fk_enquiry_pod_enquiry
    FOREIGN KEY (enquiry_id) REFERENCES enquiry(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_enquiry_pod_port
    FOREIGN KEY (port_id) REFERENCES port(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价-目的港关联表（多对多）';

-- 3. 修改 enquiry 表（保留兼容字段，添加注释说明已废弃）
ALTER TABLE enquiry 
  MODIFY COLUMN pol_id INT NULL COMMENT '【已废弃】起运港ID - 请使用 enquiry_pol 表',
  MODIFY COLUMN pod_id INT NULL COMMENT '【已废弃】目的港ID - 请使用 enquiry_pod 表';

-- 4. 创建数据迁移存储过程（将现有单个 POL/POD 迁移到关联表）
DELIMITER $$

DROP PROCEDURE IF EXISTS migrate_existing_ports$$
CREATE PROCEDURE migrate_existing_ports()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_enquiry_id BIGINT;
  DECLARE v_pol_id INT;
  DECLARE v_pod_id INT;
  
  DECLARE cur CURSOR FOR 
    SELECT id, pol_id, pod_id 
    FROM enquiry 
    WHERE pol_id IS NOT NULL OR pod_id IS NOT NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- 开始迁移
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_enquiry_id, v_pol_id, v_pod_id;
    
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- 迁移 POL
    IF v_pol_id IS NOT NULL THEN
      INSERT IGNORE INTO enquiry_pol (enquiry_id, port_id, sequence)
      VALUES (v_enquiry_id, v_pol_id, 1);
    END IF;

    -- 迁移 POD
    IF v_pod_id IS NOT NULL THEN
      INSERT IGNORE INTO enquiry_pod (enquiry_id, port_id, sequence)
      VALUES (v_enquiry_id, v_pod_id, 1);
    END IF;

  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('迁移完成: ', ROW_COUNT(), ' 条记录') AS result;
END$$

DELIMITER ;

-- 5. 创建便捷查询视图
DROP VIEW IF EXISTS v_enquiry_with_ports;
CREATE VIEW v_enquiry_with_ports AS
SELECT 
  e.*,
  GROUP_CONCAT(DISTINCT CONCAT(pol.port_code, ' - ', pol.port_name) 
    ORDER BY epol.sequence SEPARATOR ' | ') AS pol_names,
  GROUP_CONCAT(DISTINCT epol.port_id ORDER BY epol.sequence) AS pol_ids,
  GROUP_CONCAT(DISTINCT CONCAT(pod.port_code, ' - ', pod.port_name) 
    ORDER BY epod.sequence SEPARATOR ' | ') AS pod_names,
  GROUP_CONCAT(DISTINCT epod.port_id ORDER BY epod.sequence) AS pod_ids
FROM enquiry e
LEFT JOIN enquiry_pol epol ON e.id = epol.enquiry_id
LEFT JOIN port pol ON epol.port_id = pol.id
LEFT JOIN enquiry_pod epod ON e.id = epod.enquiry_id
LEFT JOIN port pod ON epod.port_id = pod.id
GROUP BY e.id;

-- 6. 创建辅助函数：获取 enquiry 的 POL 列表
DELIMITER $$

DROP FUNCTION IF EXISTS get_enquiry_pols$$
CREATE FUNCTION get_enquiry_pols(p_enquiry_id BIGINT)
RETURNS TEXT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TEXT;
  
  SELECT GROUP_CONCAT(CONCAT(p.port_code, ' - ', p.port_name) 
    ORDER BY ep.sequence SEPARATOR ', ')
  INTO result
  FROM enquiry_pol ep
  JOIN port p ON ep.port_id = p.id
  WHERE ep.enquiry_id = p_enquiry_id;
  
  RETURN IFNULL(result, '');
END$$

-- 7. 创建辅助函数：获取 enquiry 的 POD 列表
DROP FUNCTION IF EXISTS get_enquiry_pods$$
CREATE FUNCTION get_enquiry_pods(p_enquiry_id BIGINT)
RETURNS TEXT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TEXT;
  
  SELECT GROUP_CONCAT(CONCAT(p.port_code, ' - ', p.port_name) 
    ORDER BY ep.sequence SEPARATOR ', ')
  INTO result
  FROM enquiry_pod ep
  JOIN port p ON ep.port_id = p.id
  WHERE ep.enquiry_id = p_enquiry_id;
  
  RETURN IFNULL(result, '');
END$$

DELIMITER ;

-- 8. 性能优化：添加复合索引
ALTER TABLE enquiry_pol ADD INDEX idx_enquiry_seq (enquiry_id, sequence);
ALTER TABLE enquiry_pod ADD INDEX idx_enquiry_seq (enquiry_id, sequence);

-- ============================================================
-- 使用说明
-- ============================================================
-- 1. 执行此脚本创建关联表
-- 2. 执行迁移: CALL migrate_existing_ports();
-- 3. 验证迁移: SELECT * FROM v_enquiry_with_ports LIMIT 10;
-- 4. 后端需要修改:
--    - 创建 Enquiry 时插入 enquiry_pol/enquiry_pod
--    - 查询 Enquiry 时 JOIN 这两个表
--    - 更新 Enquiry 时先删除再插入新的 port 关联
-- ============================================================
