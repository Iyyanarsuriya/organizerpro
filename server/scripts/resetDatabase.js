const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const resetDatabase = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true,
            port: Number(process.env.DB_PORT)
        });

        console.log(`Connected. Resetting database: ${process.env.DB_NAME}`);

        // Create DB if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);

        // Read schema.sql
        const schemaPath = path.resolve(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        await connection.query(schemaSql);

        console.log('Database reset successfully! All tables created.');

    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        if (connection) await connection.end();
    }
};

resetDatabase();
