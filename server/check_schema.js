const db = require('./src/config/db');

async function checkSchema() {
    try {
        console.log("Checking manufacturing_reminders schema...");
        const [rows] = await db.query("DESCRIBE manufacturing_reminders");
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        process.exit();
    }
}

checkSchema();
