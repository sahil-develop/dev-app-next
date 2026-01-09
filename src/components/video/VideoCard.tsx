'use client';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface Reply {
  _id: string;
  userId: string;
  userName: string;
  text: string;
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

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  onTagClick: (tag: string) => void;
}

export default function VideoCard({ video, isActive, onTagClick }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();

  const [liked, setLiked] = useState(user ? video.likes.includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(video.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(video.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // commentId
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewTracked = useRef(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/video/${video._id}`
    : `/video/${video._id}`;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
      setPaused(false);
      if (!viewTracked.current) {
        viewTracked.current = true;
        fetch('/api/videos/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: video._id }),
        });
      }
    } else {
      el.pause();
      el.currentTime = 0;
      setShowComments(false);
    }
  }, [isActive, video._id]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPaused(false); }
    else { el.pause(); setPaused(true); }
  };

  const toggleLike = async () => {
    if (!user) return;
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    const res = await fetch('/api/videos/like', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video._id }),
    });
    if (!res.ok) { setLiked(prev); setLikesCount(c => prev ? c + 1 : c - 1); }
    else { const d = await res.json(); setLikesCount(d.likesCount); setLiked(d.liked); }
  };

  // ── Post top-level comment ──────────────────────
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setCommentLoading(true);
    const res = await fetch('/api/videos/comment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video._id, text: commentText }),
    });
    if (res.ok) {
      const d = await res.json();
      setComments(prev => [...prev, { ...d.comment, replies: [] }]);
      setCommentText('');
    }
    setCommentLoading(false);
  };

  // ── Post reply ─────────────────────────────────
  const submitReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    setReplyLoading(true);
    const res = await fetch('/api/videos/reply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video._id, commentId, text: replyText }),
    });
    if (res.ok) {
      const d = await res.json();
      setComments(prev => prev.map(c =>
        c._id === commentId ? { ...c, replies: [...(c.replies || []), d.reply] } : c
      ));
      setExpandedReplies(prev => new Set([...prev, commentId]));
      setReplyText('');
      setReplyingTo(null);
    }
    setReplyLoading(false);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  // ── Share ──────────────────────────────────────
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, text: video.description, url: shareUrl }); }
      catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const initial = video.userName?.[0]?.toUpperCase() || '?';
  const totalComments = comments.length;

  return (
    <div style={styles.row}>

      {/* ── VIDEO CARD ── */}
      <div style={styles.card}>
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop muted={muted} playsInline
          style={styles.video}
          onClick={togglePlay}
        />

        {/* Gradient overlay */}
        <div style={styles.overlay} />

        {/* Pause indicator */}
        {paused && (
          <div style={styles.pauseWrap} onClick={togglePlay}>
            <div style={styles.playCircle}>▶</div>
          </div>
        )}

        {/* Top controls */}
        <div style={styles.topBar}>
          <button id={`mute-${video._id}`} onClick={() => setMuted(!muted)} style={styles.topBtn}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Bottom info */}
        <div style={styles.bottomInfo}>
          <div style={styles.userRow}>
            <div className="avatar" style={styles.avatar}>{initial}</div>
            <div>
              <p style={styles.userName}>{video.userName}</p>
              <p style={styles.timeAgo}>{formatTime(video.createdAt)}</p>
            </div>
          </div>
          <h3 style={styles.title}>{video.title}</h3>
          {video.description && <p style={styles.desc}>{video.description}</p>}
          {video.tags.length > 0 && (
            <div style={styles.tags}>
              {video.tags.map(tag => (
                <span key={tag} className="tag" style={{ fontSize: 12 }} onClick={() => onTagClick(tag)}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <span style={styles.views}>👁 {formatNum(video.views)} views</span>
        </div>

        {/* ── Comments panel ── */}
        {showComments && (
          <div style={styles.commentsPanel} className="glass">
            <div style={styles.commentHeader}>
              <h4 style={{ fontSize: 15, fontWeight: 700 }}>
                Comments <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({totalComments})</span>
              </h4>
              <button onClick={() => setShowComments(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.commentsList}>
              {comments.length === 0 && <p style={styles.noComments}>No comments yet. Be first! 👇</p>}

              {comments.map(c => (
                <div key={c._id} style={styles.commentThread}>
                  {/* Top-level comment */}
                  <div style={styles.commentItem}>
                    <div className="avatar" style={styles.commentAvatar}>{c.userName?.[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.commentMeta}>
                        <span style={styles.commentUser}>{c.userName}</span>
                        <span style={styles.commentTime}>{formatTime(c.createdAt)}</span>
                      </div>
                      <p style={styles.commentText}>{c.text}</p>
                      <div style={styles.commentActions}>
                        {/* Reply button */}
                        {user && (
                          <button
                            style={styles.replyBtn}
                            onClick={() => {
                              setReplyingTo(replyingTo === c._id ? null : c._id);
                              setReplyText('');
                            }}
                          >
                            ↩ Reply
                          </button>
                        )}
                        {/* Toggle replies */}
                        {(c.replies?.length || 0) > 0 && (
                          <button
                            style={styles.replyBtn}
                            onClick={() => toggleReplies(c._id)}
                          >
                            {expandedReplies.has(c._id)
                              ? `▲ Hide replies`
                              : `▼ ${c.replies.length} ${c.replies.length === 1 ? 'reply' : 'replies'}`}
                          </button>
                        )}
                      </div>

                      {/* Reply input */}
                      {replyingTo === c._id && (
                        <form onSubmit={e => submitReply(e, c._id)} style={styles.replyForm}>
                          <input
                            id={`reply-input-${c._id}`}
                            className="input"
                            placeholder={`Reply to ${c.userName}…`}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            autoFocus
                            style={{ fontSize: 13, flex: 1 }}
                          />
                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: '8px 12px', fontSize: 13 }}
                            disabled={replyLoading}
                          >
                            {replyLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '→'}
                          </button>
                          <button type="button" style={styles.cancelBtn} onClick={() => setReplyingTo(null)}>✕</button>
                        </form>
                      )}

                      {/* Replies list */}
                      {expandedReplies.has(c._id) && (c.replies || []).length > 0 && (
                        <div style={styles.repliesList}>
                          {(c.replies || []).map(r => (
                            <div key={r._id} style={styles.replyItem}>
                              <div className="avatar" style={styles.replyAvatar}>{r.userName?.[0]?.toUpperCase()}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={styles.commentMeta}>
                                  <span style={styles.commentUser}>{r.userName}</span>
                                  <span style={styles.commentTime}>{formatTime(r.createdAt)}</span>
                                </div>
                                <p style={styles.commentText}>{r.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* New comment input */}
            {user && (
              <form onSubmit={submitComment} style={styles.commentForm}>
                <input
                  id={`comment-input-${video._id}`}
                  className="input"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  style={{ flex: 1, fontSize: 14 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }} disabled={commentLoading}>
                  {commentLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '→'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── SIDE ACTION BUTTONS ── */}
      <div style={styles.actions}>
        {/* Like */}
        <div style={styles.actionItem}>
          <button
            id={`like-${video._id}`}
            onClick={toggleLike}
            style={{
              ...styles.actionCircle,
              background: liked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
              border: liked ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
              transform: liked ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: 22 }}>{liked ? '❤️' : '🤍'}</span>
          </button>
          <span style={styles.actionLabel}>{formatNum(likesCount)}</span>
        </div>

        {/* Comment */}
        <div style={styles.actionItem}>
          <button
            id={`comment-${video._id}`}
            onClick={() => setShowComments(!showComments)}
            style={{
              ...styles.actionCircle,
              background: showComments ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: showComments ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span style={{ fontSize: 22 }}>💬</span>
          </button>
          <span style={styles.actionLabel}>{formatNum(totalComments)}</span>
        </div>

        {/* Share */}
        <div style={styles.actionItem}>
          <button
            id={`share-${video._id}`}
            onClick={handleShare}
            style={{
              ...styles.actionCircle,
              background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
              border: copied ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span style={{ fontSize: 22 }}>{copied ? '✅' : '🔗'}</span>
          </button>
          <span style={styles.actionLabel}>{copied ? 'Copied!' : 'Share'}</span>
        </div>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const CARD_HEIGHT = 'min(85dvh, 680px)';
const CARD_WIDTH  = 'min(38dvh, 380px)';

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 16,
  },

  // Card
  card: {
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    background: '#000',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    flexShrink: 0,
  },
  video: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', cursor: 'pointer',
  },
  overlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
    pointerEvents: 'none',
  },
  pauseWrap: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2, cursor: 'pointer',
  },
  playCircle: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, color: 'white',
  },

  topBar: {
    position: 'absolute', top: 14, right: 14, zIndex: 4,
    display: 'flex', gap: 8,
  },
  topBtn: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    border: 'none', cursor: 'pointer',
    fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(6px)', color: 'white',
  },

  bottomInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
    padding: '16px 16px 20px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, fontSize: 14, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 700, color: 'white' },
  timeAgo: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  title: { fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1.35 },
  desc: {
    fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.4,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  views: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // Comments panel
  commentsPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '68%', zIndex: 10,
    borderRadius: '18px 18px 0 0',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  commentHeader: {
    padding: '14px 18px', flexShrink: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid var(--border)',
  },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 17 },
  commentsList: { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 16 },
  noComments: { color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginTop: 20 },

  commentThread: { display: 'flex', flexDirection: 'column', gap: 0 },
  commentItem: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  commentAvatar: { width: 28, height: 28, fontSize: 12, flexShrink: 0 },
  commentMeta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 },
  commentUser: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  commentTime: { fontSize: 11, color: 'var(--text-secondary)' },
  commentText: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' },
  commentActions: { display: 'flex', gap: 12, marginTop: 4 },
  replyBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--accent)', fontSize: 12, fontWeight: 600, padding: 0,
  },
  replyForm: { display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' },
  cancelBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 },

  repliesList: {
    marginTop: 10,
    paddingLeft: 16,
    borderLeft: '2px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  replyItem: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  replyAvatar: { width: 22, height: 22, fontSize: 10, flexShrink: 0 },

  commentForm: {
    padding: '10px 14px', flexShrink: 0,
    borderTop: '1px solid var(--border)',
    display: 'flex', gap: 8,
  },

  // Side buttons
  actions: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 20, paddingBottom: 12,
  },
  actionItem: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 5,
  },
  actionCircle: {
    width: 48, height: 48, borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  },
  actionLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' },
};
