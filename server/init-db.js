const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function initDB() {
  try {
    // Create connection without database selected to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server...');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database '${process.env.DB_NAME}' created or already exists.`);

    await connection.query(`USE ${process.env.DB_NAME}`);

    // Drop existing tables to ensure new schema is applied
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS reminders');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Old tables dropped.');
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createRemindersTableQuery = `
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATETIME,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    await connection.query(createUsersTableQuery);
    console.log('Table "users" created or already exists.');

    await connection.query(createRemindersTableQuery);
    console.log('Table "reminders" created or already exists.');

    await connection.end();
    console.log('Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

initDB();
