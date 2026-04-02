const db = require('./db/database');

console.log('='.repeat(60));
console.log('DEBUGGING: Booking ID NULL Issue');
console.log('='.repeat(60));

db.all('SELECT id, booking_id, customer_id, room_id, total_amount FROM billings LIMIT 5', [], (err, rows) => {
  if (err) { 
    console.error('❌ Error fetching billings:', err); 
    process.exit(1);
  }
  console.log('\n✅ BILLINGS TABLE DATA:');
  console.log(JSON.stringify(rows, null, 2));
  
  db.all('SELECT id, booking_id, customer_id, room_id FROM bookings  LIMIT 5', [], (err, rows2) => {
    if (err) { 
      console.error('❌ Error fetching bookings:', err);
      process.exit(1);
    }
    console.log('\n✅ BOOKINGS TABLE DATA:');
    console.log(JSON.stringify(rows2, null, 2));
    
    // Test the actual JOIN from billingService
    const query = `
      SELECT 
        b.id as bill_id,
        b.booking_id as billing_table_booking_id,
        bk.booking_id as bookings_table_booking_id,
        bk.id as bookings_table_id
      FROM billings b
      LEFT JOIN bookings bk ON b.booking_id = bk.booking_id
      LIMIT 5
    `;
    
    db.all(query, [], (err, rows3) => {
      if (err) { 
        console.error('❌ Error in JOIN query:', err);
        process.exit(1);
      }
      console.log('\n✅ JOIN TEST (b.booking_id = bk.booking_id):');
      console.log(JSON.stringify(rows3, null, 2));
      
      // Check if bookings_table_booking_id is NULL
      const nullCount = rows3.filter(r => r.bookings_table_booking_id === null).length;
      if (nullCount > 0) {
        console.log(`\n⚠️  WARNING: ${nullCount}/${rows3.length} rows have NULL bookings_table_booking_id`);
        console.log('This means the LEFT JOIN found no matching bookings!');
      }
      
      db.close();
    });
  });
});
