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
    console.log('Testing API endpoint: GET /api/billings...\n');
    
    const response = await makeRequest(`${API_URL}/api/billings?limit=2&page=1`);
    
    console.log('✅ API Response received!\n');
    
    console.log('Raw Response:', JSON.stringify(response, null, 2));
    
    const billings = response.billings || response;
    const pagination = response.pagination;
    
    console.log('Pagination:', JSON.stringify(pagination, null, 2));
    console.log('\n📊 Billing records:');
    
    if (billings && billings.length > 0) {
      billings.forEach((bill, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`    ✅ Bill ID: ${bill.id}`);
        console.log(`    ✅ Booking ID: ${bill.booking_id}`);
        console.log(`    ✅ Customer: ${bill.customer_name}`);
        console.log(`    ✅ Room ID: ${bill.room_id}`);
        console.log(`    ✅ Total: ₹${bill.total_amount}`);
        
        if (!bill.booking_id) {
          console.log('    ❌ ERROR: booking_id is NULL/undefined!');
        }
      });
      
      // Check for NULL booking_id values
      const nullCount = billings.filter(b => !b.booking_id).length;
      if (nullCount === 0) {
        console.log(`\n✅ SUCCESS: All ${billings.length} bills have booking_id populated!`);
      } else {
        console.log(`\n❌ FAIL: ${nullCount}/${billings.length} bills have NULL booking_id`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
})();
