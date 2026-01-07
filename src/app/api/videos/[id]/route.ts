import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Video from '@/models/Video';

// GET /api/videos/[id]  — fetch single approved video
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const video = await Video.findOne({ _id: id, status: 'approved' }).lean();
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json({ video });
  } catch (err) {
    console.error('Get video error:', err);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
