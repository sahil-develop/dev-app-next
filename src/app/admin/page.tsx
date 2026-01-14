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
  userName: string;
  tags: string[];
  likes: string[];
  comments: unknown[];
  views: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalVideos: number;
  pendingVideos: number;
  approvedVideos: number;
  rejectedVideos: number;
}

const TABS = ['pending', 'approved', 'rejected', 'all'] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role !== 'admin') router.push('/feed');
    }
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats');
    if (res.ok) { const d = await res.json(); setStats(d); }
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos?status=${tab}`);
      const d = await res.json();
      setVideos(d.videos || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    if (user?.role === 'admin') { fetchStats(); fetchVideos(); }
  }, [user, fetchStats, fetchVideos]);

  const handleApprove = async (videoId: string) => {
    setActionLoading(videoId + '-approve');
    const res = await fetch('/api/admin/approve', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId }) });
    if (res.ok) { setVideos(prev => prev.filter(v => v._id !== videoId)); fetchStats(); setPreviewVideo(null); }
    setActionLoading(null);
  };

  const handleReject = async (videoId: string) => {
    setActionLoading(videoId + '-reject');
    const res = await fetch('/api/admin/reject', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId }) });
    if (res.ok) { setVideos(prev => prev.filter(v => v._id !== videoId)); fetchStats(); setPreviewVideo(null); }
    setActionLoading(null);
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Delete this video permanently?')) return;
    setActionLoading(videoId + '-delete');
    const res = await fetch('/api/admin/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId }) });
    if (res.ok) { setVideos(prev => prev.filter(v => v._id !== videoId)); fetchStats(); setPreviewVideo(null); }
    setActionLoading(null);
  };

  if (authLoading || !user) return <div style={styles.centered}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header} className="animate-fade-in">
          <div>
            <h1 style={styles.heading}>⚙ Admin Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Review and moderate developer reels</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={styles.statsGrid} className="animate-slide-up">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#00d2ff' },
              { label: 'Total Videos', value: stats.totalVideos, icon: '🎬', color: 'var(--accent)' },
              { label: 'Pending Review', value: stats.pendingVideos, icon: '⏳', color: 'var(--warning)' },
              { label: 'Live Videos', value: stats.approvedVideos, icon: '✅', color: 'var(--success)' },
              { label: 'Rejected', value: stats.rejectedVideos, icon: '❌', color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} className="card" style={styles.statCard}>
                <div style={{ ...styles.statIcon, background: `${s.color}20` }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              id={`admin-tab-${t}`}
              onClick={() => setTab(t)}
              className="btn"
              style={tab === t ? styles.tabActive : styles.tabBtn}
            >
              {t === 'pending' && stats?.pendingVideos ? `Pending (${stats.pendingVideos})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Video List */}
        {loading ? (
          <div style={styles.grid}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />)}
          </div>
        ) : videos.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>No {tab} videos</h2>
          </div>
        ) : (
          <div style={styles.grid}>
            {videos.map(video => (
              <div key={video._id} className="card" style={styles.videoCard}>
                <div style={styles.thumb} onClick={() => setPreviewVideo(video)}>
                  <video src={video.videoUrl} style={styles.thumbVid} muted />
                  <div style={styles.thumbOverlay}>
                    <span style={{ fontSize: 32, color: 'white' }}>▶</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Preview</span>
                  </div>
                </div>
                <div style={styles.info}>
                  <div style={styles.infoTop}>
                    <h3 style={styles.title}>{video.title}</h3>
                    <span className={`badge badge-${video.status}`}>{video.status}</span>
                  </div>
                  <p style={styles.meta}>By <strong>{video.userName}</strong> · {formatTime(video.createdAt)}</p>
                  {video.description && <p style={styles.desc}>{video.description}</p>}
                  <div style={styles.metaRow}>
                    <span>❤️ {video.likes.length}</span>
                    <span>💬 {(video.comments as unknown[]).length}</span>
                    <span>👁 {video.views}</span>
                  </div>
                  {video.tags.length > 0 && (
                    <div style={styles.tags}>
                      {video.tags.map(t => <span key={t} className="tag" style={{ fontSize: 11 }}>#{t}</span>)}
                    </div>
                  )}
                  <div style={styles.actions}>
                    {video.status !== 'approved' && (
                      <button
                        id={`approve-${video._id}`}
                        className="btn btn-success"
                        style={{ flex: 1, fontSize: 13 }}
                        onClick={() => handleApprove(video._id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === video._id + '-approve' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✓ Approve'}
                      </button>
                    )}
                    {video.status !== 'rejected' && (
                      <button
                        id={`reject-${video._id}`}
                        className="btn btn-danger"
                        style={{ flex: 1, fontSize: 13 }}
                        onClick={() => handleReject(video._id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === video._id + '-reject' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✕ Reject'}
                      </button>
                    )}
                    <button
                      id={`delete-${video._id}`}
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', fontSize: 13 }}
                      onClick={() => handleDelete(video._id)}
                      disabled={!!actionLoading}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewVideo && (
        <div style={styles.modal} onClick={() => setPreviewVideo(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()} className="card">
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{previewVideo.title}</h3>
              <button onClick={() => setPreviewVideo(null)} style={styles.closeBtn}>✕</button>
            </div>
            <video src={previewVideo.videoUrl} controls autoPlay style={styles.modalVideo} />
            <div style={{ padding: 16 }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>{previewVideo.description}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {previewVideo.status !== 'approved' && (
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleApprove(previewVideo._id)} disabled={!!actionLoading}>
                    ✓ Approve
                  </button>
                )}
                {previewVideo.status !== 'rejected' && (
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleReject(previewVideo._id)} disabled={!!actionLoading}>
                    ✕ Reject
                  </button>
                )}
                <button className="btn btn-danger" onClick={() => handleDelete(previewVideo._id)} disabled={!!actionLoading}>🗑</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

const styles: Record<string, React.CSSProperties> = {
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '88px 24px 40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  heading: { fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 },
  statCard: { padding: 16, display: 'flex', alignItems: 'center', gap: 14 },
  statIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tabBtn: { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '8px 18px', fontSize: 14 },
  tabActive: { background: 'var(--gradient-1)', color: 'white', border: 'none', padding: '8px 18px', fontSize: 14, boxShadow: '0 4px 15px var(--accent-glow)' },
  empty: { textAlign: 'center', padding: '80px 20px', borderRadius: 20, border: '2px dashed var(--border)', background: 'var(--bg-card)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  videoCard: {},
  thumb: { position: 'relative', aspectRatio: '16/9', overflow: 'hidden', cursor: 'pointer', background: '#000' },
  thumbVid: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 },
  thumbOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', gap: 4 },
  info: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  infoTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: 700, lineHeight: 1.3, flex: 1 },
  meta: { fontSize: 13, color: 'var(--text-secondary)' },
  desc: { fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  metaRow: { display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-secondary)' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  actions: { display: 'flex', gap: 8, marginTop: 4 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 640, overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 },
  modalVideo: { width: '100%', maxHeight: 360, objectFit: 'contain', background: '#000' },
};
