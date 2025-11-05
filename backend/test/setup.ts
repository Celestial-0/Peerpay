import { MongoClient } from 'mongodb';

const DB_NAME = 'peerpay-dev';
let mongoClient: MongoClient | null = null;

export async function clearDatabase() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri || 'null');

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Get all collections
    const collections = await db.listCollections().toArray();

    // Drop all collections
    for (const collection of collections) {
      try {
        await db.collection(collection.name).deleteMany({});
      } catch {
        // Ignore errors for individual collections
      }
    }

    console.log('✓ Test database cleared');
  } catch (error) {
    console.warn('Warning: Could not clear test database:', error);
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
  }
}

// Clear database before all tests
beforeAll(async () => {
  await clearDatabase();
}, 60000);

// Clean up all connections after all tests
afterAll(async () => {
  // Close any remaining MongoDB connections
  if (mongoClient) {
    try {
      await mongoClient.close();
      mongoClient = null;
    } catch {
      // Ignore close errors
    }
  }

  // Force close any remaining connections
  await new Promise((resolve) => setTimeout(resolve, 500));
}, 10000);
