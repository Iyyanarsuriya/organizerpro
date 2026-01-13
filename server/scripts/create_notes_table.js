const db = require('../src/config/db');

const createNotesTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                color VARCHAR(50) DEFAULT 'yellow',
                is_pinned BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Notes table created successfully.");
        process.exit();
    } catch (error) {
        console.error("Error creating notes table:", error);
        process.exit(1);
    }
};

createNotesTable();
