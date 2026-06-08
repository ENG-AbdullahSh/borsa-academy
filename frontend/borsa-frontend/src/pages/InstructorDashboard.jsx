import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

const EMPTY_DASHBOARD = {
  total_courses: 0,
  total_students: 0,
  total_lessons: 0,
  average_progress: 0,
  latest_enrollments: [],
  latest_quiz_attempts: [],
};

export default function InstructorDashboard() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/instructor/dashboard`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setDashboard({ ...EMPTY_DASHBOARD, ...(payload.data || {}) });
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setDashboard(EMPTY_DASHBOARD);
          setError(requestError.message || 'تعذر تحميل لوحة المدرب.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [retryKey, token]);

  const stats = useMemo(() => ([
    { label: 'دوراتي', value: dashboard.total_courses, suffix: '', icon: 'school', color: '#75ff9e' },
    { label: 'الطلاب', value: dashboard.total_students, suffix: '', icon: 'groups', color: '#81cfff' },
    { label: 'الدروس', value: dashboard.total_lessons, suffix: '', icon: 'menu_book', color: '#ffd54f' },
    { label: 'متوسط التقدم', value: dashboard.average_progress, suffix: '%', icon: 'monitoring', color: '#ffb4ab' },
  ]), [dashboard]);

  return (
    <main className="min-vh-100 py-5 px-4" style={{ paddingTop: '96px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <p className="font-mono-data text-uppercase mb-2" style={{ color: '#75ff9e', fontSize: '11px' }}>
              Instructor Dashboard
            </p>
            <h1 className="fw-bold text-white mb-1" style={{ fontSize: '30px' }}>لوحة المدرب</h1>
            <p className="text-muted m-0">أهلاً {user?.name || 'بك'}، تابع دوراتك وطلابك من هنا.</p>
          </div>
          <Link to="/instructor/courses" className="btn btn-primary-cta px-4 py-2 fw-bold">
            عرض دوراتي
          </Link>
        </div>

        {error ? (
          <div className="glass-card p-5 rounded-3 text-center">
            <h2 className="h5 text-white">{error}</h2>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="btn btn-secondary-cta mt-3">
              حاول مرة أخرى
            </button>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-5">
              {stats.map((stat) => (
                <div key={stat.label} className="col-12 col-sm-6 col-xl-3">
                  <div className="glass-card p-4 rounded-3 h-100">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '34px' }}>{stat.icon}</span>
                      <span className="font-mono-data text-white fw-bold" style={{ fontSize: '30px' }}>
                        {loading ? '...' : `${stat.value}${stat.suffix}`}
                      </span>
                    </div>
                    <p className="text-muted m-0">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4">
              <section className="col-12 col-lg-6">
                <div className="glass-card rounded-3 p-4 h-100">
                  <h2 className="h5 text-white fw-bold mb-3">آخر التسجيلات</h2>
                  {dashboard.latest_enrollments.length === 0 ? (
                    <p className="text-muted mb-0">لا توجد تسجيلات حديثة.</p>
                  ) : dashboard.latest_enrollments.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between gap-3 py-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div>
                        <div className="text-white fw-bold">{item.student.name}</div>
                        <div className="text-muted small">{item.course.title}</div>
                      </div>
                      <span className="font-mono-data" style={{ color: '#75ff9e' }}>{item.progress}%</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-12 col-lg-6">
                <div className="glass-card rounded-3 p-4 h-100">
                  <h2 className="h5 text-white fw-bold mb-3">آخر نتائج الاختبارات</h2>
                  {dashboard.latest_quiz_attempts.length === 0 ? (
                    <p className="text-muted mb-0">لا توجد محاولات حديثة.</p>
                  ) : dashboard.latest_quiz_attempts.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between gap-3 py-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div>
                        <div className="text-white fw-bold">{item.student.name}</div>
                        <div className="text-muted small">{item.course.title}</div>
                      </div>
                      <span style={{ color: item.passed ? '#75ff9e' : '#ffb4ab' }}>
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
