const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function resetDatabase() {
    console.log("Starting database reset...");

    // Connect without database first to ensure it exists or to drop/recreate if needed
    // But usually reset means keeping the DB and just re-running the schema which has DROP TABLE.

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306,
            multipleStatements: true
        });

        console.log(`Connected to database: ${process.env.DB_NAME}`);

        const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }

        console.log("Reading schema.sql...");
        const schema = fs.readFileSync(schemaPath, "utf8");

        console.log("Executing schema (this may take a few seconds)...");
        await connection.query(schema);

        console.log("✅ Database reset successfully!");
    } catch (error) {
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log(`Database ${process.env.DB_NAME} does not exist. Attempting to create it...`);
            try {
                const initConn = await mysql.createConnection({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    port: Number(process.env.DB_PORT) || 3306,
                    multipleStatements: true
                });
                await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
                await initConn.end();
                console.log(`Database ${process.env.DB_NAME} created. Retrying reset...`);
                return resetDatabase(); // Retry
            } catch (createError) {
                console.error("❌ Failed to create database:", createError);
            }
        } else {
            console.error("❌ Error resetting database:", error);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

resetDatabase();
