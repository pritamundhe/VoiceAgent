import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function GET(request) {
  try {
    await dbConnect();

    // Verify user
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user and sessions
    const user = await User.findById(userId).select('name rank level xp createdAt');
    const sessions = await Session.find({ userId }).sort({ timestamp: -1 });

    if (sessions.length === 0) {
      return NextResponse.json({
        user: user ? {
          name: user.name,
          rank: user.rank,
          level: user.level,
          xp: user.xp,
          joined: user.createdAt
        } : null,
        totalSessions: 0,
        avgFluency: 0,
        avgWpm: 0,
        recentSessions: [],
        trends: { fluency: [], wpm: [], labels: [] },
        fillers: {},
        mostUsedMode: 'N/A'
      });
    }

    // Calculate aggregations
    const totalSessions = sessions.length;
    let totalFluency = 0;
    let totalWpm = 0;
    const modeCounts = {};
    
    sessions.forEach(s => {
      totalFluency += (s.metrics?.fluencyScore || 0);
      totalWpm += (s.metrics?.wpm || 0);
      if (s.mode) {
        modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;
      }
    });

    const avgFluency = Math.round(totalFluency / totalSessions);
    const avgWpm = Math.round(totalWpm / totalSessions);
    
    let mostUsedMode = 'N/A';
    let maxCount = 0;
    Object.entries(modeCounts).forEach(([mode, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedMode = mode;
      }
    });

    // Trends (chronological order)
    const chronological = [...sessions].reverse();
    const trends = {
      fluency: chronological.map(s => s.metrics?.fluencyScore || 0),
      wpm: chronological.map(s => s.metrics?.wpm || 0),
      labels: chronological.map(s => new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
    };

    // Filler distribution
    const fillers = {};
    sessions.forEach(s => {
      if (s.metrics?.fillerCounts) {
        Object.entries(s.metrics.fillerCounts).forEach(([word, count]) => {
          fillers[word] = (fillers[word] || 0) + count;
        });
      }
    });

    // Recent sessions (limit to 10 for table)
    const recentSessions = sessions.slice(0, 10).map(s => ({
      _id: s._id,
      mode: s.mode,
      fluencyScore: s.metrics?.fluencyScore,
      wpm: s.metrics?.wpm,
      timestamp: s.timestamp,
      topic: s.aiAnalysis?.topic
    }));

    return NextResponse.json({
      user: user ? {
        name: user.name,
        rank: user.rank,
        level: user.level,
        xp: user.xp,
        joined: user.createdAt
      } : null,
      totalSessions,
      avgFluency,
      avgWpm,
      mostUsedMode,
      recentSessions,
      trends,
      fillers
    });

  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
