import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { fallbackCourseImage, normalizeEnrollment } from '../utils/courseDisplay';

const DEFAULT_SUMMARY = {
  total_enrolled_courses: 0,
  completed_courses: 0,
  in_progress_courses: 0,
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', { state: { from: location }, replace: true });
    }
  }, [authLoading, isAuthenticated, location, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !token) {
      return undefined;
    }

    const controller = new AbortController();

    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/my-courses?per_page=6`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        const apiEnrollments = Array.isArray(payload.data) ? payload.data : [];
        const normalized = apiEnrollments.map(normalizeEnrollment);

        setEnrollments(normalized);
        setSummary(payload.summary || {
          total_enrolled_courses: payload.total ?? normalized.length,
          completed_courses: normalized.filter((item) => item.completed).length,
          in_progress_courses: normalized.filter((item) => !item.completed).length,
        });
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setEnrollments([]);
          setSummary(DEFAULT_SUMMARY);
          setError('تعذر تحميل لوحة الطالب. تأكد من تشغيل Laravel API.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [authLoading, isAuthenticated, retryKey, token]);

  const stats = useMemo(() => ([
    {
      label: 'إجمالي الدورات',
      value: summary.total_enrolled_courses,
      icon: 'school',
      color: '#75ff9e',
    },
    {
      label: 'الدورات المكتملة',
      value: summary.completed_courses,
      icon: 'verified',
      color: '#81cfff',
    },
    {
      label: 'قيد التقدم',
      value: summary.in_progress_courses,
      icon: 'trending_up',
      color: '#ffd54f',
    },
  ]), [summary]);

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '64px' }}>
        <div className="text-center">
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#75ff9e' }}>progress_activity</span>
          <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>جاري تحميل لوحة الطالب...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px', direction: 'rtl' }}>
      <main className="py-5 px-4" style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <p className="font-mono-data text-uppercase mb-2" style={{ color: '#75ff9e', fontSize: '11px', letterSpacing: '0.08em' }}>
              Student Dashboard
            </p>
            <h1 className="fw-bold text-white mb-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '30px' }}>
              لوحة الطالب
            </h1>
            <p className="text-muted m-0" style={{ fontSize: '14px' }}>
              أهلاً {user?.name || 'بك'}، تابع دوراتك وتقدمك من هنا.
            </p>
          </div>
          <Link to="/my-courses" className="btn btn-primary-cta px-4 py-2 fw-bold" style={{ borderRadius: '8px', fontFamily: 'var(--font-sans)' }}>
            عرض كل دوراتي
          </Link>
        </div>

        {error ? (
          <div className="glass-card p-5 rounded-3 text-center">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '64px' }}>cloud_off</span>
            <h2 className="h5 text-white mt-3" style={{ fontFamily: 'var(--font-sans)' }}>{error}</h2>
            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="btn mt-3 px-4 py-2 fw-semibold border"
              style={{ borderColor: '#75ff9e', color: '#75ff9e', borderRadius: '8px', fontFamily: 'var(--font-sans)' }}
            >
              حاول مرة أخرى
            </button>
          </div>
        ) : (
          <>
            <div className="row g-4 mb-4">
              {stats.map((stat) => (
                <div key={stat.label} className="col-12 col-md-4">
                  <div className="glass-card p-4 rounded-3 h-100">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '34px' }}>{stat.icon}</span>
                      <span className="font-mono-data text-white fw-bold" style={{ fontSize: '34px' }}>{loading ? '...' : stat.value}</span>
                    </div>
                    <p className="text-muted m-0" style={{ fontFamily: 'var(--font-sans)' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <section className="glass-card p-4 rounded-3">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-4">
                <div>
                  <h2 className="h5 text-white fw-bold mb-1" style={{ fontFamily: 'var(--font-sans)' }}>دوراتي الأخيرة</h2>
                  <p className="text-muted m-0" style={{ fontSize: '13px' }}>ابدأ من آخر الدورات التي اشتركت بها.</p>
                </div>
                <Link to="/courses" className="text-decoration-none fw-bold" style={{ color: '#75ff9e', fontSize: '14px' }}>
                  تصفح الكورسات
                </Link>
              </div>

              {loading ? (
                <div className="py-5 text-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#75ff9e' }}>progress_activity</span>
                  <p className="text-muted mt-3 mb-0">جاري تحميل الدورات...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="py-5 text-center">
                  <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '56px' }}>school</span>
                  <h3 className="h5 text-white mt-3">لا توجد دورات بعد</h3>
                  <p className="text-muted">اشترك في دورة لتظهر هنا فوراً.</p>
                  <Link to="/courses" className="btn btn-primary-cta px-4 py-2 fw-bold">ابدأ الآن</Link>
                </div>
              ) : (
                <div className="row g-3">
                  {enrollments.slice(0, 3).map((enrollment, index) => (
                    <div key={enrollment.id} className="col-12 col-lg-4">
                      <Link to={`/courses/${enrollment.courseId}`} className="text-decoration-none">
                        <article className="rounded-3 overflow-hidden h-100" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <img
                            src={enrollment.course.image}
                            alt={enrollment.course.title}
                            className="w-100 object-cover"
                            style={{ height: '130px' }}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = fallbackCourseImage(index);
                            }}
                          />
                          <div className="p-3">
                            <h3 className="h6 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{enrollment.course.title}</h3>
                            <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '12px' }}>
                              <span>{enrollment.course.instructor}</span>
                              <span>{enrollment.progress}%</span>
                            </div>
                            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${enrollment.progress}%`, height: '100%', backgroundColor: '#75ff9e', borderRadius: '999px' }} />
                            </div>
                          </div>
                        </article>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
