import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    await dbConnect();
    const user = await User.findById(decoded.userId)
      .select('name email image followers following')
      .populate('following', 'name email image');
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ 
      user: { 
        userId: user._id, 
        name: user.name, 
        email: user.email, 
        image: user.image,
        followerCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        followers: user.followers || [],
        following: user.following || []
      } 
    });

  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ user: null });
  }
}
