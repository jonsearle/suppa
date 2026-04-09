-- Add confidence field to inventory_items table
ALTER TABLE inventory_items ADD COLUMN confidence TEXT DEFAULT 'approximate' CHECK (confidence IN ('exact', 'approximate'));

-- Create ingredient_display_hints cache table
CREATE TABLE ingredient_display_hints (
  id TEXT PRIMARY KEY,
  ingredient_name TEXT NOT NULL UNIQUE,
  storage_unit TEXT NOT NULL,
  display_unit TEXT,
  display_examples TEXT NOT NULL, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for quick lookups
CREATE INDEX idx_ingredient_display_hints_name ON ingredient_display_hints(ingredient_name);
