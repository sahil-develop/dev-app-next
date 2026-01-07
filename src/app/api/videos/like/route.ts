import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const video = await Video.findById(videoId);
    if (!video || video.status !== 'approved') {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(payload.userId);
    const liked = video.likes.some((id) => id.equals(userId));

    if (liked) {
      video.likes = video.likes.filter((id) => !id.equals(userId));
    } else {
      video.likes.push(userId);
    }

    await video.save();
    return NextResponse.json({ liked: !liked, likesCount: video.likes.length });
  } catch (err) {
    console.error('Like error:', err);
    return NextResponse.json({ error: 'Failed to process like' }, { status: 500 });
  }
}
