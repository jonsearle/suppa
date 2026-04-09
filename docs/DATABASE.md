# Database Schema

## Changes for Unit Normalization

### inventory_items
- Added `confidence` field (TEXT, default 'approximate'): tracks certainty about quantity
- Values: 'exact' (user specified or measured) | 'approximate' (LLM estimated)

### ingredient_display_hints (new table)
Caches LLM decisions about how to display each ingredient

- `id`: primary key
- `ingredient_name`: e.g., "flour"
- `storage_unit`: canonical unit ("g", "ml", "pieces")
- `display_unit`: how users naturally say it (null, "slices", etc.)
- `display_examples`: JSON array of example phrases
- `created_at`: when cached

Index on ingredient_name for fast lookups.
