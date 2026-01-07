import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { videoId, text } = await req.json();
    if (!videoId || !text?.trim()) {
      return NextResponse.json({ error: 'videoId and text required' }, { status: 400 });
    }

    const video = await Video.findById(videoId);
    if (!video || video.status !== 'approved') {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const user = await User.findById(payload.userId).select('name avatar');

    const comment = {
      userId: payload.userId,
      userName: user?.name || 'Unknown',
      userAvatar: user?.avatar,
      text: text.trim(),
      createdAt: new Date(),
    };

    video.comments.push(comment as never);
    await video.save();

    const newComment = video.comments[video.comments.length - 1];
    return NextResponse.json({ comment: newComment, commentsCount: video.comments.length }, { status: 201 });
  } catch (err) {
    console.error('Comment error:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const video = await Video.findById(videoId).select('comments').lean();
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    return NextResponse.json({ comments: video.comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
