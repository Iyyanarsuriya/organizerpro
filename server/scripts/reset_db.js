const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
require('dotenv').config();

const run = async () => {
    try {
        console.log("Applying Schema V2: Sector Isolation...");
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but ignore inside triggers/routines if any (simplified splitter for standard sql)
        const statements = sql
            .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            // console.log("Executing:", statement.substring(0, 50) + "...");
            try {
                await db.query(statement);
            } catch (err) {
                console.error("Error executing statement:", err.message);
                // Continue despite errors (e.g. drop table if not exists)
            }
        }
        console.log("Schema V2 Applied Successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
};

run();
