/**
 * Database setup script (JavaScript version)
 * Creates PocketBase collections from schema.json
 */

const fs = require('fs');
const path = require('path');

async function getAdminToken(baseUrl, email, password) {
  try {
    const response = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Auth failed: ${error.message}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    throw new Error(`Failed to authenticate with PocketBase: ${error.message || String(error)}`);
  }
}

async function collectionExists(baseUrl, token, collectionName) {
  try {
    const response = await fetch(`${baseUrl}/api/collections/${collectionName}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function createCollection(baseUrl, token, collection) {
  try {
    const response = await fetch(`${baseUrl}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: collection.name,
        type: collection.type,
        system: collection.system,
        schema: collection.fields,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    console.log(`✅ Created collection: ${collection.name}`);
  } catch (error) {
    throw new Error(`Error creating collection ${collection.name}: ${error.message || String(error)}`);
  }
}

async function setupDatabase() {
  const baseUrl = process.env.POCKETBASE_URL || 'http://localhost:8090';
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'jon.searle@gmail.com';
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'SK8Ztxn4aERA7Ey';

  console.log(`\n🚀 Setting up PocketBase database`);
  console.log(`   URL: ${baseUrl}`);
  console.log(`   Admin: ${adminEmail}\n`);

  try {
    console.log('🔐 Authenticating with PocketBase...');
    const token = await getAdminToken(baseUrl, adminEmail, adminPassword);
    console.log('✅ Authenticated\n');

    console.log('📖 Loading schema...');
    const schemaPath = path.join(process.cwd(), 'schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);
    console.log(`✅ Loaded schema with ${schema.collections.length} collections\n`);

    console.log('📦 Creating collections...\n');
    for (const collection of schema.collections) {
      const exists = await collectionExists(baseUrl, token, collection.name);
      if (exists) {
        console.log(`⊘ Collection already exists: ${collection.name}`);
      } else {
        await createCollection(baseUrl, token, collection);
      }
    }

    console.log('\n✨ Database setup complete!\n');
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(error.message || String(error));
    process.exit(1);
  }
}

setupDatabase();
