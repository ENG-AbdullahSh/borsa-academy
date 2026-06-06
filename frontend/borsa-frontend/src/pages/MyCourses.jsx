import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { fallbackCourseImage, normalizeEnrollment } from '../utils/courseDisplay';

const PER_PAGE = 9;
const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  total: 0,
  from: null,
  to: null,
};

function progressStatus(progress) {
  if (progress >= 100) return 'مكتمل';
  if (progress > 0) return 'قيد التقدم';
  return 'لم يبدأ';
}

export default function MyCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificateError, setCertificateError] = useState('');
  const [openingCertificateId, setOpeningCertificateId] = useState(null);
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

    const fetchMyCourses = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(PER_PAGE),
        });
        const response = await fetch(`${API_BASE_URL}/my-courses?${params.toString()}`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        const apiEnrollments = Array.isArray(payload.data) ? payload.data : [];

        setEnrollments(apiEnrollments.map(normalizeEnrollment));
        setPagination({
          current_page: payload.current_page ?? page,
          last_page: payload.last_page ?? 1,
          total: payload.total ?? apiEnrollments.length,
          from: payload.from ?? null,
          to: payload.to ?? null,
        });
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setEnrollments([]);
          setPagination(DEFAULT_PAGINATION);
          setError('تعذر تحميل دوراتك. تأكد من تسجيل الدخول وتشغيل Laravel API.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMyCourses();

    return () => controller.abort();
  }, [authLoading, isAuthenticated, page, retryKey, token]);

  const pageNumbers = useMemo(() => {
    const lastPage = Math.max(Number(pagination.last_page) || 1, 1);

    if (lastPage <= 3) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(page - 1, lastPage - 2));
    return [start, start + 1, start + 2];
  }, [page, pagination.last_page]);

  const goToPage = (nextPage) => {
    const lastPage = Math.max(Number(pagination.last_page) || 1, 1);
    setPage(Math.min(Math.max(nextPage, 1), lastPage));
  };

  const openCertificate = async (courseId) => {
    setOpeningCertificateId(courseId);
    setCertificateError('');

    try {
      const response = await fetch(`${API_BASE_URL}/my-courses/${courseId}/certificate`, {
        headers: apiHeaders(token),
      });
      const payload = await readJsonResponse(response);
      const certificate = payload.data;

      if (!certificate?.id) {
        throw new Error('Certificate was not returned.');
      }

      navigate(`/certificates/${certificate.id}`);
    } catch {
      setCertificateError('تعذر فتح الشهادة حالياً. حاول مرة أخرى.');
    } finally {
      setOpeningCertificateId(null);
    }
  };

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '64px' }}>
        <div className="text-center">
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#75ff9e' }}>progress_activity</span>
          <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>جاري تجهيز دوراتك...</h5>
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
              My Courses
            </p>
            <h1 className="fw-bold text-white mb-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '30px' }}>
              دوراتي
            </h1>
            <p className="text-muted m-0" style={{ fontSize: '14px' }}>
              {loading ? 'جاري تحميل الدورات...' : `${pagination.total} دورة مشترك بها.`}
            </p>
          </div>
          <Link to="/courses" className="btn btn-primary-cta px-4 py-2 fw-bold" style={{ borderRadius: '8px', fontFamily: 'var(--font-sans)' }}>
            تصفح المزيد
          </Link>
        </div>

        {loading ? (
          <div className="py-5 text-center">
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#75ff9e' }}>progress_activity</span>
            <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>جاري تحميل الدورات...</h5>
          </div>
        ) : error ? (
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
        ) : enrollments.length === 0 ? (
          <div className="glass-card p-5 rounded-3 text-center">
            <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '64px' }}>school</span>
            <h2 className="h4 text-white mt-3" style={{ fontFamily: 'var(--font-sans)' }}>لم تشترك في أي دورة بعد</h2>
            <p className="text-muted mb-4">ابدأ من كتالوج الدورات واختر المسار المناسب لك.</p>
            <Link to="/courses" className="btn btn-primary-cta px-4 py-2 fw-bold">تصفح الكورسات</Link>
          </div>
        ) : (
          <>
            {certificateError && (
              <div className="rounded-3 px-3 py-2 mb-4" role="alert" style={{ color: '#fecaca', background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)' }}>
                {certificateError}
              </div>
            )}
            <div className="row g-4">
              {enrollments.map((enrollment, index) => (
                <div key={enrollment.id} className="col-12 col-md-6 col-xl-4">
                  <article className="glass-card rounded-3 overflow-hidden h-100 d-flex flex-column">
                    <img
                      src={enrollment.course.image}
                      alt={enrollment.course.title}
                      className="w-100 object-cover"
                      style={{ height: '170px' }}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackCourseImage(index);
                      }}
                    />
                    <div className="p-4 d-flex flex-column flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                        <span className="px-2 py-1 rounded font-mono-data" style={{ color: '#003918', backgroundColor: '#75ff9e', fontSize: '10px', fontWeight: 700 }}>
                          {enrollment.course.levelLabel}
                        </span>
                        <span className="text-muted font-mono-data" style={{ fontSize: '11px' }}>{enrollment.progress}%</span>
                      </div>
                      <h2 className="h6 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                        {enrollment.course.title}
                      </h2>
                      {enrollment.progress >= 100 && (
                        <p className="mb-2" style={{ color: '#75ff9e', fontSize: '12px' }}>🏆 تم إكمال الدورة</p>
                      )}
                      <p className="text-muted d-flex align-items-center gap-1 mb-3" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                        بإشراف {enrollment.course.instructor}
                      </p>
                      <div className="mb-4">
                        <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '12px' }}>
                          <span>التقدم</span>
                          <span>{progressStatus(enrollment.progress)}</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${enrollment.progress}%`, height: '100%', backgroundColor: '#75ff9e', borderRadius: '999px' }} />
                        </div>
                      </div>
                      <div className="mt-auto d-flex flex-column gap-2">
                        {enrollment.progress >= 100 && (
                          <button
                            type="button"
                            onClick={() => openCertificate(enrollment.courseId)}
                            disabled={openingCertificateId !== null}
                            className="btn btn-primary-cta w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                          >
                            {openingCertificateId === enrollment.courseId ? (
                              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                            ) : (
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
                            )}
                            عرض الشهادة
                          </button>
                        )}
                        <Link
                          to={`/courses/${enrollment.courseId}`}
                          className="btn w-100 py-2 text-white fw-semibold d-flex align-items-center justify-content-center gap-2"
                          style={{ backgroundColor: '#272a2e', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}
                        >
                          متابعة التعلم
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>

            <div className="mt-5 d-flex align-items-center justify-content-center gap-2">
              <button className="btn rounded d-flex align-items-center justify-content-center" disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21,26,34,0.6)', color: page <= 1 ? '#5f6b5f' : '#bacbb9', border: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>

              {pageNumbers.map((item) => (
                <button key={item} className="btn rounded d-flex align-items-center justify-content-center"
                  onClick={() => goToPage(item)}
                  style={{ width: '40px', height: '40px', backgroundColor: item === page ? '#75ff9e' : 'rgba(21,26,34,0.6)', color: item === page ? '#003918' : '#bacbb9', border: 'none', fontWeight: item === page ? 700 : 400 }}>
                  {item}
                </button>
              ))}

              <button className="btn rounded d-flex align-items-center justify-content-center" disabled={page >= (Number(pagination.last_page) || 1)}
                onClick={() => goToPage(page + 1)}
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21,26,34,0.6)', color: page >= (Number(pagination.last_page) || 1) ? '#5f6b5f' : '#bacbb9', border: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
