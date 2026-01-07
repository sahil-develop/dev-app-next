import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';
import User from '@/models/User';

// POST /api/videos/reply  { videoId, commentId, text }
export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { videoId, commentId, text } = await req.json();
    if (!videoId || !commentId || !text?.trim()) {
      return NextResponse.json({ error: 'videoId, commentId and text are required' }, { status: 400 });
    }

    const video = await Video.findById(videoId);
    if (!video || video.status !== 'approved') {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const comment = video.comments.find(c => c._id?.toString() === commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const user = await User.findById(payload.userId).select('name avatar');
    const reply = {
      userId: payload.userId,
      userName: user?.name || 'Unknown',
      userAvatar: user?.avatar,
      text: text.trim(),
      createdAt: new Date(),
    };

    comment.replies.push(reply as never);
    await video.save();

    const savedReply = comment.replies[comment.replies.length - 1];
    return NextResponse.json({ reply: savedReply, repliesCount: comment.replies.length }, { status: 201 });
  } catch (err) {
    console.error('Reply error:', err);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
