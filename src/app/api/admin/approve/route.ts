import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';

export async function PUT(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const video = await Video.findByIdAndUpdate(videoId, { status: 'approved' }, { new: true });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    return NextResponse.json({ message: 'Video approved', video });
  } catch (err) {
    console.error('Approve error:', err);
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
  }
}
