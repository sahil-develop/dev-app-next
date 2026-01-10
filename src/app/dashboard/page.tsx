'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Navbar from '@/components/layout/Navbar';

interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  tags: string[];
  likes: string[];
  comments: unknown[];
  views: number;
  createdAt: string;
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = `/api/videos/user${filter !== 'all' ? `?status=${filter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const stats = {
    total: videos.length,
    pending: videos.filter(v => v.status === 'pending').length,
    approved: videos.filter(v => v.status === 'approved').length,
    rejected: videos.filter(v => v.status === 'rejected').length,
  };

  if (authLoading) return <div style={styles.centered}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header} className="animate-fade-in">
          <h1 style={styles.heading}>My Videos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage and track your uploaded reels</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid} className="animate-slide-up">
          {[
            { label: 'Total', value: stats.total, icon: '🎬', color: 'var(--accent)' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: 'var(--warning)' },
            { label: 'Approved', value: stats.approved, icon: '✅', color: 'var(--success)' },
            { label: 'Rejected', value: stats.rejected, icon: '❌', color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} className="card" style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: `${s.color}20` }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className="btn"
              style={filter === f ? styles.filterActive : styles.filterBtn}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div style={styles.grid}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
          </div>
        ) : videos.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No videos yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {filter !== 'all' ? `No ${filter} videos` : 'Start by uploading your first reel!'}
            </p>
            <button className="btn btn-primary" onClick={() => router.push('/upload')} id="go-upload">
              ⬆ Upload Now
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {videos.map(video => (
              <div key={video._id} className="card" style={styles.videoCard}>
                {/* Thumbnail / Preview */}
                <div style={styles.videoThumb}>
                  <video src={video.videoUrl} style={styles.thumbVideo} muted />
                  <div style={styles.thumbOverlay}>
                    <span style={{ fontSize: 28 }}>▶</span>
                  </div>
                </div>

                <div style={styles.videoInfo}>
                  <div style={styles.videoHeader}>
                    <h3 style={styles.videoTitle}>{video.title}</h3>
                    <span className={`badge badge-${video.status}`}>{video.status}</span>
                  </div>

                  {video.description && (
                    <p style={styles.videoDesc}>{video.description}</p>
                  )}

                  <div style={styles.videoMeta}>
                    <span style={styles.metaItem}>❤️ {video.likes.length}</span>
                    <span style={styles.metaItem}>💬 {(video.comments as unknown[]).length}</span>
                    <span style={styles.metaItem}>👁 {video.views}</span>
                    <span style={styles.metaItem}>{formatTime(video.createdAt)}</span>
                  </div>

                  {video.tags.length > 0 && (
                    <div style={styles.videoTags}>
                      {video.tags.map(t => <span key={t} className="tag" style={{ fontSize: 11 }}>#{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles: Record<string, React.CSSProperties> = {
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' },
  content: { maxWidth: 1100, margin: '0 auto', padding: '88px 24px 40px' },
  header: { marginBottom: 28 },
  heading: { fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: { padding: 20, display: 'flex', alignItems: 'center', gap: 16 },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  filters: { display: 'flex', gap: 8, marginBottom: 24 },
  filterBtn: { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '8px 18px', fontSize: 14 },
  filterActive: { background: 'var(--gradient-1)', color: 'white', border: 'none', padding: '8px 18px', fontSize: 14, boxShadow: '0 4px 15px var(--accent-glow)' },
  empty: { textAlign: 'center', padding: '80px 20px', borderRadius: 20, border: '2px dashed var(--border)', background: 'var(--bg-card)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  videoCard: { overflow: 'hidden' },
  videoThumb: { position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#000' },
  thumbVideo: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 },
  thumbOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)', color: 'white', opacity: 0,
    transition: 'opacity 0.2s',
  },
  videoInfo: { padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  videoHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  videoTitle: { fontSize: 15, fontWeight: 700, lineHeight: 1.3, flex: 1 },
  videoDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  videoMeta: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  metaItem: { fontSize: 13, color: 'var(--text-secondary)' },
  videoTags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
};
