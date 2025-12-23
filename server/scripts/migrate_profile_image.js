const db = require('../Config/db');

const migrate = async () => {
    try {
        console.log('Adding profile_image column to users table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL;
        `);
        console.log('Migration successful!');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column profile_image already exists. Skipping...');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        process.exit();
    }
};

migrate();
