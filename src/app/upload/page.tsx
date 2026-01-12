'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Navbar from '@/components/layout/Navbar';

const POPULAR_TAGS = ['AI', 'React', 'TypeScript', 'NextJS', 'NodeJS', 'Python', 'DevOps', 'WebDev', 'Rust', 'API'];

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Please select a video file'); return; }
    if (file.size > 100 * 1024 * 1024) { setError('File too large (max 100MB)'); return; }
    setVideoFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const addTag = (tag: string) => {
    const current = tags.split(',').map(t => t.trim()).filter(Boolean);
    const lower = tag.toLowerCase();
    if (!current.includes(lower)) {
      setTags(current.length ? `${tags}, ${lower}` : lower);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title.trim()) { setError('Title and video are required'); return; }
    if (!user) { router.push('/login'); return; }

    setUploading(true);
    setError('');
    setProgress(10);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('video', videoFile);

    try {
      const interval = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 400);
      const res = await fetch('/api/videos/upload', { method: 'POST', body: formData });
      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Upload failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header} className="animate-fade-in">
          <h1 style={styles.heading}>Upload a Reel</h1>
          <p style={styles.subheading}>Share developer news with the community. Your video will be reviewed before going live.</p>
        </div>

        {success ? (
          <div style={styles.successCard} className="card animate-slide-up">
            <div style={styles.successIcon}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Upload Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Your video is under review. You&apos;ll see it in your dashboard.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              {/* Left: Upload */}
              <div style={styles.uploadSection}>
                <div
                  style={{ ...styles.dropZone, ...(videoFile ? styles.dropZoneActive : {}) }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const ev = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>; handleFileChange(ev); } }}
                >
                  {preview ? (
                    <video src={preview} style={styles.previewVideo} controls />
                  ) : (
                    <div style={styles.dropContent}>
                      <div style={styles.uploadIcon}>📹</div>
                      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Drop your video here</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>or click to browse (MP4, max 100MB)</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} id="video-file-input" />
                </div>
                {videoFile && (
                  <div style={styles.fileInfo}>
                    <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ {videoFile.name}</span>
                    <button type="button" onClick={() => { setVideoFile(null); setPreview(''); }} style={styles.removeBtn}>Remove</button>
                  </div>
                )}
              </div>

              {/* Right: Fields */}
              <div style={styles.fieldsSection}>
                {error && <div style={styles.error}>{error}</div>}

                <div style={styles.field}>
                  <label style={styles.label}>Title *</label>
                  <input id="upload-title" className="input" placeholder="What&apos;s this reel about?" value={title} onChange={e => setTitle(e.target.value)} required maxLength={100} />
                  <span style={styles.charCount}>{title.length}/100</span>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    id="upload-description"
                    className="input"
                    placeholder="Share more context..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    maxLength={500}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <span style={styles.charCount}>{description.length}/500</span>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Tags</label>
                  <input id="upload-tags" className="input" placeholder="react, nodejs, AI (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />
                  <div style={styles.popularTags}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Popular:</span>
                    {POPULAR_TAGS.map(t => (
                      <span key={t} className="tag" onClick={() => addTag(t)} style={{ cursor: 'pointer', fontSize: 11 }}>#{t}</span>
                    ))}
                  </div>
                </div>

                {uploading && (
                  <div style={styles.progressWrap}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Uploading... {progress}%</span>
                  </div>
                )}

                <button id="upload-submit" type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={uploading || !videoFile}>
                  {uploading ? <><span className="spinner" />Uploading...</> : '⬆ Upload Reel'}
                </button>

                <p style={styles.note}>
                  ℹ️ Videos require admin approval before appearing in the public feed.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: 'var(--bg-primary)' },
  content: { maxWidth: 1000, margin: '0 auto', padding: '88px 24px 40px' },
  header: { marginBottom: 32 },
  heading: { fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 },
  subheading: { color: 'var(--text-secondary)', fontSize: 15 },
  form: {},
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' },
  uploadSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: 16, minHeight: 320,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s ease',
    background: 'var(--bg-card)',
  },
  dropZoneActive: { borderColor: 'var(--accent)', background: 'rgba(108,99,255,0.05)' },
  dropContent: { textAlign: 'center', padding: 32 },
  uploadIcon: { fontSize: 56, marginBottom: 16 },
  previewVideo: { width: '100%', height: '100%', objectFit: 'cover', minHeight: 320 },
  fileInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' },
  removeBtn: { background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  fieldsSection: { display: 'flex', flexDirection: 'column', gap: 20 },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' },
  charCount: { fontSize: 11, color: 'var(--text-muted)', alignSelf: 'flex-end' },
  popularTags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  progressBar: { height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--gradient-1)', borderRadius: 3, transition: 'width 0.3s ease' },
  submitBtn: { width: '100%', padding: '14px', fontSize: 16, gap: 10 },
  note: { fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 },
  successCard: { textAlign: 'center', padding: '60px 40px', maxWidth: 420, margin: '0 auto' },
  successIcon: { fontSize: 64, marginBottom: 20 },
};
