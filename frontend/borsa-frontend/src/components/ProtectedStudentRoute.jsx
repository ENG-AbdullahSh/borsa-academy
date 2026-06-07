import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedStudentRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: '#0b0e11', color: '#75ff9e' }}
      >
        <span className="spinner-border" aria-label="جاري التحقق من تسجيل الدخول" />
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
          message: 'يرجى تسجيل الدخول للوصول إلى صفحة الطالب',
        }}
      />
    );
  }

  if (user.role !== 'student') {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
}
