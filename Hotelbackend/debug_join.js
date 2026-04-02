const db = require('./db/database');

const query = `
  SELECT 
    b.id,
    b.booking_id AS b_booking_id,
    bk.id AS bk_id,
    bk.booking_id AS bk_booking_id
  FROM billings b
  LEFT JOIN bookings bk ON b.booking_id = bk.id
  ORDER BY b.id DESC LIMIT 10
`;

console.log('🔍 DEBUG: Checking JOIN logic...\n');

db.all(query, [], (err, rows) => {
  if(err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log('Results:');
  console.log('─'.repeat(100));
  
  rows.forEach(row => {
    const hasMatch = row.bk_id !== null;
    console.log(`BILL ID: ${row.id}`);
    console.log(`  b.booking_id (from billings): ${row.b_booking_id}`);
    console.log(`  JOIN Match: ${hasMatch ? '✅' : '❌ NO MATCH'}`);
    console.log(`  bk.booking_id (from bookings): ${row.bk_booking_id || 'NULL'}`);
    console.log('');
  });
  
  process.exit();
});
