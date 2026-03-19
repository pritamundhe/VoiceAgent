require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    followers: [mongoose.Schema.Types.ObjectId],
    following: [mongoose.Schema.Types.ObjectId]
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // Check if test user exists
  const exists = await User.findOne({ email: 'test_user@gmail.com' });
  if (!exists) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('1234', salt);
    await User.create({
      name: 'Test User',
      email: 'test_user@gmail.com',
      password,
      followers: [],
      following: []
    });
    console.log('Test User Created!');
  } else {
    console.log('Test User already exists!');
  }

  await mongoose.disconnect();
}

createTestUser().catch(console.error);
