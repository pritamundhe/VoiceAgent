import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  rank: {
    type: String,
    default: 'Newbie',
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },

  /**
   * Learning-path completion records.
   * Each entry is written once when the user first passes a module.
   * Re-attempts update bestScore / attempts in-place rather than
   * pushing a new entry, keeping the array compact.
   */
  completedModules: [
    {
      moduleId:  { type: String },   // e.g. "1a", "3c"
      passedAt:  { type: Date },
      bestScore: { type: Number },   // highest score ever achieved
      attempts:  { type: Number },   // total attempts including first pass
    },
  ],
}, { timestamps: true });

// Password hashing middleware
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to check password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  console.log(`Comparing password for user: ${this.email}`);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log(`Match: ${isMatch}`);
  return isMatch;
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
