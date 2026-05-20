import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BadgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  image: {
    type: String,
    default: '',
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // --- XP & Progression ---
  xp: { type: Number, default: 0 },
  weeklyXp: { type: Number, default: 0 },   // Resets each Monday
  monthlyXp: { type: Number, default: 0 },  // Resets each 1st of month
  level: { type: Number, default: 1 },
  rank: { type: String, default: 'Newbie' },

  // --- Streaks ---
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 }, // All-time best streak record

  // --- Activity Stats ---
  totalSessions: { type: Number, default: 0 },          // Denormalized count for leaderboard
  totalPracticeMinutes: { type: Number, default: 0 },   // Accumulated practice time

  // --- Dates for leaderboard resets ---
  lastWeekReset: { type: Date, default: null },
  lastMonthReset: { type: Date, default: null },
  lastActive: { type: Date, default: Date.now },

  // --- Rewards ---
  badges: [BadgeSchema],

}, { timestamps: true });

// -------------------------------------------------------
// Pre-save: hash password if modified
// -------------------------------------------------------
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// -------------------------------------------------------
// Method: compare candidate password against stored hash
// -------------------------------------------------------
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// -------------------------------------------------------
// Static: check and reset weekly/monthly XP if needed
// Called before leaderboard queries and after session saves
// -------------------------------------------------------
UserSchema.methods.checkAndResetPeriodic = function () {
  const now = new Date();

  // Reset weekly XP at the start of each ISO week (Monday)
  const startOfThisWeek = getStartOfISOWeek(now);
  if (!this.lastWeekReset || this.lastWeekReset < startOfThisWeek) {
    this.weeklyXp = 0;
    this.lastWeekReset = startOfThisWeek;
  }

  // Reset monthly XP on the 1st of each month
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!this.lastMonthReset || this.lastMonthReset < startOfThisMonth) {
    this.monthlyXp = 0;
    this.lastMonthReset = startOfThisMonth;
  }
};

function getStartOfISOWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
