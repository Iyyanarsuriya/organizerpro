const db = require('./src/config/db');
const Reminder = require('./src/models/reminderModel');

async function diag() {
    try {
        console.log("Diag for User 1, Sector 'manufacturing'");
        const rows = await Reminder.getAllByUserId(1, 'manufacturing');
        console.log("Rows found:", rows.length);
        console.log("First row:", rows[0]);

        console.log("\nChecking table directly:");
        const [direct] = await db.query("SELECT * FROM manufacturing_reminders WHERE user_id = 1");
        console.log("Direct rows:", direct.length);

        console.log("\nChecking all users:");
        const [users] = await db.query("SELECT id, username, email FROM users");
        console.log("Users:", users);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diag();
