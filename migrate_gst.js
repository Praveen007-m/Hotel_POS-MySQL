const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'Hotelbackend', 'db', 'hotel.db');

console.log('Running migration: add_gst_included_to_billings');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening DB:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.run(`ALTER TABLE billings ADD COLUMN gst_included BOOLEAN DEFAULT 0`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('✅ gst_included column already exists');
            } else {
                console.error('❌ Error adding column:', err.message);
            }
        } else {
            console.log('✅ gst_included column added successfully');
        }
    });
});

setTimeout(() => {
    db.close();
    console.log('Migration finished');
}, 1000);
