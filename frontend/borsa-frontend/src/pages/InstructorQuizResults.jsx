import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function InstructorQuizResults() {
  const { id } = useParams();
  const { token } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadAttempts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/instructor/courses/${id}/quiz-results?per_page=100`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setAttempts(Array.isArray(payload.data) ? payload.data : []);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'تعذر تحميل نتائج الاختبارات.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadAttempts();
    return () => controller.abort();
  }, [id, token]);

  return (
    <main className="min-vh-100 py-5 px-4" style={{ paddingTop: '96px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <Link to={`/instructor/courses/${id}`} className="text-decoration-none fw-bold" style={{ color: '#75ff9e', fontSize: '13px' }}>العودة للدورة</Link>
        <h1 className="fw-bold text-white mt-2 mb-4">نتائج الاختبارات</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <section className="glass-card rounded-3 p-4">
          {loading ? (
            <div className="text-center py-5"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
          ) : (
            <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
              <thead>
                <tr style={{ color: '#bacbb9', fontSize: '12px' }}>
                  <th>الطالب</th>
                  <th>الدورة</th>
                  <th className="text-center">الدرجة</th>
                  <th className="text-center">النسبة</th>
                  <th className="text-center">الحالة</th>
                  <th className="text-center">تاريخ الإرسال</th>
                </tr>
              </thead>
              <tbody>
                {attempts.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-4">لا توجد محاولات اختبار.</td></tr>
                ) : attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="text-white fw-bold">{attempt.student.name}</td>
                    <td className="text-muted">{attempt.course.title}</td>
                    <td className="text-center font-mono-data">{attempt.score}/{attempt.total_points}</td>
                    <td className="text-center" style={{ color: '#75ff9e' }}>{attempt.percentage}%</td>
                    <td className="text-center" style={{ color: attempt.passed ? '#75ff9e' : '#ffb4ab' }}>
                      {attempt.passed ? 'ناجح' : 'راسب'}
                    </td>
                    <td className="text-center text-muted">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('ar-EG') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
