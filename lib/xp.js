/**
 * lib/xp.js
 * =========
 * Multi-factor XP calculation engine.
 *
 * XP Formula breakdown:
 *
 *   Base                50 XP    — awarded for any completed session
 *   + Duration bonus    up to 100 XP  (10 XP per minute, capped at 10 min)
 *   + Fluency bonus     up to 80 XP   (fluencyScore * 0.80)
 *   + Confidence bonus  up to 50 XP   (AI confidenceScore * 0.50)
 *   + ML score bonus    up to 40 XP   (overallMlScore * 0.40)
 *   x Mode multiplier   1.0 – 1.25    (harder modes reward more XP)
 *   + Streak bonus      +5% per streak day, max +50%
 *   + First-of-day bonus  25 XP   (only awarded once per calendar day)
 *
 * Total is capped at 400 XP per session to prevent abuse.
 *
 * Rank thresholds (rebalanced for a rewarding progression curve):
 *   Newbie        0 – 499
 *   Beginner    500 – 1,999
 *   Intermediate 2,000 – 4,999
 *   Advanced    5,000 – 9,999
 *   Expert     10,000 – 19,999
 *   Master     20,000+
 *
 * Level formula:
 *   level = 1 + floor(xp / 200)
 *   → Levels up every 200 XP, giving smooth, frequent progression.
 */

// -----------------------------------------------------------------------
// Mode difficulty multipliers
// Modes that require more cognitive effort or real-world stakes reward
// proportionally more XP.
// -----------------------------------------------------------------------
const MODE_MULTIPLIERS = {
  'interview':          1.25,
  'negotiation':        1.25,
  'media-interview':    1.20,
  'conflict-resolution':1.15,
  'group-discussion':   1.15,
  'sales':              1.10,
  'pitch':              1.10,
  'public-speaking':    1.05,
  'storytelling':       1.05,
  'networking':         1.00,
  'teaching':           1.00,
  'client-update':      1.00,
};

// -----------------------------------------------------------------------
// Rank thresholds — lower bound of each rank
// -----------------------------------------------------------------------
export const RANK_THRESHOLDS = [
  { rank: 'Master',       minXp: 20000 },
  { rank: 'Expert',       minXp: 10000 },
  { rank: 'Advanced',     minXp: 5000  },
  { rank: 'Intermediate', minXp: 2000  },
  { rank: 'Beginner',     minXp: 500   },
  { rank: 'Newbie',       minXp: 0     },
];

// Next rank XP target (used for progress bar)
export const NEXT_RANK_TARGET = {
  'Newbie':        500,
  'Beginner':      2000,
  'Intermediate':  5000,
  'Advanced':      10000,
  'Expert':        20000,
  'Master':        20000, // max rank
};

// -----------------------------------------------------------------------
// getRankFromXp
// Returns the rank string for a given XP total.
// -----------------------------------------------------------------------
export function getRankFromXp(xp) {
  for (const { rank, minXp } of RANK_THRESHOLDS) {
    if (xp >= minXp) return rank;
  }
  return 'Newbie';
}

// -----------------------------------------------------------------------
// getLevelFromXp
// Level increases every 200 XP — granular, frequent progression feedback.
// -----------------------------------------------------------------------
export function getLevelFromXp(xp) {
  return 1 + Math.floor(xp / 200);
}

// -----------------------------------------------------------------------
// calculateXp
// -----------
// Parameters:
//   duration       — session duration in seconds
//   fluencyScore   — 0-100 from lib/analytics.js
//   confidenceScore— 0-100 from AI evaluation
//   overallMlScore — 0-100 from lib/mlAnalysis.js
//   mode           — practice mode id
//   streak         — current streak count before this session
//   isFirstToday   — boolean: first session of this calendar day
//
// Returns:
//   { xpGained, breakdown }
//   breakdown is a key→value map for displaying the XP toast to the user.
// -----------------------------------------------------------------------
export function calculateXp({
  duration = 0,
  fluencyScore = 0,
  confidenceScore = 0,
  overallMlScore = 0,
  mode = '',
  streak = 0,
  isFirstToday = false,
}) {
  // 1. Base XP
  const base = 50;

  // 2. Duration bonus: 10 XP per minute, capped at 100 XP (10 min)
  const durationMinutes = duration / 60;
  const durationBonus = Math.min(100, Math.round(durationMinutes * 10));

  // 3. Fluency bonus (0-80 XP)
  const fluencyBonus = Math.round(fluencyScore * 0.80);

  // 4. Confidence bonus (0-50 XP)
  const confidenceBonus = Math.round(confidenceScore * 0.50);

  // 5. ML score bonus (0-40 XP)
  const mlBonus = Math.round(overallMlScore * 0.40);

  // 6. Sub-total before multipliers
  const subTotal = base + durationBonus + fluencyBonus + confidenceBonus + mlBonus;

  // 7. Mode difficulty multiplier
  const modeMultiplier = MODE_MULTIPLIERS[mode] || 1.0;
  const afterMode = Math.round(subTotal * modeMultiplier);

  // 8. Streak multiplier: +5% per streak day, capped at +50%
  const streakMultiplier = 1 + Math.min(0.50, streak * 0.05);
  const afterStreak = Math.round(afterMode * streakMultiplier);

  // 9. First-of-day bonus
  const firstDayBonus = isFirstToday ? 25 : 0;

  // 10. Total, capped at 400
  const total = Math.min(400, afterStreak + firstDayBonus);

  return {
    xpGained: total,
    breakdown: {
      base,
      durationBonus,
      fluencyBonus,
      confidenceBonus,
      mlBonus,
      modeMultiplier,
      streakMultiplier: parseFloat(streakMultiplier.toFixed(2)),
      firstDayBonus,
      total,
    },
  };
}
