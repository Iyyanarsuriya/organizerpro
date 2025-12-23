const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runMigration() {
    let connection;

    try {
        console.log('🔄 Connecting to database...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'reminder_db'
        });

        console.log('✅ Connected to database');
        console.log('🔄 Checking existing columns...');

        // Check if columns already exist
        const [existingColumns] = await connection.query(`
            SHOW COLUMNS FROM users WHERE Field IN ('reset_otp', 'reset_otp_expiry')
        `);

        const hasOtpColumn = existingColumns.some(col => col.Field === 'reset_otp');
        const hasExpiryColumn = existingColumns.some(col => col.Field === 'reset_otp_expiry');

        // Add reset_otp column if it doesn't exist
        if (!hasOtpColumn) {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN reset_otp VARCHAR(6) DEFAULT NULL
            `);
            console.log('✅ Added reset_otp column');
        } else {
            console.log('ℹ️  reset_otp column already exists');
        }

        // Add reset_otp_expiry column if it doesn't exist
        if (!hasExpiryColumn) {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN reset_otp_expiry DATETIME DEFAULT NULL
            `);
            console.log('✅ Added reset_otp_expiry column');
        } else {
            console.log('ℹ️  reset_otp_expiry column already exists');
        }

        // Add index
        try {
            await connection.query(`
                CREATE INDEX idx_reset_otp ON users(reset_otp, reset_otp_expiry)
            `);
            console.log('✅ Added index for OTP columns');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Index already exists, skipping...');
            } else {
                throw error;
            }
        }

        // Verify the changes
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users WHERE Field IN ('reset_otp', 'reset_otp_expiry')
        `);

        console.log('\n📋 Verification:');
        console.table(columns);

        console.log('\n✨ Migration completed successfully!');
        console.log('🎉 OTP-based password reset is now ready to use!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the migration
runMigration();
