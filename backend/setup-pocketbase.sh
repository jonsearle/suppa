#!/bin/bash

# PocketBase Collection Setup Script
# Creates inventory_items and chat_messages collections via REST API

POCKETBASE_URL="http://localhost:8090"
ADMIN_EMAIL="admin@suppa.dev"
ADMIN_PASSWORD="admin123456"  # Change this to something secure!

echo "🔧 Setting up PocketBase collections..."

# Step 1: Create admin account (if not exists)
echo "1️⃣  Setting up admin account..."
curl -X POST "$POCKETBASE_URL/api/admins" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"passwordConfirm\": \"$ADMIN_PASSWORD\"
  }" 2>/dev/null || echo "   (Admin may already exist)"

# Step 2: Get admin token
echo ""
echo "2️⃣  Getting admin token..."
TOKEN_RESPONSE=$(curl -s -X POST "$POCKETBASE_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"identity\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ADMIN_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "   ✓ Got admin token"

# Step 3: Create inventory_items collection
echo ""
echo "3️⃣  Creating inventory_items collection..."
curl -X POST "$POCKETBASE_URL/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: $ADMIN_TOKEN" \
  -d '{
    "name": "inventory_items",
    "type": "base",
    "schema": [
      {
        "id": "user_id_field",
        "name": "user_id",
        "type": "text",
        "required": true
      },
      {
        "id": "name_field",
        "name": "name",
        "type": "text",
        "required": true
      },
      {
        "id": "canonical_name_field",
        "name": "canonical_name",
        "type": "text"
      },
      {
        "id": "has_item_field",
        "name": "has_item",
        "type": "bool"
      },
      {
        "id": "quantity_approx_field",
        "name": "quantity_approx",
        "type": "number"
      },
      {
        "id": "unit_field",
        "name": "unit",
        "type": "text"
      },
      {
        "id": "confidence_field",
        "name": "confidence",
        "type": "select",
        "options": {
          "values": ["exact", "approximate"]
        }
      },
      {
        "id": "date_added_field",
        "name": "date_added",
        "type": "date"
      },
      {
        "id": "date_used_field",
        "name": "date_used",
        "type": "date"
      }
    ]
  }' 2>/dev/null

echo "   ✓ inventory_items created"

# Step 4: Create chat_messages collection
echo ""
echo "4️⃣  Creating chat_messages collection..."
curl -X POST "$POCKETBASE_URL/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: $ADMIN_TOKEN" \
  -d '{
    "name": "chat_messages",
    "type": "base",
    "schema": [
      {
        "id": "user_id_field",
        "name": "user_id",
        "type": "text",
        "required": true
      },
      {
        "id": "message_field",
        "name": "message",
        "type": "text",
        "required": true
      },
      {
        "id": "role_field",
        "name": "role",
        "type": "select",
        "options": {
          "values": ["user", "assistant"]
        }
      },
      {
        "id": "timestamp_field",
        "name": "timestamp",
        "type": "date"
      }
    ]
  }' 2>/dev/null

echo "   ✓ chat_messages created"

echo ""
echo "✅ PocketBase setup complete!"
echo ""
echo "📝 Admin credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "⚠️  NOTE: Change the admin password in production!"
