require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Connecting to DB:', process.env.DB_NAME);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT)
        });

        console.log('Connected.');

        // 1. Modify Status ENUM
        try {
            await connection.query("ALTER TABLE manufacturing_attendance MODIFY COLUMN status ENUM('present','absent','late','half-day','permission','week_off','holiday','CL','SL','EL','OD') NOT NULL");
            console.log('Status ENUM modified.');
        } catch (e) { console.log('Status ENUM modification skipped/error:', e.message); }

        // 2. Add columns
        const columns = [
            "ADD COLUMN check_in TIME DEFAULT NULL",
            "ADD COLUMN check_out TIME DEFAULT NULL",
            "ADD COLUMN total_hours DECIMAL(4,2) DEFAULT '0.00'",
            "ADD COLUMN work_mode ENUM('Office','WFH','On-site') DEFAULT 'Office'"
        ];

        for (const col of columns) {
            try {
                // Check if column exists first? Or just try adding (MySQL errors on duplicate)
                // For simplicity, just try adding.
                // Or better: use IF NOT EXISTS if supported (MySQL 8.0+ supports ADD COLUMN IF NOT EXISTS? Not consistently).
                // Just try-catch.
                const colName = col.split(' ')[2];
                try {
                    await connection.query(`ALTER TABLE manufacturing_attendance ${col}`);
                    console.log(`Column added: ${colName}`);
                } catch (e) {
                    if (e.code === 'ER_DUP_FIELDNAME') {
                        console.log(`Column ${colName} already exists.`);
                    } else {
                        throw e;
                    }
                }
            } catch (e) {
                console.log(`Error adding column:`, e.message);
            }
        }

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
