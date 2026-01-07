import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Video from '@/models/Video';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tag = searchParams.get('tag');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { status: 'approved' };
    if (tag) query.tags = tag.toLowerCase();

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(query),
    ]);

    return NextResponse.json({
      videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Feed error:', err);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
