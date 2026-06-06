import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { formatCertificateDate } from '../utils/certificates';

export default function Certificates() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', { state: { from: location }, replace: true });
    }
  }, [authLoading, isAuthenticated, location, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !token) return undefined;

    const controller = new AbortController();

    const fetchCertificates = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/my-certificates`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCertificates(Array.isArray(payload.data) ? payload.data : []);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCertificates([]);
          setError('تعذر تحميل شهاداتك حالياً.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCertificates();
    return () => controller.abort();
  }, [authLoading, isAuthenticated, token]);

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px', direction: 'rtl' }}>
      <main className="py-5 px-4" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="mb-4">
          <p className="font-mono-data mb-2" style={{ color: '#75ff9e', fontSize: '11px' }}>MY CERTIFICATES</p>
          <h1 className="text-white fw-bold mb-2">شهاداتي</h1>
          <p className="text-muted mb-0">كل الشهادات التي حصلت عليها بعد إكمال دوراتك.</p>
        </div>

        {loading ? (
          <div className="py-5 text-center"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
        ) : error ? (
          <div className="glass-card rounded-3 p-5 text-center text-white">{error}</div>
        ) : certificates.length === 0 ? (
          <div className="glass-card rounded-3 p-5 text-center">
            <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '58px' }}>workspace_premium</span>
            <h2 className="h5 text-white mt-3">لا توجد شهادات بعد</h2>
            <p className="text-muted">أكمل دورة بنسبة 100% لتصدر شهادتك تلقائياً.</p>
            <Link to="/my-courses" className="btn btn-primary-cta px-4 py-2 fw-bold">العودة إلى دوراتي</Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {certificates.map((certificate) => (
              <article key={certificate.id} className="glass-card rounded-3 p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <span className="font-mono-data d-block mb-2" dir="ltr" style={{ color: '#d4af37', fontSize: '12px' }}>
                    {certificate.certificate_number}
                  </span>
                  <h2 className="h5 text-white fw-bold mb-2">{certificate.course_title}</h2>
                  <p className="text-muted mb-0" style={{ fontSize: '13px' }}>تاريخ الإصدار: {formatCertificateDate(certificate.issued_at)}</p>
                </div>
                <Link to={`/certificates/${certificate.id}`} className="btn btn-primary-cta px-4 py-2 fw-bold flex-shrink-0">
                  عرض الشهادة
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
