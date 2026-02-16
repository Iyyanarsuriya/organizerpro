const db = require('./src/config/db');

async function test() {
    try {
        const [tables] = await db.query("SHOW TABLES LIKE 'manufacturing_reminders'");
        console.log("Tables found:", tables);

        const [cols] = await db.query("SHOW COLUMNS FROM manufacturing_reminders");
        console.log("Columns in manufacturing_reminders:", cols);

        const [rows] = await db.query("SELECT * FROM manufacturing_reminders");
        console.log("Reminders in manufacturing_reminders:", rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

test();
