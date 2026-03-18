import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const user = await User.findById(id).select('name email image followers following createdAt');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
        following: user.following || [],
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch User Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
