const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'Hotelbackend', 'db', 'hotel.db');
console.log('Opening DB at:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening DB:', err);
        process.exit(1);
    }
});

db.all('PRAGMA table_info(billings)', (err, rows) => {
    if (err) {
        console.error('Error querying table info:', err);
    } else {
        console.log('Billings Columns:', rows.map(r => r.name));
    }
    db.close();
});
