import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ModuleAttempt from '@/models/ModuleAttempt';
import jwt from 'jsonwebtoken';
import {
  LEARNING_PATH,
  MODULE_PREREQUISITES,
  MODULE_PASS_THRESHOLDS,
  MODULE_XP,
} from '@/lib/learningPathData';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

/**
 * GET /api/learning-path/progress
 *
 * Returns a complete snapshot of the authenticated user's learning-path status:
 *  - Per-module: locked | unlocked | passed, best score, attempt count, XP info
 *  - Summary counts and user rank/XP for the XP widget on the page
 *
 * The frontend uses this to render lock icons, progress bars, and next-steps CTAs.
 */
export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId  = decoded.userId;

    // Fetch user's current rank, XP and completedModules in one query
    const user = await User.findById(userId).select(
      'xp level rank streak completedModules'
    );
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // ── 1. Build attempt summary map keyed by moduleId ─────────────────
    // We need: attempts count, best score, passed flag, total xp earned
    const rawAttempts = await ModuleAttempt.find({ userId }).sort({ createdAt: -1 });

    const attemptMap = {};
    for (const a of rawAttempts) {
      if (!attemptMap[a.moduleId]) {
        attemptMap[a.moduleId] = {
          attempts:      0,
          bestScore:     0,
          passed:        false,
          totalXp:       0,
          lastAttemptAt: null,
        };
      }
      const m = attemptMap[a.moduleId];
      m.attempts++;
      if (a.score > m.bestScore) m.bestScore = a.score;
      if (a.passed) m.passed = true;
      m.totalXp += a.xpAwarded || 0;
      if (!m.lastAttemptAt || a.createdAt > m.lastAttemptAt) {
        m.lastAttemptAt = a.createdAt;
      }
    }

    // ── 2. Set of moduleIds the user has passed ─────────────────────────
    const passedSet = new Set(
      Object.entries(attemptMap)
        .filter(([, v]) => v.passed)
        .map(([k]) => k)
    );

    // ── 3. Build per-module status object ──────────────────────────────
    const moduleStatus = {};

    for (const level of LEARNING_PATH) {
      for (const mod of level.modules) {
        const prereqs        = MODULE_PREREQUISITES[mod.id] || [];
        const allPrereqsMet  = prereqs.every(p => passedSet.has(p));
        const attemptData    = attemptMap[mod.id] || {
          attempts: 0, bestScore: 0, passed: false, totalXp: 0, lastAttemptAt: null,
        };

        let status = 'locked';
        if (attemptData.passed)    status = 'passed';
        else if (allPrereqsMet)    status = 'unlocked';

        moduleStatus[mod.id] = {
          status,
          locked:        !allPrereqsMet,
          bestScore:     attemptData.attempts > 0 ? attemptData.bestScore : null,
          attempts:      attemptData.attempts,
          xpEarned:      attemptData.totalXp,
          lastAttemptAt: attemptData.lastAttemptAt,
          prerequisites: prereqs,
          // Metadata useful for the card UI
          xpReward:      MODULE_XP[level.level] || 50,
          passThreshold: MODULE_PASS_THRESHOLDS[mod.taskType] || 60,
          levelId:       level.level,
          part:          mod.part,
          taskType:      mod.taskType,
        };
      }
    }

    // ── 4. Summary stats ───────────────────────────────────────────────
    const allModules   = LEARNING_PATH.flatMap(l => l.modules);
    const totalPassed  = passedSet.size;
    const totalModules = allModules.length;

    // Next recommended module: first unlocked (not passed) module in order
    const nextModule = allModules.find(
      mod => moduleStatus[mod.id]?.status === 'unlocked'
    );

    return Response.json({
      modules:       moduleStatus,
      userRank:      user.rank  || 'Newbie',
      userXp:        user.xp    || 0,
      userLevel:     user.level || 1,
      streak:        user.streak || 0,
      totalPassed,
      totalModules,
      completionPct: Math.round((totalPassed / totalModules) * 100),
      nextModuleId:  nextModule?.id || null,
    });

  } catch (err) {
    console.error('[learning-path/progress] Error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
