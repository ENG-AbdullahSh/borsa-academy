import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import borsaLogo from '../assets/Borsa Academy.jpeg';
import { FiBell, FiLogOut } from 'react-icons/fi';
import UserAvatar from './UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { settings } = useSettings();

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#75ff9e' : '#bacbb9',
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    fontWeight: isActive(path) ? '700' : '500',
  });

  const navLinks = user?.role === 'instructor'
    ? [
        { label: 'لوحة المدرب', path: '/instructor-dashboard' },
        { label: 'دوراتي', path: '/instructor/courses' },
        { label: 'الملف الشخصي', path: '/profile' },
      ]
    : [
        { label: 'الرئيسية', path: '/' },
        { label: 'الكورسات', path: '/courses' },
        ...(isAuthenticated && user?.role === 'student' ? [
          { label: 'لوحة الطالب', path: '/student-dashboard' },
          { label: 'دوراتي', path: '/my-courses' },
          { label: 'شهاداتي', path: '/certificates' },
        ] : []),
        { label: 'من نحن واتصل بنا', path: '/about' },
        ...(user?.role === 'admin' ? [{ label: 'لوحة التحكم', path: '/admin' }] : []),
      ];

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMobile();
    navigate('/signin', { replace: true });
  };

  return (
    <>
      {/* ===== PREMIUM GLASS NAVBAR ===== */}
      <header className="fixed-top w-100 navbar-glass" style={{ height: '64px', zIndex: 1040 }}>
        <nav
          className="d-flex align-items-center justify-content-between h-100 px-3 px-md-4"
          style={{ maxWidth: '1440px', margin: '0 auto' }}
        >
          {/* ── Logo + Brand Name ── */}
          <Link
            to="/"
            onClick={closeMobile}
            className="text-decoration-none shrink-0 interactive d-flex align-items-center gap-3"
            aria-label="بورصة أكاديمي - الصفحة الرئيسية"
            style={{ flexDirection: 'row' }}
          >
            <img
              src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo}
              alt={settings.academy_name || "بورصة أكاديمي"}
              className="brand-logo-animated"
              style={{ height: '42px', maxHeight: '42px', width: 'auto', objectFit: 'contain', borderRadius: '8px' }}
            />
            <span className="brand-text-glowing" style={{ fontSize: '20px', fontFamily: 'var(--font-sans)' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
            </span>
          </Link>

          {/* ── Desktop Nav Links (hidden on mobile) ── */}
          <div className="d-none d-lg-flex align-items-center gap-4 grow justify-content-center">
            {navLinks.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className="px-1 py-1 interactive nav-hover-link"
                style={navLinkStyle(path)}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Action Buttons & Notifications (hidden on mobile) ── */}
          <div className="d-none d-lg-flex align-items-center gap-3 shrink-0">
            
            {/* Notification Bell */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="text-decoration-none"
                style={{
                  background: 'transparent',
                  border: 'none',
                  position: 'relative',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#F1F5F9'
                }}
                aria-label="الإشعارات"
              >
                <FiBell size={22} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '6px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#00E676',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(0,230,118,0.8)',
                    border: '2px solid #0B0F19'
                  }} />
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="d-flex align-items-center gap-2 px-2 text-decoration-none btn-link-opacity"
                  style={{ color: '#bacbb9', fontSize: '13px', fontFamily: 'var(--font-sans)' }}
                >
                  <UserAvatar
                    name={user?.name || ''}
                    avatarUrl={user?.avatar_url || null}
                    size={28}
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <span className="text-truncate" style={{ maxWidth: '140px' }}>
                    {user?.name || user?.email}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-link text-decoration-none p-0 border-0 fw-bold btn-link-opacity d-flex align-items-center gap-2"
                  style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}
                >
                  <FiLogOut size={17} />
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="btn btn-link text-decoration-none p-0 border-0 fw-bold btn-link-opacity"
                  style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/signup"
                  className="btn px-4 py-2 fw-bold btn-join-premium"
                  style={{ color: '#003918', fontSize: '13px', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}
                >
                  انضم الآن
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger (visible on mobile only) ── */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="d-lg-none btn p-0 border-0 bg-transparent navbar-hamburger"
            aria-label="فتح القائمة"
            style={{ color: '#bacbb9', lineHeight: 1 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px', transition: 'transform 0.3s ease' }}>
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </nav>
      </header>

      {/* ===== MOBILE OVERLAY MENU ===== */}
      {/* Backdrop */}
      <div
        onClick={closeMobile}
        className="navbar-mobile-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1039,
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          top: '64px',
          right: 0,
          bottom: 0,
          width: '280px',
          backgroundColor: '#111417',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          zIndex: 1040,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          overflowY: 'auto',
        }}
      >
        {/* Mobile Nav Links */}
        <nav className="d-flex flex-column px-4 gap-1 mb-4">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={closeMobile}
              className="text-decoration-none py-3 px-3 rounded-3 interactive"
              style={{
                color: isActive(path) ? '#75ff9e' : '#bacbb9',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive(path) ? '700' : '500',
                fontSize: '16px',
                backgroundColor: isActive(path) ? 'rgba(117,255,158,0.06)' : 'transparent',
                borderRight: isActive(path) ? '3px solid #75ff9e' : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '0 24px 24px' }} />

        {/* Mobile Auth Buttons */}
        <div className="d-flex flex-column gap-3 px-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={closeMobile}
                className="d-flex align-items-center gap-2 px-2"
                style={{
                  color: '#bacbb9',
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'none',
                }}
              >
                <UserAvatar
                  name={user?.name || ''}
                  avatarUrl={user?.avatar_url || null}
                  size={32}
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <span className="text-truncate">{user?.name || user?.email}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn py-2 fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                }}
              >
                <FiLogOut size={17} />
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                onClick={closeMobile}
                className="btn py-2 fw-bold text-white"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                }}
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/signup"
                onClick={closeMobile}
                className="btn py-2 fw-bold btn-join-premium"
                style={{ color: '#003918', fontSize: '14px', fontFamily: 'var(--font-sans)' }}
              >
                انضم الآن
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
