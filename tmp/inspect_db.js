require('dotenv').config();
const mongoose = require('mongoose');

async function inspectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Total Users: ${users.length}`);
  
  users.forEach((u, i) => {
    console.log(`${i+1}. _id: ${u._id} | name: ${u.name || 'MISSING'} | email: ${u.email || 'MISSING'}`);
  });

  await mongoose.disconnect();
}

inspectDB().catch(console.error);
