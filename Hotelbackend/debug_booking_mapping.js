const db = require('./db/database');

(async () => {
  try {
    console.log('🔍 Finding correct booking mapping for numeric billing IDs...\n');

    // Check what data we have
    const query = `
      SELECT 
        b.id, 
        b.booking_id, 
        b.customer_id, 
        b.room_id, 
        DATE(b.check_in) as booking_date,
        bl.id as bill_id, 
        bl.booking_id as bill_booking_id, 
        bl.customer_id as bill_customer_id, 
        bl.room_id as bill_room_id, 
        DATE(bl.check_in) as bill_date
      FROM billings bl
      LEFT JOIN bookings b ON bl.room_id = b.room_id AND DATE(bl.check_in) = DATE(b.check_in)
      WHERE bl.booking_id NOT LIKE 'BK-%' 
      LIMIT 10
    `;

    const [results] = await db.query(query);
    console.log('Checking for room_id + check_in date match:\n');
    
    results.forEach(row => {
      console.log('Bill ID:', row.bill_id);
      console.log('  Current booking_id:', row.bill_booking_id);
      console.log('  Room ID:', row.bill_room_id, '| Date:', row.bill_date);
      console.log('  Matched Booking ID:', row.id, '| Booking Code:', row.booking_id);
      console.log('---');
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
