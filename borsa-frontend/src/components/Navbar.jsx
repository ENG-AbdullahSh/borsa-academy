import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;



  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#75ff9e' : '#bacbb9',
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    fontWeight: isActive(path) ? '700' : '500',
  });

  return (
    <>
      {/* ===== PREMIUM GLASS NAVBAR ===== */}
      <header className="fixed-top w-100 navbar-glass" style={{ height: '64px', zIndex: 1040 }}>
        {/* RTL: flex-row-reverse so Logo is on RIGHT, buttons on LEFT */}
        <nav className="d-flex align-items-center justify-content-between h-100 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
          {/* ── Logo (right side in RTL) ── */}
          <Link to="/" className="text-decoration-none fw-bold flex-shrink-0 interactive"
            style={{ color: '#75ff9e', fontSize: '22px', fontFamily: 'var(--font-sans)', textShadow: '0 0 12px rgba(117,255,158,0.18)', letterSpacing: '-0.01em' }}>
            بورصة أكاديمي
          </Link>

          {/* ── Nav Links (center, hidden on mobile) ── */}
          <div className="d-none d-md-flex align-items-center gap-4 flex-grow-1 justify-content-center">
            {[
              { label: 'الرئيسية', path: '/' },
              { label: 'الكورسات', path: '/courses' },
              { label: 'من نحن واتصل بنا', path: '/about' },
              { label: 'لوحة التحكم', path: '/admin' },
            ].map(({ label, path }) => (
              <Link key={path} to={path} className="px-1 py-1 interactive nav-hover-link" style={navLinkStyle(path)}>
                {label}
              </Link>
            ))}
          </div>

          {/* ── Action Buttons (left side in RTL) ── */}
          <div className="d-flex align-items-center gap-3 flex-shrink-0 ms-auto">
            <Link to="/signin" className="btn btn-link text-decoration-none p-0 border-0 fw-bold btn-link-opacity"
              style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
              تسجيل الدخول
            </Link>
            <Link to="/signup" className="btn px-4 py-2 fw-bold btn-join-premium"
              style={{ color: '#003918', fontSize: '13px', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}>
              انضم الآن
            </Link>
          </div>
        </nav>
      </header>

    </>
  );
}
