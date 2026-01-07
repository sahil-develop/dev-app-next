import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
