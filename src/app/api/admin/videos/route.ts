import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getTokenFromRequest } from '@/lib/auth';
import Video from '@/models/Video';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const query: Record<string, unknown> = {};
    if (['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const [videos, total] = await Promise.all([
      Video.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Video.countDocuments(query),
    ]);

    return NextResponse.json({ videos, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin videos error:', err);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
