const http = require('http');

const API_URL = 'http://localhost:5000';

const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

(async () => {
  try {
    console.log('='.repeat(70));
    console.log('FINAL VERIFICATION: Booking ID Fix - Multiple Records Test');
    console.log('='.repeat(70));
    
    // Test with limit 5 to show multiple records
    const response = await makeRequest(`${API_URL}/api/billings?limit=5&page=1`);
    
    const billings = response.billings || [];
    
    console.log(`\n✅ API returned ${billings.length} billing records\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    billings.forEach((bill, idx) => {
      const hasBookingId = bill.booking_id && bill.booking_id !== 'null';
      const status = hasBookingId ? '✅' : '❌';
      
      console.log(`${status} Record ${idx + 1}:`);
      console.log(`   Bill ID: ${bill.id}`);
      console.log(`   Booking ID: "${bill.booking_id}"`);
      console.log(`   Customer: ${bill.customer_name}`);
      console.log(`   Amount: ₹${bill.total_amount}`);
      
      if (hasBookingId) {
        successCount++;
      } else {
        failCount++;
      }
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log(`RESULTS: ${successCount} ✅ | ${failCount} ❌`);
    console.log('='.repeat(70));
    
    if (failCount === 0 && successCount > 0) {
      console.log('\n🟢 SUCCESS: All bills have booking_id populated!');
      console.log('   The Billing table UI will now display booking IDs correctly.');
      console.log('\nUI Display Example:');
      console.log('   Bill # | Booking ID | Customer   | Amount');
      console.log('   ------|------------|------------|--------');
      billings.slice(0, 3).forEach(b => {
        console.log(`   ${String(b.id).padEnd(5)} | ${String(b.booking_id).padEnd(9)} | ${(b.customer_name || '-').substring(0, 9).padEnd(9)} | ₹${b.total_amount}`);
      });
    } else {
      console.log('\n🔴 FAIL: Some bills still have NULL booking_id');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
