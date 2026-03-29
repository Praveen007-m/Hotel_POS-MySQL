const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'db', 'hotel.db');
const db = new sqlite3.Database(dbPath);
db.all('PRAGMA table_info(billings)', (err, rows) => {
    if (err) console.error(err);
    else console.log('COLUMNS:', rows.map(r => r.name).join(', '));
    db.close();
});
