const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/billings',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ API Response Success!');
      console.log('\n📊 First 3 Billing Records:\n');
      
      if (response.billings && response.billings.length > 0) {
        response.billings.slice(0, 3).forEach((bill, idx) => {
          console.log(`${idx + 1}. BILL ID: ${bill.id}`);
          console.log(`   BOOKING ID: ${bill.booking_id} ${bill.booking_id ? '✅' : '❌ EMPTY'}`);
          console.log(`   CUSTOMER: ${bill.customer_name}`);
          console.log(`   TOTAL: ₹${bill.total_amount}`);
          console.log(`   ADVANCE: ₹${bill.advance_paid}`);
          console.log('');
        });
        console.log(`\n✅ Total Records: ${response.pagination.total}`);
      } else {
        console.log('No billing records found');
      }
    } catch (err) {
      console.error('❌ Error parsing response:', err.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ API Error:', error.message);
  process.exit(1);
});

req.end();
