// Load Room model like the API does
require('dotenv').config();

// Import using the same pattern as the API  
const path = require('path');

// We need to use dynamic import for ES modules
async function main() {
  try {
    // Directly use mongoose
    const mongoose = require('mongoose');
    
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'exists' : 'NOT FOUND');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to:', mongoose.connection.db.databaseName);
    
    // Query using raw mongodb driver
    const rooms = await mongoose.connection.db.collection('rooms').find({}).limit(5).toArray();
    console.log('\nSample rooms:', rooms.length);
    
    if (rooms.length > 0) {
      rooms.forEach((r, i) => {
        console.log(`\n${i+1}. ${r.name}`);
        console.log(`   Address: ${r.address}`);
        console.log(`   Status: ${r.status}, isDeleted: ${r.isDeleted}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
