import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import CertificateCard from '../components/CertificateCard';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function CertificateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', { state: { from: location }, replace: true });
    }
  }, [authLoading, isAuthenticated, location, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !token) return undefined;

    const controller = new AbortController();

    const fetchCertificate = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/my-certificates/${id}`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCertificate(payload.data || null);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.status === 404 ? 'الشهادة غير موجودة.' : 'تعذر تحميل الشهادة حالياً.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCertificate();
    return () => controller.abort();
  }, [authLoading, id, isAuthenticated, token]);

  // ── PDF download via blob ────────────────────────────────────────────────
  const downloadPdf = async () => {
    setPdfError('');
    setPdfLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/${id}/download`, {
        headers: apiHeaders(token),
      });

      if (!response.ok) {
        // Try to extract JSON error message
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'تعذر تحميل الشهادة.');
      }

      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = certificate
        ? `Certificate-${(certificate.certificate_title || certificate.course_title)?.replace(/\s+/g, '-') ?? id}.pdf`
        : `certificate-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px', direction: 'rtl' }}>
      <main className="py-5 px-3 px-md-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 mb-4" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <Link to="/certificates" className="btn btn-secondary-cta px-4 py-2">العودة إلى الشهادات</Link>

          <div className="d-flex flex-column align-items-end gap-1">
            <button
              type="button"
              id="certificate-pdf-download"
              onClick={downloadPdf}
              disabled={pdfLoading || loading || !!error}
              className="btn btn-primary-cta px-4 py-2 fw-bold d-flex align-items-center gap-2"
            >
              {pdfLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  تحميل PDF
                </>
              )}
            </button>
            {pdfError && (
              <span style={{ fontSize: '12px', color: '#ff6b6b', fontFamily: 'var(--font-sans)' }}>
                {pdfError}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
        ) : error ? (
          <div className="glass-card rounded-3 p-5 text-center text-white" style={{ maxWidth: '720px', margin: '0 auto' }}>{error}</div>
        ) : certificate ? (
          <CertificateCard certificate={certificate} />
        ) : null}
      </main>
    </div>
  );
}
