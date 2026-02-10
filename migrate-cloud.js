const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2];

if (!connectionString) {
    console.error('Please provide a connection string as an argument.');
    process.exit(1);
}

const files = [
    '001_create_tenants.sql',
    '002_create_users.sql',
    '003_create_projects.sql',
    '004_create_tasks.sql',
    '005_create_audit_logs.sql',
    '006_seed_data.sql'
];

async function migrate() {
    const config = {
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    };

    const client = new Client(config);

    try {
        console.log('--- Database Setup Started ---');
        await client.connect();
        console.log('✅ Connected to Cloud Database');

        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

        for (const file of files) {
            console.log(`🚀 Running ${file}...`);
            const filePath = path.join(__dirname, 'database', file);
            const sql = fs.readFileSync(filePath, 'utf8');
            await client.query(sql);
            console.log(`   Finished ${file}`);
        }

        console.log('\n✨ ALL TABLES CREATED AND SEEDED SUCCESSFULLY!');
        console.log('You can now proceed with the Backend deployment on Render.');
    } catch (err) {
        console.error('\n❌ SETUP FAILED:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
