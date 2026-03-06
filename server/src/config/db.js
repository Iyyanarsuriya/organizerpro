// const mysql = require("mysql2");
// require("dotenv").config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: Number(process.env.DB_PORT), // ✅ REQUIRED
//     dateStrings: true, // ✅ Return dates as strings to avoid timezone issues

//     // 🔥 VERY IMPORTANT FOR RAILWAY
//     ssl: {
//         rejectUnauthorized: false
//     },

//     waitForConnections: true,
//     connectionLimit: 5,
//     queueLimit: 0,

//     connectTimeout: 30000,
// });


// module.exports = pool.promise();



const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

function createPool() {
    pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    pool.on("error", (err) => {
        console.error("MySQL Pool Error:", err);
    });

    return pool;
}

module.exports = createPool();