import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  prompt: {
    type: String,
  },
  metrics: {
    totalWords: Number,
    duration: Number,
    wpm: Number,
    totalFillers: Number,
    repeatedWordsCount: Number,
    uniqueWords: Number,
    vocabRichness: Number,
    grammarErrors: Number,
    fluencyScore: Number,
  },
  aiAnalysis: {
    topic: String,
    feedback: String,
    suggestions: [String],
    confidenceScore: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
