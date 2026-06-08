import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function UnauthorizedScreen() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{ backgroundColor: '#0b0e11', direction: 'rtl', paddingTop: '64px' }}
    >
      <div className="glass-card rounded-3 p-4 p-md-5 text-center" style={{ maxWidth: '460px' }}>
        <span className="material-symbols-outlined mb-3" style={{ fontSize: '56px', color: '#ffb4ab' }}>
          lock
        </span>
        <h1 className="fw-bold text-white mb-3" style={{ fontSize: '24px' }}>
          غير مصرح لك بالدخول
        </h1>
        <p className="text-muted mb-4">
          هذه الصفحة متاحة لحسابات المدربين المرتبطة بدورات المنصة فقط.
        </p>
        <Link to="/" className="btn btn-primary-cta fw-bold px-4 py-2">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

export default function ProtectedInstructorRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0b0e11', color: '#75ff9e' }}>
        <span className="spinner-border" aria-label="جاري التحقق من الصلاحيات" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: location,
          message: 'يرجى تسجيل الدخول بحساب مدرب للوصول إلى هذه الصفحة',
        }}
      />
    );
  }

  if (user.role !== 'instructor') {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;

    return <UnauthorizedScreen />;
  }

  return children;
}
