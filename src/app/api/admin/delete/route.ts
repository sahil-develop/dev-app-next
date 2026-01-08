import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const video = await Video.findById(videoId);
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    // Delete video file
    try {
      const filePath = path.join(process.cwd(), 'public', video.videoUrl);
      await unlink(filePath);
    } catch { /* ignore file not found */ }

    await video.deleteOne();
    return NextResponse.json({ message: 'Video deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
