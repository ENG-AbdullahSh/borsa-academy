import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function InstructorCourseStudents() {
  const { id } = useParams();
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadStudents = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/instructor/courses/${id}/students?per_page=100`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setStudents(Array.isArray(payload.data) ? payload.data : []);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'تعذر تحميل الطلاب.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadStudents();
    return () => controller.abort();
  }, [id, token]);

  return (
    <InstructorTablePage title="طلاب الدورة" backTo={`/instructor/courses/${id}`} error={error} loading={loading}>
      <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
        <thead>
          <tr style={{ color: '#bacbb9', fontSize: '12px' }}>
            <th>الطالب</th>
            <th>البريد</th>
            <th className="text-center">التقدم</th>
            <th className="text-center">الحالة</th>
            <th className="text-center">الشهادات</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr><td colSpan="5" className="text-center text-muted py-4">لا يوجد طلاب مسجلون.</td></tr>
          ) : students.map((item) => (
            <tr key={item.id}>
              <td className="text-white fw-bold">{item.student.name}</td>
              <td className="text-muted" dir="ltr">{item.student.email}</td>
              <td className="text-center font-mono-data" style={{ color: '#75ff9e' }}>{item.progress}%</td>
              <td className="text-center">{item.completed ? 'مكتمل' : 'قيد التقدم'}</td>
              <td className="text-center">{item.certificates_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </InstructorTablePage>
  );
}

function InstructorTablePage({ title, backTo, error, loading, children }) {
  return (
    <main className="min-vh-100 py-5 px-4" style={{ paddingTop: '96px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <Link to={backTo} className="text-decoration-none fw-bold" style={{ color: '#75ff9e', fontSize: '13px' }}>العودة للدورة</Link>
        <h1 className="fw-bold text-white mt-2 mb-4">{title}</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <section className="glass-card rounded-3 p-4">
          {loading ? <div className="text-center py-5"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div> : children}
        </section>
      </div>
    </main>
  );
}
