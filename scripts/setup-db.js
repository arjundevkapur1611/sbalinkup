const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function setupDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting database setup...')
    
    // Read and execute schema
    console.log('📋 Creating database schema...')
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '..', 'lib', 'schema.sql'),
      'utf8'
    )
    await client.query(schemaSQL)
    console.log('✅ Schema created successfully')
    
    // Read and execute seed data
    console.log('🌱 Seeding database with initial data...')
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '..', 'lib', 'seed.sql'),
      'utf8'
    )
    await client.query(seedSQL)
    console.log('✅ Database seeded successfully')
    
    console.log('🎉 Database setup completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }