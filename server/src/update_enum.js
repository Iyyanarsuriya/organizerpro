const db = require('./config/db');

const updateEnum = async () => {
    try {
        await db.query(`ALTER TABLE it_attendance MODIFY COLUMN status enum('present','absent','late','half-day','permission','week_off','holiday', 'CL', 'SL', 'EL', 'OD') NOT NULL`);
        console.log('Successfully updated status enum');
        process.exit(0);
    } catch (err) {
        console.error('Failed to update status enum:', err);
        process.exit(1);
    }
};

updateEnum();
