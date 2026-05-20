const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// MongoDB connection string - adapt if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spokenedge';

const dummyUsers = [
  { name: 'Alex Johnson', email: 'alex@example.com', xp: 8540, weeklyXp: 1200, monthlyXp: 4500, rank: 'Expert', level: 42, streak: 12, bestStreak: 15, totalSessions: 142 },
  { name: 'Sarah Miller', email: 'sarah@example.com', xp: 12450, weeklyXp: 2100, monthlyXp: 6200, rank: 'Master', level: 62, streak: 31, bestStreak: 45, totalSessions: 210 },
  { name: 'David Chen', email: 'david@example.com', xp: 6230, weeklyXp: 850, monthlyXp: 2100, rank: 'Advanced', level: 31, streak: 5, bestStreak: 12, totalSessions: 85 },
  { name: 'Emma Wilson', email: 'emma@example.com', xp: 4120, weeklyXp: 450, monthlyXp: 1200, rank: 'Intermediate', level: 20, streak: 2, bestStreak: 8, totalSessions: 54 },
  { name: 'James Taylor', email: 'james@example.com', xp: 9800, weeklyXp: 1500, monthlyXp: 3800, rank: 'Expert', level: 49, streak: 18, bestStreak: 22, totalSessions: 165 },
  { name: 'Linda Martinez', email: 'linda@example.com', xp: 2150, weeklyXp: 300, monthlyXp: 800, rank: 'Beginner', level: 10, streak: 1, bestStreak: 5, totalSessions: 32 },
  { name: 'Michael Brown', email: 'michael@example.com', xp: 7500, weeklyXp: 900, monthlyXp: 2800, rank: 'Advanced', level: 37, streak: 8, bestStreak: 14, totalSessions: 110 },
  { name: 'Sophia Garcia', email: 'sophia@example.com', xp: 14200, weeklyXp: 2500, monthlyXp: 7100, rank: 'Master', level: 71, streak: 42, bestStreak: 60, totalSessions: 250 },
  { name: 'William Rodriguez', email: 'william@example.com', xp: 3400, weeklyXp: 600, monthlyXp: 1500, rank: 'Intermediate', level: 17, streak: 4, bestStreak: 9, totalSessions: 48 },
  { name: 'Olivia Lee', email: 'olivia@example.com', xp: 5800, weeklyXp: 750, monthlyXp: 2200, rank: 'Advanced', level: 29, streak: 6, bestStreak: 11, totalSessions: 75 },
  { name: 'Daniel White', email: 'daniel@example.com', xp: 1100, weeklyXp: 200, monthlyXp: 500, rank: 'Beginner', level: 5, streak: 0, bestStreak: 3, totalSessions: 15 },
  { name: 'Isabella Harris', email: 'isabella@example.com', xp: 8900, weeklyXp: 1100, monthlyXp: 3200, rank: 'Expert', level: 44, streak: 14, bestStreak: 18, totalSessions: 130 },
  { name: 'Matthew Clark', email: 'matthew@example.com', xp: 4800, weeklyXp: 550, monthlyXp: 1800, rank: 'Intermediate', level: 24, streak: 3, bestStreak: 7, totalSessions: 62 },
  { name: 'Ava Lewis', email: 'ava@example.com', xp: 10500, weeklyXp: 1800, monthlyXp: 4100, rank: 'Expert', level: 52, streak: 21, bestStreak: 25, totalSessions: 180 },
  { name: 'Joseph Walker', email: 'joseph@example.com', xp: 2900, weeklyXp: 400, monthlyXp: 1100, rank: 'Beginner', level: 14, streak: 2, bestStreak: 6, totalSessions: 40 }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Add fake users without deleting the real user
    let addedCount = 0;
    for (const u of dummyUsers) {
      const exists = await db.collection('users').findOne({ email: u.email });
      if (!exists) {
        await db.collection('users').insertOne({
          ...u,
          password: 'hashed_password_placeholder',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        addedCount++;
      }
    }
    
    console.log(`Successfully added ${addedCount} dummy users for the leaderboard.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
