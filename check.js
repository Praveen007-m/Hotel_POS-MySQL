const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./Hotelbackend/db/hotel.db');
db.all('PRAGMA table_info(billings)', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('COLUMNS:', rows.map(r => r.name).join(', '));
    }
    db.close();
});
