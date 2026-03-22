import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function GET(request) {
    try {
        await dbConnect();
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('xp level rank name image');

        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const nextRankXpMap = {
            'Newbie': 500,
            'Beginner': 1500,
            'Intermediate': 3000,
            'Advanced': 5000,
            'Expert': 10000,
            'Master': 10000 // max
        };

        const targetXp = nextRankXpMap[user.rank] || 500;

        return Response.json({
            name: user.name,
            image: user.image,
            xp: user.xp || 0,
            level: user.level || 1,
            rank: user.rank || 'Newbie',
            targetXp
        });
    } catch (error) {
        console.error('Progress fetch error:', error);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
