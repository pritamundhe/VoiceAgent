import mongoose from 'mongoose';

/**
 * ModuleAttempt — records every time a user attempts a learning-path module.
 *
 * Key design decisions:
 *  - Separate from Session so we can have module-specific pass/fail logic
 *    independent of the general practice session flow.
 *  - Compound index on (userId, moduleId) lets us quickly look up all attempts
 *    a user has made on a specific module.
 *  - xpAwarded is stored per attempt so the complete API can avoid double-awarding
 *    XP when the user retries an already-passed module.
 */
const ModuleAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Module identifier from learningPathData.js  (e.g. "1a", "3c", "5b")
    moduleId: {
      type: String,
      required: true,
    },

    // Which top-level level this module belongs to (1–5)
    levelId: {
      type: Number,
      required: true,
    },

    // Task format (repeat | short | retell | respond | describe |
    //              fitb-r | fitb-rw | fitb-l | reorder | mc-multi |
    //              mc-single | summarise | dictation | highlight)
    taskType: {
      type: String,
      required: true,
    },

    // Section of the exam
    part: {
      type: String,
      enum: ['speaking', 'reading', 'listening'],
      required: true,
    },

    // The AI-generated prompt / scenario / sentences shown to the user
    topic: { type: String },

    // The user's spoken or written response (transcript)
    transcript: { type: String },

    // Normalised score 0-100 (accuracy % for objective tasks,
    // confidenceScore from AI for subjective tasks)
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Whether the attempt met the pass threshold for this taskType
    passed: { type: Boolean, default: false },

    // 1-based counter — how many times has this user attempted THIS module
    attemptNumber: { type: Number, default: 1 },

    // Snapshot of the speech metrics at the time of this attempt
    metrics: {
      totalWords:   Number,
      duration:     Number,
      wpm:          Number,
      totalFillers: Number,
      fluencyScore: Number,
      vocabRichness: Number,
    },

    // XP awarded for this specific attempt (0 if retrying a passed module)
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Fast look-up: "all attempts by user X on module Y"
ModuleAttemptSchema.index({ userId: 1, moduleId: 1 });
// Fast look-up: "all speaking attempts for user X" (used in progress API)
ModuleAttemptSchema.index({ userId: 1, part: 1 });
// Fast look-up: recent attempts for a user (used in start API for topic avoidance)
ModuleAttemptSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ModuleAttempt ||
  mongoose.model('ModuleAttempt', ModuleAttemptSchema);
