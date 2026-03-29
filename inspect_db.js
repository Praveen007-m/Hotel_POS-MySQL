const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'Hotelbackend', 'db', 'hotel.db');

console.log('--- DB Inspection ---');
console.log('Path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening DB:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    console.log('\n--- Billings Table Info ---');
    db.all('PRAGMA table_info(billings)', (err, rows) => {
        if (err) console.error(err.message);
        else console.table(rows);
    });

    console.log('\n--- Sample Billings ---');
    db.all('SELECT * FROM billings LIMIT 3', (err, rows) => {
        if (err) console.error(err.message);
        else console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\n--- Sample Bookings ---');
    db.all('SELECT * FROM bookings LIMIT 2', (err, rows) => {
        if (err) console.error(err.message);
        else console.log(JSON.stringify(rows, null, 2));
    });
});

setTimeout(() => db.close(), 1000);
