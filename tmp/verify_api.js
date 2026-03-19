require('dotenv').config();
const mongoose = require('mongoose');

async function verifyAPI() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String }));

  const user = await User.findOne({ email: 'test_user@gmail.com' });
  if (user) {
    console.log(`Found test user: ${user._id}`);
    // Simulate API call logic
    const profile = await User.findById(user._id).select('name email image followers following createdAt');
    console.log('API Response Sample:');
    console.log(JSON.stringify({
      userId: profile._id,
      name: profile.name,
      followerCount: profile.followers?.length || 0
    }, null, 2));
  } else {
    console.log('Test user not found');
  }

  await mongoose.disconnect();
}

verifyAPI().catch(console.error);
