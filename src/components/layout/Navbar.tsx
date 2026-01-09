'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface NavItem { href: string; label: string; icon: string; id: string; }

const navItems: NavItem[] = [
  { href: '/feed', label: 'Feed', icon: '▶', id: 'nav-feed' },
  { href: '/upload', label: 'Upload', icon: '⊕', id: 'nav-upload' },
  { href: '/dashboard', label: 'My Videos', icon: '◫', id: 'nav-dashboard' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <nav style={styles.nav} className="glass">
      {/* Logo */}
      <Link href="/feed" style={styles.logo}>
        <span style={styles.logoIcon}>▶</span>
        <span className="gradient-text" style={styles.brand}>DevReels</span>
      </Link>

      {/* Nav links */}
      <div style={styles.links}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            id="nav-admin"
            style={{ ...styles.link, ...(pathname.startsWith('/admin') ? styles.linkActive : {}) }}
          >
            <span style={styles.icon}>⚙</span>
            <span>Admin</span>
          </Link>
        )}
      </div>

      {/* User */}
      <div style={styles.userSection}>
        <div style={styles.avatar} className="avatar">
          {initial}
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.name}</span>
          <span style={styles.userRole}>{user?.role}</span>
        </div>
        <button id="nav-logout" onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: 32,
    zIndex: 100,
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--gradient-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: 'white',
  },
  brand: { fontSize: 20, fontWeight: 800 },
  links: { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  linkActive: {
    background: 'rgba(108,99,255,0.15)',
    color: 'var(--accent)',
  },
  icon: { fontSize: 16 },
  userSection: { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' },
  avatar: { width: 34, height: 34, fontSize: 14 },
  userInfo: { display: 'flex', flexDirection: 'column', gap: 1 },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  userRole: { fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  logoutBtn: { padding: '6px 14px', fontSize: 13 },
};
