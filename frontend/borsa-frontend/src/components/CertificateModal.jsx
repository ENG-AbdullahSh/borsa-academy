import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CertificateCard from './CertificateCard';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function CertificateModal({ isOpen, onClose, courseId }) {
  const { token } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !courseId || !token) return undefined;

    const controller = new AbortController();

    const fetchCertificate = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/my-courses/${courseId}/certificate`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCertificate(payload.data || null);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCertificate(null);
          setError('تعذر تحميل الشهادة حالياً.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCertificate();
    return () => controller.abort();
  }, [courseId, isOpen, token]);

  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 overflow-auto"
      style={{ zIndex: 1060, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', padding: '24px' }}
      role="dialog"
      aria-modal="true"
      aria-label="شهادة إتمام الدورة"
    >
      <div className="d-flex justify-content-end mb-3" style={{ maxWidth: '920px', margin: '0 auto' }}>
        <button type="button" onClick={onClose} className="btn text-white border" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          إغلاق
        </button>
      </div>

      {loading ? (
        <div className="py-5 text-center"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
      ) : error ? (
        <div className="glass-card rounded-3 p-5 text-center text-white" style={{ maxWidth: '720px', margin: '0 auto' }}>{error}</div>
      ) : certificate ? (
        <>
          <CertificateCard certificate={certificate} />
          <div className="d-flex flex-wrap gap-3 justify-content-center mt-4">
            <button type="button" className="btn btn-secondary-cta px-4 py-2 fw-bold" disabled>
              تحميل PDF قريباً
            </button>
            <Link to={`/certificates/${certificate.id}`} onClick={onClose} className="btn btn-primary-cta px-4 py-2 fw-bold">
              فتح صفحة الشهادة
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
