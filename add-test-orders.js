// Script to add test orders to the database
// Run this script to populate the database with test orders for searching

const testOrders = [
  {
    orderNumber: "ORD20250102001",
    lineNumber: 1,
    productionDateTime: "2025-01-02T10:30:00Z",
    operatorId: "OP001",
    status: "active"
  },
  {
    orderNumber: "ORD20250102002",
    lineNumber: 2,
    productionDateTime: "2025-01-02T11:00:00Z",
    operatorId: "OP002",
    status: "active"
  },
  {
    orderNumber: "ORD20250102003",
    lineNumber: 1,
    productionDateTime: "2025-01-02T11:30:00Z",
    operatorId: "OP003",
    status: "completed"
  },
  {
    orderNumber: "ORD20250102004",
    lineNumber: 3,
    productionDateTime: "2025-01-02T12:00:00Z",
    operatorId: "OP001",
    status: "active"
  },
  {
    orderNumber: "ORD20250102005",
    lineNumber: 2,
    productionDateTime: "2025-01-02T12:30:00Z",
    operatorId: "OP004",
    status: "active"
  },
  {
    orderNumber: "TEST001",
    lineNumber: 1,
    productionDateTime: "2025-01-02T13:00:00Z",
    operatorId: "OP001",
    status: "active"
  },
  {
    orderNumber: "TEST002",
    lineNumber: 2,
    productionDateTime: "2025-01-02T13:30:00Z",
    operatorId: "OP002",
    status: "completed"
  },
  {
    orderNumber: "BATCH001",
    lineNumber: 1,
    productionDateTime: "2025-01-02T14:00:00Z",
    operatorId: "OP003",
    status: "active"
  },
  {
    orderNumber: "BATCH002",
    lineNumber: 3,
    productionDateTime: "2025-01-02T14:30:00Z",
    operatorId: "OP004",
    status: "active"
  },
  {
    orderNumber: "PROD001",
    lineNumber: 2,
    productionDateTime: "2025-01-02T15:00:00Z",
    operatorId: "OP001",
    status: "completed"
  }
];

async function addTestOrders() {
  console.log('Adding test orders to database...');
  
  let successCount = 0;
  let errorCount = 0;

  for (const order of testOrders) {
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        },
        body: JSON.stringify(order)
      });

      if (response.ok) {
        console.log(`✅ Added order: ${order.orderNumber}`);
        successCount++;
      } else {
        const error = await response.json();
        if (error.error && error.error.includes('already exists')) {
          console.log(`⚠️  Order already exists: ${order.orderNumber}`);
        } else {
          console.log(`❌ Failed to add order ${order.orderNumber}:`, error.error);
          errorCount++;
        }
      }
    } catch (error) {
      console.log(`❌ Error adding order ${order.orderNumber}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${successCount} orders`);
  console.log(`❌ Errors: ${errorCount} orders`);
  console.log(`⚠️  Already existed: ${testOrders.length - successCount - errorCount} orders`);
}

// Run the script
console.log('🚀 Test Orders Population Script');
console.log('================================');

addTestOrders();

console.log('\n📋 Instructions:');
console.log('1. Make sure the server is running on port 3001');
console.log('2. Replace YOUR_JWT_TOKEN_HERE with a valid JWT token');
console.log('3. Ensure the database is running and accessible');
console.log('4. Run this script with: node add-test-orders.js');
console.log('\n🔍 Test Orders Added:');
testOrders.forEach(order => {
  console.log(`- ${order.orderNumber} (Line ${order.lineNumber}, Operator ${order.operatorId}, Status: ${order.status})`);
});
console.log('\n💡 You can now test search with:');
console.log('- Order numbers: ORD20250102001, TEST001, BATCH001, PROD001');
console.log('- Operator IDs: OP001, OP002, OP003, OP004');
console.log('- Partial searches: ORD, TEST, BATCH, PROD');
console.log('- Status filters: active, completed');
console.log('- Line numbers: 1, 2, 3'); 