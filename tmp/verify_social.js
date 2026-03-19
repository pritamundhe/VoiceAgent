require('dotenv').config();
const mongoose = require('mongoose');

async function verify() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    followers: [mongoose.Schema.Types.ObjectId],
    following: [mongoose.Schema.Types.ObjectId]
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const users = await User.find({}).limit(5);
  console.log('Sample Users:');
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) | Followers: ${u.followers?.length || 0} | Following: ${u.following?.length || 0}`);
  });

  await mongoose.disconnect();
}

verify().catch(console.error);
