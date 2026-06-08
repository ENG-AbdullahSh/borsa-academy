import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminCurriculum from './AdminCurriculum';
import AdminQuizManager from './AdminQuizManager';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function InstructorCourseDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadCourse = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/instructor/courses/${id}`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCourse(payload.data);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'تعذر تحميل الدورة.');
        }
      }
    };

    loadCourse();
    return () => controller.abort();
  }, [id, token]);

  return (
    <main className="min-vh-100 py-5 px-4" style={{ paddingTop: '96px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <Link to="/instructor/courses" className="text-decoration-none fw-bold" style={{ color: '#75ff9e', fontSize: '13px' }}>
              العودة إلى دوراتي
            </Link>
            <h1 className="fw-bold text-white mt-2 mb-1">{course?.title || 'إدارة الدورة'}</h1>
            <p className="text-muted m-0">إدارة محتوى الدورة واختبارها ضمن صلاحيات المدرب.</p>
          </div>
          <div className="d-flex gap-2">
            <Link to={`/instructor/courses/${id}/students`} className="btn btn-secondary-cta btn-sm">الطلاب</Link>
            <Link to={`/instructor/courses/${id}/quiz-results`} className="btn btn-secondary-cta btn-sm">نتائج الاختبارات</Link>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-flex gap-2 mb-4">
          <button type="button" className={`btn ${activeTab === 'content' ? 'btn-primary-cta' : 'btn-secondary-cta'} fw-bold`} onClick={() => setActiveTab('content')}>
            إدارة المحتوى
          </button>
          <button type="button" className={`btn ${activeTab === 'quiz' ? 'btn-primary-cta' : 'btn-secondary-cta'} fw-bold`} onClick={() => setActiveTab('quiz')}>
            إدارة الاختبار
          </button>
        </div>

        {activeTab === 'content' ? (
          <AdminCurriculum courseId={id} scope="instructor" />
        ) : (
          <AdminQuizManager courseId={id} scope="instructor" />
        )}
      </div>
    </main>
  );
}
