/**
 * lib/badges.js
 * =============
 * Badge definitions and the unlock-checking engine.
 *
 * Each badge has:
 *   id          — unique string identifier stored on User.badges
 *   name        — display name
 *   description — what the user must do to earn it
 *   tier        — 'bronze' | 'silver' | 'gold' | 'platinum'
 *   check(user, session, allSessions)
 *               — pure function returning true if the badge should be awarded
 *
 * The check function receives:
 *   user        — the Mongoose User document (post-update)
 *   session     — the just-saved Session document
 *   allSessions — array of all the user's sessions (for cross-session checks)
 */

export const BADGE_DEFINITIONS = [
  {
    id: 'first_session',
    name: 'First Word',
    description: 'Complete your very first practice session.',
    tier: 'bronze',
    check: (user, _session, allSessions) => allSessions.length >= 1,
  },
  {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Maintain a 3-day consecutive practice streak.',
    tier: 'bronze',
    check: (user) => (user.streak || 0) >= 3,
  },
  {
    id: 'weekly_warrior',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day consecutive practice streak.',
    tier: 'silver',
    check: (user) => (user.streak || 0) >= 7,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 30-day consecutive practice streak.',
    tier: 'gold',
    check: (user) => (user.streak || 0) >= 30,
  },
  {
    id: 'mode_explorer',
    name: 'Mode Explorer',
    description: 'Practice in 5 different modes.',
    tier: 'bronze',
    check: (_user, _session, allSessions) => {
      const modes = new Set(allSessions.map(s => s.mode));
      return modes.size >= 5;
    },
  },
  {
    id: 'all_modes',
    name: 'Polyglot Speaker',
    description: 'Complete at least one session in every available mode.',
    tier: 'platinum',
    check: (_user, _session, allSessions) => {
      const modes = new Set(allSessions.map(s => s.mode));
      return modes.size >= 12;
    },
  },
  {
    id: 'fluency_star',
    name: 'Fluency Star',
    description: 'Achieve a fluency score of 90 or above in any session.',
    tier: 'silver',
    check: (_user, session) => (session.metrics?.fluencyScore || 0) >= 90,
  },
  {
    id: 'perfect_session',
    name: 'Perfect Delivery',
    description: 'Achieve an overall ML score of 95 or above in any session.',
    tier: 'gold',
    check: (_user, session) => (session.metrics?.overallMlScore || 0) >= 95,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Hit 160+ words per minute in any session.',
    tier: 'bronze',
    check: (_user, session) => (session.metrics?.wpm || 0) >= 160,
  },
  {
    id: 'slow_burn',
    name: 'Deliberate Speaker',
    description: 'Maintain 90-120 WPM (ideal thoughtful pacing) in 5 sessions.',
    tier: 'silver',
    check: (_user, _session, allSessions) => {
      const idealPace = allSessions.filter(s => {
        const wpm = s.metrics?.wpm || 0;
        return wpm >= 90 && wpm <= 120;
      });
      return idealPace.length >= 5;
    },
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 practice sessions.',
    tier: 'gold',
    check: (user) => (user.totalSessions || 0) >= 100,
  },
  {
    id: 'master_speaker',
    name: 'Master Speaker',
    description: 'Reach the Master rank.',
    tier: 'platinum',
    check: (user) => user.rank === 'Master',
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Complete 3 or more sessions in a single day.',
    tier: 'silver',
    check: (_user, session, allSessions) => {
      const sessionDate = new Date(session.timestamp).toDateString();
      const todaySessions = allSessions.filter(s =>
        new Date(s.timestamp).toDateString() === sessionDate
      );
      return todaySessions.length >= 3;
    },
  },
  {
    id: 'story_teller',
    name: 'The Storyteller',
    description: 'Complete 10 sessions in Storytelling mode.',
    tier: 'silver',
    check: (_user, _session, allSessions) => {
      return allSessions.filter(s => s.mode === 'storytelling').length >= 10;
    },
  },
  {
    id: 'negotiator',
    name: 'The Negotiator',
    description: 'Complete 10 sessions in Negotiation mode.',
    tier: 'silver',
    check: (_user, _session, allSessions) => {
      return allSessions.filter(s => s.mode === 'negotiation').length >= 10;
    },
  },
  {
    id: 'hour_glass',
    name: 'Hour Glass',
    description: 'Accumulate 60 minutes of total practice time.',
    tier: 'bronze',
    check: (user) => (user.totalPracticeMinutes || 0) >= 60,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Accumulate 10 hours (600 minutes) of total practice time.',
    tier: 'gold',
    check: (user) => (user.totalPracticeMinutes || 0) >= 600,
  },
  {
    id: 'vocab_rich',
    name: 'Vocabulary Rich',
    description: 'Achieve a vocabulary diversity score above 0.85 in any session.',
    tier: 'silver',
    check: (_user, session) => (session.metrics?.vocabularyDiversity || 0) >= 0.85,
  },
  {
    id: 'coherent_thinker',
    name: 'Coherent Thinker',
    description: 'Achieve a coherence score of 90+ in any session.',
    tier: 'gold',
    check: (_user, session) => (session.metrics?.coherenceScore || 0) >= 90,
  },
  {
    id: 'no_fillers',
    name: 'Clean Speaker',
    description: 'Complete a session of 100+ words with zero filler words.',
    tier: 'gold',
    check: (_user, session) => {
      const words = session.metrics?.totalWords || 0;
      const fillers = session.metrics?.totalFillers || 0;
      return words >= 100 && fillers === 0;
    },
  },
];

// -----------------------------------------------------------------------
// checkAndAwardBadges
// -------------------
// Runs all badge checks against the current user + session state.
// Returns an array of newly-earned badge objects (already not in user's
// existing badge list) so the caller can push them to user.badges.
//
// Parameters:
//   user        — Mongoose User document
//   session     — Mongoose Session document (just saved)
//   allSessions — array of all sessions for this user
//
// Returns:
//   Array<{ id, name, description, tier, earnedAt }>
// -----------------------------------------------------------------------
export function checkAndAwardBadges(user, session, allSessions) {
  const existingIds = new Set((user.badges || []).map(b => b.id));
  const newBadges = [];

  for (const badge of BADGE_DEFINITIONS) {
    // Skip already earned
    if (existingIds.has(badge.id)) continue;

    try {
      if (badge.check(user, session, allSessions)) {
        newBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          earnedAt: new Date(),
        });
      }
    } catch (err) {
      console.error(`Badge check failed for ${badge.id}:`, err.message);
    }
  }

  return newBadges;
}

// -----------------------------------------------------------------------
// getBadgesForDisplay
// -------------------
// Returns the full BADGE_DEFINITIONS list annotated with whether the
// user has earned each badge and when.
// Used by GET /api/badges to render the rewards gallery.
// -----------------------------------------------------------------------
export function getBadgesForDisplay(userBadges = []) {
  const earnedMap = {};
  for (const b of userBadges) {
    earnedMap[b.id] = b.earnedAt;
  }

  return BADGE_DEFINITIONS.map(def => ({
    id: def.id,
    name: def.name,
    description: def.description,
    tier: def.tier,
    earned: !!earnedMap[def.id],
    earnedAt: earnedMap[def.id] || null,
  }));
}
