const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'organizer_pro'
};

async function migrate() {
    console.log('Starting migration for Education Sector...');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add staff_id and department columns to education_members
        try {
            console.log('Checking education_members table...');
            await connection.query(`
                ALTER TABLE education_members 
                ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT NULL;
            `);
            console.log('Added staff_id and department columns to education_members.');
        } catch (e) {
            console.error('Error altering education_members (might already exist):', e.message);
        }

        // 2. Update stats enum in education_attendance
        try {
            console.log('Updating education_attendance status ENUM...');
            await connection.query(`
                ALTER TABLE education_attendance
                MODIFY COLUMN status ENUM('present','absent','late','half-day','permission','week_off','holiday','CL','SL','EL','OD') NOT NULL;
            `);
            console.log('Updated education_attendance status ENUM with Leave Types.');
        } catch (e) {
            console.error('Error updating status enum:', e.message);
        }

        // 3. Create education_departments table
        try {
            console.log('Creating education_departments table...');
            await connection.query(`
               CREATE TABLE IF NOT EXISTS \`education_departments\` (
                  \`id\` int NOT NULL AUTO_INCREMENT,
                  \`user_id\` int NOT NULL,
                  \`name\` varchar(255) NOT NULL,
                  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (\`id\`),
                  UNIQUE KEY \`unique_edu_dept\` (\`user_id\`,\`name\`),
                  CONSTRAINT \`fk_edu_dept_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `);
            console.log('Created education_departments table.');
        } catch (e) {
            console.error('Error creating education_departments table:', e.message);
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
