import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = { userId: payload.userId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const videos = await Video.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ videos });
  } catch (err) {
    console.error('User videos error:', err);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
