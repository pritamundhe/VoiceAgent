import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;

    const { targetUserId } = await req.json();

    if (!targetUserId || targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Invalid target user' }, { status: 400 });
    }

    // Add target to current user's following list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUserId }
    });

    // Add current user to target's followers list
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: currentUserId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow Error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}
