'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
}

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTag, setActiveTag] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchVideos = useCallback(async (p: number, tag: string, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const url = `/api/videos/feed?page=${p}&limit=10${tag ? `&tag=${tag}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setVideos(prev => reset ? data.videos : [...prev, ...data.videos]);
      setHasMore(p < data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (user) fetchVideos(1, '', true);
  }, [user]); // eslint-disable-line

  const handleTagClick = (tag: string) => {
    const newTag = tag === activeTag ? '' : tag;
    setActiveTag(newTag);
    setPage(1);
    setVideos([]);
    setHasMore(true);
    fetchVideos(1, newTag, true);
  };

  // Scroll snap observer — watches .shorts-slide items
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.shorts-slide');
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Array.from(items).indexOf(entry.target as HTMLElement);
            if (idx !== -1) {
              setActiveIndex(idx);
              if (idx >= videos.length - 2 && hasMore && !loading) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchVideos(nextPage, activeTag);
              }
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    items.forEach(item => observerRef.current!.observe(item));
    return () => observerRef.current?.disconnect();
  }, [videos, hasMore, loading, page, activeTag, fetchVideos]);

  if (authLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />

      {/* Tag filter banner */}
      {activeTag && (
        <div style={styles.tagBanner} className="glass">
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Filtering:</span>
          <span className="tag">#{activeTag}</span>
          <button onClick={() => handleTagClick(activeTag)} style={styles.clearTag}>✕ Clear</button>
        </div>
      )}

      {/* Scrollable feed column */}
      <div ref={containerRef} style={styles.feedScroll} id="feed-container">

        {videos.map((video, idx) => (
          <div key={video._id} className="shorts-slide" style={styles.slide}>
            <VideoCard
              video={video}
              isActive={idx === activeIndex}
              onTagClick={handleTagClick}
            />
          </div>
        ))}

        {loading && (
          <div className="shorts-slide" style={{ ...styles.slide, ...styles.statusSlide }}>
            <div style={styles.statusContent}>
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Loading more...</p>
            </div>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="shorts-slide" style={{ ...styles.slide, ...styles.statusSlide }}>
            <div style={styles.statusContent} className="animate-fade-in">
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                {activeTag ? `No videos for #${activeTag}` : 'No videos yet'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                {activeTag ? 'Try a different tag' : 'Be the first to upload a video!'}
              </p>
            </div>
          </div>
        )}

        {!hasMore && videos.length > 0 && (
          <div className="shorts-slide" style={{ ...styles.slide, ...styles.statusSlide }}>
            <div style={styles.statusContent}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>You&apos;ve seen everything! 🎉</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: '100dvh',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
    position: 'relative',
  },
  tagBanner: {
    position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
    zIndex: 50, padding: '8px 16px', borderRadius: 20, display: 'flex',
    alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  clearTag: {
    background: 'none', border: 'none', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  // Outer scroll container — full page height, scrolls vertically
  feedScroll: {
    height: '100dvh',
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    scrollbarWidth: 'none',
    paddingTop: 64, // below navbar
    boxSizing: 'border-box',
  },
  // Each slide = one viewport height, flex row to center the card
  slide: {
    height: 'calc(100dvh - 64px)',
    scrollSnapAlign: 'start',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusSlide: {
    background: 'var(--bg-primary)',
  },
  statusContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, textAlign: 'center', padding: 24,
  },
};
