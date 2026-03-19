require('dotenv').config();
const mongoose = require('mongoose');

async function checkUser() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    email: String,
    password: String
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const user = await User.findOne({ email: 'pritam@gmail.com' });
  if (user) {
    console.log(`User found: ${user.email}`);
    console.log(`Password hash: ${user.password}`);
  } else {
    console.log('User not found!');
  }

  await mongoose.disconnect();
}

checkUser().catch(console.error);
