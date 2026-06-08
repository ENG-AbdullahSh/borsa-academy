import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function InstructorCourses() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadCourses = async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ page: String(page), per_page: '12' });
      if (search.trim()) params.set('search', search.trim());

      try {
        const response = await fetch(`${API_BASE_URL}/instructor/courses?${params}`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCourses(Array.isArray(payload.data) ? payload.data : []);
        setPagination({
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          total: payload.total || 0,
        });
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCourses([]);
          setError(requestError.message || 'تعذر تحميل دورات المدرب.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadCourses();
    return () => controller.abort();
  }, [page, search, token]);

  return (
    <main className="min-vh-100 py-5 px-4" style={{ paddingTop: '96px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="fw-bold text-white mb-1">دوراتي</h1>
            <p className="text-muted m-0">الدورات المسندة إلى ملفك كمدرب.</p>
          </div>
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            className="form-control custom-input"
            placeholder="بحث في دوراتي..."
            style={{ maxWidth: '320px' }}
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="text-center py-5"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
        ) : courses.length === 0 ? (
          <div className="glass-card rounded-3 p-5 text-center text-muted">لا توجد دورات مسندة إليك حالياً.</div>
        ) : (
          <div className="row g-4">
            {courses.map((course) => (
              <div key={course.id} className="col-12 col-lg-6 col-xl-4">
                <article className="glass-card rounded-3 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <h2 className="h5 text-white fw-bold mb-0">{course.title}</h2>
                    <span className="px-2 py-1 rounded font-mono-data" style={{ color: course.status === 'published' ? '#75ff9e' : '#ffd54f', background: 'rgba(255,255,255,0.06)', fontSize: '11px' }}>
                      {course.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                  <div className="row g-2 mb-4">
                    <div className="col-4"><SmallStat label="طلاب" value={course.students_count} /></div>
                    <div className="col-4"><SmallStat label="دروس" value={course.lessons_count} /></div>
                    <div className="col-4"><SmallStat label="تقدم" value={`${course.average_progress}%`} /></div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <Link to={`/instructor/courses/${course.id}`} className="btn btn-primary-cta btn-sm fw-bold">إدارة المحتوى</Link>
                    <Link to={`/instructor/courses/${course.id}/students`} className="btn btn-secondary-cta btn-sm fw-bold">الطلاب</Link>
                    <Link to={`/instructor/courses/${course.id}/quiz-results`} className="btn btn-secondary-cta btn-sm fw-bold">نتائج الاختبارات</Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}

        {pagination.last_page > 1 && (
          <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
            <button className="btn btn-secondary-cta btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>السابق</button>
            <span className="text-muted small">صفحة {pagination.current_page} من {pagination.last_page}</span>
            <button className="btn btn-primary-cta btn-sm" disabled={page >= pagination.last_page || loading} onClick={() => setPage((value) => value + 1)}>التالي</button>
          </div>
        )}
      </div>
    </main>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-3 p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <strong className="d-block text-white font-mono-data">{value}</strong>
      <span className="text-muted small">{label}</span>
    </div>
  );
}
