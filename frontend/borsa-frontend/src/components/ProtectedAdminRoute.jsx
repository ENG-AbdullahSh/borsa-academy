import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function AuthStatusScreen({ title, message }) {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{ backgroundColor: '#0b0e11', direction: 'rtl', paddingTop: '64px' }}
    >
      <div className="glass-card rounded-3 p-4 p-md-5 text-center" style={{ maxWidth: '460px' }}>
        <div
          className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: '64px',
            height: '64px',
            background: 'rgba(0, 230, 118, 0.08)',
            border: '1px solid rgba(0, 230, 118, 0.28)',
            color: '#00e676',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>admin_panel_settings</span>
        </div>
        <h1 className="fw-bold text-white mb-3" style={{ fontSize: '24px', fontFamily: 'var(--font-sans)' }}>
          {title}
        </h1>
        <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: 1.8, fontFamily: 'var(--font-sans)' }}>
          {message}
        </p>
        <Link to="/" className="btn btn-primary-cta fw-bold px-4 py-2">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

export default function ProtectedAdminRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <AuthStatusScreen
        title="جاري التحقق من صلاحيات الدخول"
        message="نقوم بمراجعة بيانات الحساب قبل فتح لوحة التحكم."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: location,
          message: 'يرجى تسجيل الدخول بحساب إداري للوصول إلى لوحة التحكم',
        }}
      />
    );
  }

  if (user.role !== 'admin') {
    return (
      <AuthStatusScreen
        title="غير مصرح لك بالدخول"
        message="هذه الصفحة متاحة لحسابات الإدارة فقط."
      />
    );
  }

  return children;
}
