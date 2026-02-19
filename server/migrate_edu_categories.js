const db = require('./src/config/db');

async function migrate() {
    try {
        console.log("Starting migration: Creating education_reminder_categories table...");

        // Create the new table
        await db.query(`
            CREATE TABLE IF NOT EXISTS education_reminder_categories (
                id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                color VARCHAR(20) DEFAULT '#2d5bff',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_user_edu_rem_cat (user_id, name),
                CONSTRAINT fk_edu_rem_cat_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);

        console.log("Table education_reminder_categories created successfully.");

        // Copy from education_categories if it exists
        const [tables] = await db.query("SHOW TABLES LIKE 'education_categories'");
        if (tables.length > 0) {
            console.log("Found existing education_categories table. Copying data...");
            await db.query(`
                INSERT IGNORE INTO education_reminder_categories (user_id, name, color, created_at)
                SELECT user_id, name, color, created_at FROM education_categories;
            `);
            console.log("Data copied from education_categories to education_reminder_categories.");
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
