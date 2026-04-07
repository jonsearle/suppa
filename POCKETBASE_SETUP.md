# PocketBase Setup Guide for Suppa

## Quick Start

### 1. Install PocketBase
```bash
# macOS with Homebrew
brew install pocketbase

# Or download from https://github.com/pocketbase/pocketbase/releases
```

### 2. Start PocketBase
```bash
pb serve
```

PocketBase will start on `http://localhost:8090` and open the admin UI.

### 3. Create Collections

#### Collection 1: `inventory_items`

Click "New collection" and configure:

**Fields:**
- `user_id` (Text, required)
- `name` (Text, required)
- `canonical_name` (Text, optional)
- `has_item` (Boolean, default: false)
- `quantity_approx` (Number, optional)
- `unit` (Text, optional)
- `confidence` (Select: exact, approximate, required, default: approximate)
- `date_added` (DateTime, required, auto-set to now)
- `date_used` (DateTime, optional - leave NULL for active items)

**Index Fields (for performance):**
- `user_id` - for filtering by user
- `canonical_name` - for deduplication
- `date_used` - for filtering active items

#### Collection 2: `chat_messages`

Click "New collection" and configure:

**Fields:**
- `user_id` (Text, required)
- `message` (Text, required)
- `role` (Select: user, assistant, required)
- `timestamp` (DateTime, required, auto-set to now)

**Index Fields (for performance):**
- `user_id` - for filtering by user
- `timestamp` - for sorting by date

### 4. Configure Backend

**File:** `backend/.env.local` or `backend/.env`

```
POCKETBASE_URL=http://localhost:8090
USER_ID=test_user_123
OPENAI_API_KEY=your_openai_key
```

### 5. Install Dependencies
```bash
cd backend
npm install
```

### 6. Start Development Server
```bash
npm run dev
```

## API Endpoints Available

### Inventory Management
- `POST /api/inventory` - Add inventory items
- `GET /api/inventory` - Get all active inventory items

### Meal Suggestions
- `POST /api/chat` - Get meal suggestions

### Cooking
- `POST /api/cooking/detail` - Get recipe details
- `POST /api/cooking/start` - Start cooking a recipe
- `POST /api/cooking/complete` - Complete cooking and deduct inventory

## PocketBase REST API Reference

The backend uses PocketBase REST API:

### List Records
```
GET /api/collections/{collection}/records?filter=...&sort=...&limit=...
```

**Examples:**
```
GET /api/collections/inventory_items/records?filter=(user_id="user123"&&date_used=null)&sort=-date_added
GET /api/collections/chat_messages/records?filter=(user_id="user123")&sort=timestamp
```

### Get Single Record
```
GET /api/collections/{collection}/records/{id}
```

### Create Record
```
POST /api/collections/{collection}/records
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

### Update Record
```
PATCH /api/collections/{collection}/records/{id}
Content-Type: application/json

{
  "field1": "new_value"
}
```

### Delete Record
```
DELETE /api/collections/{collection}/records/{id}
```

## Filter Syntax

PocketBase uses a query-like filter syntax:

```
(field="value")              // equals
(field="value"&&field2=null) // AND
(field="value"||field2="x")  // OR
(field>5)                    // greater than
(field~"pattern")            // contains (text search)
(!field)                     // not null
(field=null)                 // is null
```

## Sort Syntax

```
?sort=fieldname          // ascending
?sort=-fieldname         // descending
?sort=field1,-field2     // multiple fields
```

## Troubleshooting

### Port Already in Use
If port 8090 is in use, specify a different port:
```bash
pb serve --http localhost:8888
```

Then update `POCKETBASE_URL` in `.env`.

### CORS Issues
PocketBase auto-handles CORS for API requests from frontend. If issues persist, check PocketBase admin UI settings.

### Collection Not Found Error
Ensure collections are created with exact names: `inventory_items` and `chat_messages`.

### Query Returns Empty
- Check `user_id` matches in filters
- Verify `date_used` is null for active inventory items
- Check filters are URL-encoded properly

## Production Deployment

### Option 1: Docker
```dockerfile
FROM pocketbase/pocketbase:latest
COPY pb_data/ /pb/pb_data/
EXPOSE 8090
CMD ["/pb/pb"]
```

### Option 2: Self-hosted VPS
1. Copy PocketBase binary to server
2. Create systemd service
3. Point domain to server IP
4. Update `POCKETBASE_URL` to your domain

### Option 3: PocketBase Cloud
Sign up at https://pocketbase.io/cloud for managed hosting.

## Data Persistence

PocketBase stores data in `pb_data/` directory. This includes:
- SQLite database
- Uploaded files
- Admin settings

**Backup:** Copy entire `pb_data/` directory regularly.

---

For more information, visit: https://pocketbase.io/docs/
