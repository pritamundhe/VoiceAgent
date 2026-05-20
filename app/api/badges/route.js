import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { getBadgesForDisplay } from '@/lib/badges';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// -----------------------------------------------------------------------
// GET /api/badges
// Returns the full badge catalogue annotated with the user's earn status.
// -----------------------------------------------------------------------
export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(userId).select('badges rank level xp streak bestStreak totalSessions totalPracticeMinutes').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allBadges = getBadgesForDisplay(user.badges || []);
    const earnedCount = allBadges.filter(b => b.earned).length;
    const totalCount = allBadges.length;

    // Group by tier for display
    const byTier = {
      platinum: allBadges.filter(b => b.tier === 'platinum'),
      gold:     allBadges.filter(b => b.tier === 'gold'),
      silver:   allBadges.filter(b => b.tier === 'silver'),
      bronze:   allBadges.filter(b => b.tier === 'bronze'),
    };

    return NextResponse.json({
      user: {
        rank: user.rank,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        bestStreak: user.bestStreak,
        totalSessions: user.totalSessions,
        totalPracticeMinutes: user.totalPracticeMinutes,
      },
      earnedCount,
      totalCount,
      completionPercent: Math.round((earnedCount / totalCount) * 100),
      allBadges,
      byTier,
      recentBadges: (user.badges || [])
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 5),
    });

  } catch (error) {
    console.error('Badges fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
