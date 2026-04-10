-- ============================================================
-- Migration: Update enquiry_container_line for V1 requirements
-- Adds new columns for 4 container sizes + weights + CNTR type
-- ============================================================

-- Add new columns (safe: IF NOT EXISTS not needed for ALTER, just ignore errors on re-run)
ALTER TABLE enquiry_container_line 
  ADD COLUMN qty_20 INT NOT NULL DEFAULT 0 AFTER enquiry_id,
  ADD COLUMN weight_20 DECIMAL(12,3) NULL AFTER qty_20,
  ADD COLUMN qty_40 INT NOT NULL DEFAULT 0 AFTER weight_20,
  ADD COLUMN weight_40 DECIMAL(12,3) NULL AFTER qty_40,
  ADD COLUMN qty_40hq INT NOT NULL DEFAULT 0 AFTER weight_40,
  ADD COLUMN weight_40hq DECIMAL(12,3) NULL AFTER qty_40hq,
  ADD COLUMN qty_45 INT NOT NULL DEFAULT 0 AFTER weight_40hq,
  ADD COLUMN weight_45 DECIMAL(12,3) NULL AFTER qty_45,
  ADD COLUMN cntr_type_id INT NULL AFTER weight_45,
  ADD COLUMN cntr_type_code VARCHAR(20) NULL AFTER cntr_type_id,
  ADD COLUMN line_teu DECIMAL(8,2) NULL AFTER cntr_type_code;

-- Make legacy columns nullable (they were NOT NULL before)
ALTER TABLE enquiry_container_line 
  MODIFY COLUMN container_type_id INT NULL,
  MODIFY COLUMN container_code VARCHAR(20) NULL,
  MODIFY COLUMN container_qty INT NULL,
  MODIFY COLUMN teu_per_unit DECIMAL(6,2) NULL;
