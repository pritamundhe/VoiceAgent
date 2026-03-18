import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Optional: Get current user to exclude from results
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let currentUserId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (err) {
        // Token invalid, ignore
      }
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        currentUserId ? { _id: { $ne: currentUserId } } : {}
      ]
    })
    .select('name email image followers following')
    .limit(20);

    console.log(`Found ${users.length} users for query "${query}"`);
    users.forEach(u => console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
