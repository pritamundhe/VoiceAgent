import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ModuleAttempt from '@/models/ModuleAttempt';
import jwt from 'jsonwebtoken';
import {
  MODULE_PASS_THRESHOLDS,
  MODULE_XP,
  MODULE_PREREQUISITES,
} from '@/lib/learningPathData';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// ─── Rank calculator (mirrors the one in analyze-session) ──────────────────
function getRank(xp) {
  if (xp >= 10000) return 'Master';
  if (xp >= 5000)  return 'Expert';
  if (xp >= 3000)  return 'Advanced';
  if (xp >= 1500)  return 'Intermediate';
  if (xp >= 500)   return 'Beginner';
  return 'Newbie';
}

/**
 * After the user passes module X, find every module that was previously
 * locked solely because X was a missing prerequisite and is now unlocked.
 */
function getNewlyUnlockedModules(justPassedId, allPassedIds) {
  const allPassedSet = new Set([...allPassedIds, justPassedId]);
  return Object.entries(MODULE_PREREQUISITES)
    .filter(([moduleId, prereqs]) =>
      !allPassedIds.includes(moduleId) &&         // wasn't already unlocked
      prereqs.includes(justPassedId) &&            // depends on the just-passed module
      prereqs.every(p => allPassedSet.has(p))      // ALL prerequisites now met
    )
    .map(([moduleId]) => moduleId);
}

/**
 * POST /api/learning-path/complete
 *
 * Called by the frontend after a module session ends.
 * Responsibilities:
 *  1. Determine pass / fail based on taskType threshold
 *  2. Save a ModuleAttempt record
 *  3. Award XP (with first-attempt and streak bonuses)
 *  4. Update user.completedModules if this is a first-time pass
 *  5. Recalculate rank and level-up if threshold crossed
 *  6. Return everything the frontend needs to render the result screen
 *
 * Body:
 *  {
 *    moduleId,      // e.g. "1a"
 *    levelId,       // 1-5
 *    taskType,      // e.g. "repeat"
 *    part,          // "speaking" | "reading" | "listening"
 *    transcript,    // user's spoken/written answer
 *    score,         // 0-100 normalised score from frontend
 *    metrics,       // calculateMetrics() output
 *    topic,         // prompt that was shown to the user
 *    repeatResults, // [{target, spoken}] only for taskType==="repeat"
 *  }
 */
export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId  = decoded.userId;

    const {
      moduleId,
      levelId,
      taskType,
      part,
      transcript,
      score,
      metrics,
      topic,
    } = await request.json();

    if (!moduleId || !taskType) {
      return Response.json(
        { error: 'moduleId and taskType are required' },
        { status: 400 }
      );
    }

    // ── 1. Load user ────────────────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // ── 2. Pass / fail decision ─────────────────────────────────────────
    const passThreshold = MODULE_PASS_THRESHOLDS[taskType] || 60;
    const finalScore    = (score != null && !isNaN(score)) ? Number(score) : 0;
    const passed        = finalScore >= passThreshold;

    // ── 3. Attempt number ───────────────────────────────────────────────
    const prevAttempts  = await ModuleAttempt.countDocuments({ userId, moduleId });
    const attemptNumber = prevAttempts + 1;

    // ── 4. Check if user has already passed this module ─────────────────
    user.completedModules = user.completedModules || [];
    const existingRecord  = user.completedModules.find(m => m.moduleId === moduleId);
    const alreadyPassed   = Boolean(existingRecord);

    // ── 5. XP Calculation ───────────────────────────────────────────────
    const baseXp = MODULE_XP[levelId] || 50;
    let xpAwarded = 0;

    if (passed && !alreadyPassed) {
      // First-time pass: full base XP
      xpAwarded = baseXp;
      // First-attempt bonus (+50 % of base)
      if (attemptNumber === 1) xpAwarded += Math.round(baseXp * 0.5);
      // Active streak bonus (flat +25 XP)
      if ((user.streak || 0) > 0) xpAwarded += 25;
    } else if (passed && alreadyPassed) {
      // Re-pass of an already-completed module: small review reward
      xpAwarded = Math.round(baseXp * 0.1);
    } else {
      // Failed attempt: partial XP proportional to how close they were
      // Scales from 0 to 30 % of baseXp
      xpAwarded = Math.round((finalScore / 100) * baseXp * 0.3);
    }

    // ── 6. Persist ModuleAttempt ────────────────────────────────────────
    await new ModuleAttempt({
      userId,
      moduleId,
      levelId:       levelId || 1,
      taskType,
      part,
      topic,
      transcript,
      score:         finalScore,
      passed,
      attemptNumber,
      metrics:       metrics || {},
      xpAwarded,
    }).save();

    // ── 7. Update user completedModules + XP + rank ─────────────────────
    let newlyUnlockedModules = [];
    const oldRank = user.rank;

    if (passed && !alreadyPassed) {
      // Record first-time pass
      user.completedModules.push({
        moduleId,
        passedAt:  new Date(),
        bestScore: finalScore,
        attempts:  attemptNumber,
      });

      // Which modules just got unlocked by this pass?
      const allPassedIds = user.completedModules.map(m => m.moduleId);
      newlyUnlockedModules = getNewlyUnlockedModules(moduleId, allPassedIds);

    } else if (alreadyPassed && finalScore > (existingRecord.bestScore || 0)) {
      // Improve personal best on a retried module
      existingRecord.bestScore = finalScore;
      existingRecord.attempts  = (existingRecord.attempts || 0) + 1;
    }

    // Award XP and recalculate rank
    user.xp = (user.xp || 0) + xpAwarded;
    const newRank = getRank(user.xp);
    if (newRank !== oldRank) {
      user.rank  = newRank;
      user.level = (user.level || 1) + 1;
      console.log(`🏆 [learning-path/complete] ${userId} ranked up: ${oldRank} → ${newRank}`);
    }

    user.lastActive = new Date();
    await user.save();

    // ── 8. Human-readable feedback message ─────────────────────────────
    let feedbackMessage;
    if (passed && attemptNumber === 1) {
      feedbackMessage = `🎉 First-attempt pass! Excellent work! +${xpAwarded} XP earned.`;
    } else if (passed) {
      feedbackMessage = `✅ Module passed on attempt ${attemptNumber}! +${xpAwarded} XP earned.`;
    } else {
      const gap = (passThreshold - finalScore).toFixed(0);
      feedbackMessage =
        `You scored ${finalScore.toFixed(0)}% — need ${passThreshold}% to pass. ` +
        `You're ${gap} points away. Keep going, you can do it!`;
    }

    console.log(
      `✅ [learning-path/complete] Module ${moduleId} | ` +
      `Score: ${finalScore.toFixed(1)} | Passed: ${passed} | XP: +${xpAwarded} | ` +
      `Attempt: ${attemptNumber} | User: ${userId}`
    );

    return Response.json({
      passed,
      score:                finalScore,
      passThreshold,
      xpAwarded,
      attemptNumber,
      feedbackMessage,
      newlyUnlockedModules,          // array of moduleIds now newly unlocked
      rankUp: newRank !== oldRank
        ? { from: oldRank, to: newRank }
        : null,
      currentXp:   user.xp,
      currentRank: user.rank,
      currentLevel: user.level,
    });

  } catch (err) {
    console.error('[learning-path/complete] Error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
