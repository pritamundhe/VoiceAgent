const mongoose = require('mongoose');

async function inspectDB() {
  const MONGODB_URI = "mongodb+srv://pritamundhe:HvV2i2N2G3xFcwNY@cluster0.3pldiqb.mongodb.net/?appName=Cluster0";
  
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
