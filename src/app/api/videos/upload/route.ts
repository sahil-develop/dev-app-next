import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const videoFile = formData.get('video') as File;

    if (!title || !videoFile) {
      return NextResponse.json({ error: 'Title and video file are required' }, { status: 400 });
    }

    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > maxSize) {
      return NextResponse.json({ error: 'File size too large (max 100MB)' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    await mkdir(uploadDir, { recursive: true });

    const fileExt = videoFile.name.split('.').pop() || 'mp4';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await videoFile.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const videoUrl = `/uploads/videos/${fileName}`;

    const user = await User.findById(payload.userId).select('name avatar');

    const tagsArray = tags
      ? tags.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
      : [];

    const video = await Video.create({
      title,
      description: description || '',
      videoUrl,
      status: 'pending',
      userId: payload.userId,
      userName: user?.name || 'Unknown',
      userAvatar: user?.avatar,
      tags: tagsArray,
    });

    return NextResponse.json({ message: 'Video uploaded successfully. Awaiting admin approval.', video }, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
