import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Video from '@/models/Video';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const [totalUsers, totalVideos, pendingVideos, approvedVideos, rejectedVideos] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Video.countDocuments({ status: 'pending' }),
      Video.countDocuments({ status: 'approved' }),
      Video.countDocuments({ status: 'rejected' }),
    ]);

    return NextResponse.json({ totalUsers, totalVideos, pendingVideos, approvedVideos, rejectedVideos });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
