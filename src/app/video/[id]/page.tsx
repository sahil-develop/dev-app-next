'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import VideoCard from '@/components/video/VideoCard';

interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  userName: string;
  userAvatar?: string;
  tags: string[];
  likes: string[];
  comments: Comment[];
  views: number;
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/videos/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setVideo(d.video))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (authLoading || loading) {
    return (
      <div style={styles.center}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}>
        <Navbar />
        <div style={styles.center}>
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎬</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Video not found</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
              This reel may have been removed or is still pending approval.
            </p>
            <button className="btn btn-primary" onClick={() => router.push('/feed')}>
              ← Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={styles.page}>
        {/* Back */}
        <button
          id="back-to-feed"
          className="btn btn-secondary"
          style={styles.backBtn}
          onClick={() => router.push('/feed')}
        >
          ← Feed
        </button>

        {/* Centered single reel */}
        <div style={styles.reelWrap}>
          <VideoCard
            video={video}
            isActive={true}
            onTagClick={(tag) => router.push(`/feed?tag=${tag}`)}
          />
        </div>

        {/* Meta below on desktop */}
        <div style={styles.meta} className="animate-fade-in">
          <h1 style={styles.metaTitle}>{video.title}</h1>
          {video.description && <p style={styles.metaDesc}>{video.description}</p>}
          <p style={styles.metaBy}>
            By <strong style={{ color: 'var(--text-primary)' }}>{video.userName}</strong>
            &nbsp;·&nbsp;{formatTime(video.createdAt)}
          </p>
          <div style={styles.shareBox}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Share this reel:</span>
            <div style={styles.shareUrl}>
              <code style={styles.urlCode}>{typeof window !== 'undefined' ? window.location.href : ''}</code>
              <button
                id="copy-link"
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  const btn = document.getElementById('copy-link');
                  if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 2000); }
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100dvh',
  },
  page: {
    paddingTop: 80,
    paddingBottom: 40,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    position: 'relative',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: 24,
    fontSize: 14,
  },
  reelWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    width: '100%',
    maxWidth: 500,
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  metaTitle: { fontSize: 22, fontWeight: 800, lineHeight: 1.3 },
  metaDesc: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 },
  metaBy: { fontSize: 13, color: 'var(--text-secondary)' },
  shareBox: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  shareUrl: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '8px 12px',
    overflow: 'hidden',
  },
  urlCode: {
    fontSize: 12,
    color: 'var(--accent)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    fontFamily: 'monospace',
  },
};
