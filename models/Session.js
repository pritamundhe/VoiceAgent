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

  // -------------------------------------------------------
  // Core speech metrics (calculated by lib/analytics.js and
  // lib/mlAnalysis.js before saving)
  // -------------------------------------------------------
  metrics: {
    // Basic counts
    totalWords: Number,
    duration: Number,       // seconds
    wpm: Number,
    totalFillers: Number,
    fillerCounts: {         // FIX: was missing — per-word breakdown
      type: Map,
      of: Number,
      default: {},
    },
    repeatedWordsCount: Number,
    uniqueWords: Number,
    vocabRichness: Number,  // type-token ratio (uniqueWords / totalWords)
    grammarErrors: Number,
    fluencyScore: Number,   // 0-100 composite score

    // ML-derived metrics (from lib/mlAnalysis.js)
    readabilityScore: Number,      // Flesch Reading Ease (0-100)
    coherenceScore: Number,        // Sentence-to-sentence semantic flow (0-100)
    vocabularyDiversity: Number,   // Simpson's Diversity Index (0-1)
    sentenceComplexity: Number,    // Avg words per sentence
    hapaxRatio: Number,            // Words used exactly once / total unique (lexical richness)
    tfidfTopKeywords: [String],    // Top 5 content keywords by TF-IDF weight
    paceVariance: Number,          // Std deviation of WPM across sentence chunks
    hesitationScore: Number,       // 0-100 (100 = perfectly fluent, 0 = very hesitant)
    overallMlScore: Number,        // Composite ML score (0-100)
  },

  // -------------------------------------------------------
  // AI Coach analysis (from OpenAI GPT)
  // -------------------------------------------------------
  aiAnalysis: {
    topic: String,
    feedback: String,
    suggestions: [String],
    confidenceScore: Number,   // 0-100 from AI evaluation
  },

  // -------------------------------------------------------
  // XP metadata for this session
  // -------------------------------------------------------
  xpEarned: { type: Number, default: 0 },

  // -------------------------------------------------------
  // Time partitioning (for weekly/monthly leaderboard queries)
  // -------------------------------------------------------
  weekNumber: { type: Number },   // ISO week number (1-53)
  monthKey: { type: String },     // "YYYY-MM" e.g. "2026-05"
  yearKey: { type: Number },      // e.g. 2026

  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for efficient leaderboard aggregations
SessionSchema.index({ userId: 1, timestamp: -1 });
SessionSchema.index({ userId: 1, weekNumber: 1, yearKey: 1 });
SessionSchema.index({ userId: 1, monthKey: 1 });
SessionSchema.index({ mode: 1 });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
