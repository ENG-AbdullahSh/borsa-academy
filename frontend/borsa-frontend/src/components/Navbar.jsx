import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import borsaLogo from '../assets/Borsa Academy.jpeg';
import { FiBell, FiCheckCircle, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, loading: notifLoading, markAllAsRead, markAsRead } = useNotifications();
  const { settings } = useSettings();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#75ff9e' : '#bacbb9',
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    fontWeight: isActive(path) ? '700' : '500',
  });

  const navLinks = [
    { label: 'الرئيسية', path: '/' },
    { label: 'الكورسات', path: '/courses' },
    // "مساري" is a student-only feature — hidden from admins
    ...(user?.role !== 'admin' ? [{ label: 'مساري 📈', path: '/masari' }] : []),
    ...(isAuthenticated && user?.role !== 'admin' ? [
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
    setNotifOpen(false);
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
            className="text-decoration-none flex-shrink-0 interactive d-flex align-items-center gap-2"
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
          <div className="d-none d-lg-flex align-items-center gap-4 flex-grow-1 justify-content-center">
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
          <div className="d-none d-lg-flex align-items-center gap-3 flex-shrink-0">
            
            {/* Notification Bell Dropdown */}
            <div className="position-relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
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
              </button>

              {/* Glassmorphic Dropdown Panel */}
              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  left: '0', // Left aligned in RTL context
                  width: '320px',
                  background: 'rgba(11, 15, 25, 0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 1050,
                  direction: 'rtl',
                  animation: 'authFadeIn 0.2s ease-out'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: '700' }}>الإشعارات</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        style={{ background: 'none', border: 'none', color: '#00E676', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FiCheckCircle size={14} /> مقروء
                      </button>
                    )}
                  </div>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {notifLoading ? (
                      <div style={{ padding: '30px', textAlign: 'center' }}>
                        <span className="spinner-border spinner-border-sm" style={{ color: '#00E676' }} aria-hidden="true" />
                        <p style={{ color: '#64748B', fontSize: '13px', margin: '10px 0 0' }}>جاري تحميل الإشعارات...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                        <span style={{ display: 'block', fontSize: '28px', marginBottom: '8px' }}>🔔</span>
                        لا توجد إشعارات حالياً
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => { markAsRead(notif.id); setNotifOpen(false); navigate(notif.action_url || '/notifications'); }}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: notif.isUnread ? 'rgba(0, 230, 118, 0.05)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            position: 'relative'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.background = notif.isUnread ? 'rgba(0, 230, 118, 0.05)' : 'transparent'}
                        >
                          {notif.isUnread && (
                            <div style={{ position: 'absolute', top: '16px', right: '10px', width: '6px', height: '6px', background: '#00E676', borderRadius: '50%', boxShadow: '0 0 6px rgba(0,230,118,0.5)' }} />
                          )}
                          <div style={{ paddingRight: notif.isUnread ? '12px' : '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', color: notif.isUnread ? '#fff' : '#E2E8F0', fontWeight: '700' }}>{notif.title}</h4>
                              <span style={{ fontSize: '11px', color: '#64748B', flexShrink: 0, marginRight: '8px' }}>{notif.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {notif.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <Link to="/notifications" onClick={() => setNotifOpen(false)} style={{ color: '#00E676', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                      عرض كل الإشعارات
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="d-flex align-items-center gap-2 px-2 text-decoration-none btn-link-opacity"
                  style={{ color: '#bacbb9', fontSize: '13px', fontFamily: 'var(--font-sans)' }}
                >
                  {user?.avatar ? (
                    <img 
                      src={`http://127.0.0.1:8000/storage/${user.avatar}`} 
                      alt={user.name} 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                  ) : (
                    <FiUser size={18} />
                  )}
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
              <div
                className="d-flex align-items-center gap-2 px-2"
                style={{ color: '#bacbb9', fontSize: '14px', fontFamily: 'var(--font-sans)' }}
              >
                {user?.avatar ? (
                  <img 
                    src={`http://127.0.0.1:8000/storage/${user.avatar}`} 
                    alt={user.name} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                  />
                ) : (
                  <FiUser size={18} />
                )}
                <span className="text-truncate">{user?.name || user?.email}</span>
              </div>
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
