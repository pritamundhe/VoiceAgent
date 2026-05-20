import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// -----------------------------------------------------------------------
// GET /api/leaderboard?type=alltime|weekly|monthly&limit=50
// -----------------------------------------------------------------------
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'alltime';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    // Determine which XP field to sort by
    const sortField = type === 'weekly' ? 'weeklyXp'
      : type === 'monthly' ? 'monthlyXp'
      : 'xp';

    // Project only the fields needed for leaderboard display
    const users = await User.find({})
      .select(`name image rank level xp weeklyXp monthlyXp streak bestStreak totalSessions badges createdAt`)
      .sort({ [sortField]: -1 })
      .limit(limit)
      .lean();

    // Map to lean display objects (avoid sending sensitive fields)
    const leaderboard = users.map((u, index) => ({
      position: index + 1,
      userId: u._id.toString(),
      name: u.name,
      image: u.image || null,
      rank: u.rank || 'Newbie',
      level: u.level || 1,
      xp: type === 'weekly' ? (u.weeklyXp || 0)
        : type === 'monthly' ? (u.monthlyXp || 0)
        : (u.xp || 0),
      totalXp: u.xp || 0,
      streak: u.streak || 0,
      bestStreak: u.bestStreak || 0,
      totalSessions: u.totalSessions || 0,
      badgeCount: (u.badges || []).length,
      // Include top 3 earned badge IDs for display
      topBadges: (u.badges || [])
        .slice(-3)
        .map(b => ({ id: b.id, name: b.name })),
      joinedAt: u.createdAt,
    }));

    return NextResponse.json({ type, leaderboard, total: leaderboard.length });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
