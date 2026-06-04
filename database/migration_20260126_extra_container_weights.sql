-- Migration: Add extra_container_weights column to enquiry_container_line
-- Purpose: Store weight (KG) for dynamic 20-foot container types (20OT, 20RF, 20TANK, etc.) as JSON
-- Date: 2026-01-26

ALTER TABLE enquiry_container_line
ADD COLUMN extra_container_weights TEXT NULL AFTER extra_containers;
