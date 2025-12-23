const mysql = require('mysql2/promise');
const passwords = ['', 'root', 'admin', '1234', '123456', '12345678', 'password', 'mysql', '2002'];

async function test() {
    for (const pw of passwords) {
        try {
            const conn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pw
            });
            console.log(`SUCCESS with password: "${pw}"`);
            await conn.end();
            return;
        } catch (err) {
            console.log(`FAILED with password: "${pw}" - ${err.message}`);
        }
    }
}

test();
