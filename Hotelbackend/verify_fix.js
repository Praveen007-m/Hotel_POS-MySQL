const db = require('./db/database');

console.log('='.repeat(60));
console.log('VERIFY FIX: booking_id column should now be populated');
console.log('='.repeat(60));

// Test the CORRECTED query
const query = `
  SELECT 
    b.id,
    b.booking_id AS booking_id,
    b.customer_id,
    b.room_id,
    b.total_amount,
    b.advance_paid,
    b.created_at,
    b.is_downloaded,
    b.billed_by_name,
    b.billed_by_role,
    c.name as customer_name,
    COUNT(i.id) as line_items_count,
    SUM(i.total) as line_items_total
  FROM billings b 
  LEFT JOIN bookings bk ON b.booking_id = bk.booking_id
  LEFT JOIN customers c ON b.customer_id = c.id
  LEFT JOIN invoices i ON b.id = i.billing_id
  GROUP BY 
    b.id,
    b.booking_id,
    b.customer_id,
    b.room_id,
    b.total_amount,
    b.advance_paid,
    b.created_at,
    b.is_downloaded,
    b.billed_by_name,
    b.billed_by_role,
    c.name
  ORDER BY b.created_at DESC
  LIMIT 5
`;

db.all(query, [], (err, rows) => {
  if (err) { 
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log('\n✅ CORRECTED QUERY RESULTS:');
  console.log(JSON.stringify(rows, null, 2));
  
  // Verify booking_id is populated
  const nullCount = rows.filter(r => r.booking_id === null || r.booking_id === undefined).length;
  if (nullCount > 0) {
    console.log(`\n❌ FAIL: ${nullCount}/${rows.length} rows still have NULL booking_id`);
  } else {
    console.log(`\n✅ SUCCESS: All ${rows.length} rows have booking_id populated!`);
  }
  
  // Show a sample formatted response
  if (rows.length > 0) {
    const sample = rows[0];
    console.log('\n📋 Sample API response:');
    console.log(`   id: ${sample.id}`);
    console.log(`   booking_id: "${sample.booking_id}"`);
    console.log(`   customer_name: "${sample.customer_name}"`);
    console.log(`   room_id: ${sample.room_id}`);
    console.log(`   total_amount: ${sample.total_amount}`);
  }
  
  process.exit(0);
});
