import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import CinemaVideoPlayer from '../components/CinemaVideoPlayer';
import CourseCurriculum from '../components/CourseCurriculum';
import VideoNotesSidebar from '../components/VideoNotesSidebar';
import CourseQuiz from '../components/CourseQuiz';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { courseImage, levelLabel } from '../utils/courseDisplay';

const ACCESS_REQUIRED_MESSAGE = 'يجب الاشتراك في الدورة أولاً';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const { token, isAuthenticated, loading: authLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [accessMessage, setAccessMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const courseId = Number(id);
  const isCourseIdValid = Number.isFinite(courseId) && courseId > 0;
  const canAccessCourse = Boolean(enrollment);

  const courseMeta = useMemo(() => {
    if (!course) {
      return [];
    }

    return [
      { icon: 'signal_cellular_alt', label: levelLabel(course.level) },
      { icon: 'schedule', label: `${Number(course.duration_hours || 0)} ساعة` },
      { icon: 'sell', label: Number(course.price || 0) > 0 ? `$${Number(course.price).toFixed(2)}` : 'مجاني' },
      { icon: 'category', label: course.category || 'تداول' },
    ];
  }, [course]);

  const fetchEnrollment = useCallback(async (signal) => {
    if (!isAuthenticated || !token || !courseId) {
      setEnrollment(null);
      setAccessMessage(ACCESS_REQUIRED_MESSAGE);
      return null;
    }

    setAccessLoading(true);
    setAccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/my-courses/${courseId}`, {
        headers: apiHeaders(token),
        signal,
      });

      if (response.status === 403) {
        setEnrollment(null);
        setAccessMessage(ACCESS_REQUIRED_MESSAGE);
        return null;
      }

      const payload = await readJsonResponse(response);
      setEnrollment(payload.data || null);
      return payload.data || null;
    } catch (error) {
      if (error.name !== 'AbortError') {
        setEnrollment(null);
        setAccessMessage(error.message || ACCESS_REQUIRED_MESSAGE);
      }

      return null;
    } finally {
      if (!signal?.aborted) {
        setAccessLoading(false);
      }
    }
  }, [courseId, isAuthenticated, token]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCourse = async () => {
      setCourseLoading(true);
      setCourseError('');

      try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
          headers: apiHeaders(),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCourse(payload.data || null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCourse(null);
          setCourseError('تعذر تحميل تفاصيل الدورة. تأكد من تشغيل Laravel API.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setCourseLoading(false);
        }
      }
    };

    if (isCourseIdValid) {
      fetchCourse();
    }

    return () => controller.abort();
  }, [courseId, isCourseIdValid]);

  useEffect(() => {
    if (authLoading || !courseId) {
      return undefined;
    }

    const controller = new AbortController();
    Promise.resolve().then(() => fetchEnrollment(controller.signal));

    return () => controller.abort();
  }, [authLoading, courseId, fetchEnrollment]);

  const handleEnroll = async () => {
    setNotice('');
    setAccessMessage('');

    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !token) {
      navigate('/signin', { state: { from: location } });
      return;
    }

    setEnrolling(true);

    try {
      const response = await fetch(`${API_BASE_URL}/enrollments`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify({ course_id: courseId }),
      });

      if (response.status === 409) {
        await fetchEnrollment();
        setNotice('أنت مشترك في هذه الدورة بالفعل.');
        return;
      }

      const payload = await readJsonResponse(response);
      setEnrollment(payload.data || null);
      setNotice('تم الاشتراك في الدورة بنجاح.');
    } catch (error) {
      setAccessMessage(error.message || 'تعذر إتمام الاشتراك الآن.');
    } finally {
      setEnrolling(false);
    }
  };

  if (!isCourseIdValid) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center px-4" style={{ paddingTop: '64px' }}>
        <div className="glass-card p-4 rounded-3 text-center" style={{ maxWidth: '520px' }}>
          <span className="material-symbols-outlined text-muted" style={{ fontSize: '56px' }}>error</span>
          <h2 className="h5 text-white mt-3" style={{ fontFamily: 'var(--font-sans)' }}>الدورة المطلوبة غير صحيحة</h2>
          <Link to="/courses" className="btn btn-primary-cta px-4 py-2 fw-bold">العودة إلى الكورسات</Link>
        </div>
      </div>
    );
  }

  if (courseLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '64px' }}>
        <div className="text-center">
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#75ff9e' }}>progress_activity</span>
          <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>جاري تحميل الدورة...</h5>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center px-4" style={{ paddingTop: '64px' }}>
        <div className="glass-card p-4 rounded-3 text-center" style={{ maxWidth: '520px' }}>
          <span className="material-symbols-outlined text-muted" style={{ fontSize: '56px' }}>cloud_off</span>
          <h2 className="h5 text-white mt-3" style={{ fontFamily: 'var(--font-sans)' }}>لم نتمكن من فتح الدورة</h2>
          <p className="text-muted">{courseError || 'الدورة غير متاحة حالياً.'}</p>
          <Link to="/courses" className="btn btn-primary-cta px-4 py-2 fw-bold">العودة إلى الكورسات</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px' }}>
      <main className="py-4 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="d-flex align-items-center gap-1 font-mono-data text-muted mb-4" style={{ fontSize: '11px', direction: 'rtl' }}>
          <Link to="/courses" className="text-decoration-none text-muted">الكورسات</Link>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
          <span style={{ color: '#75ff9e' }}>{course.title}</span>
        </div>

        {notice && (
          <div className="alert mb-4 border-0" role="status" style={{ backgroundColor: 'rgba(117,255,158,0.1)', color: '#75ff9e' }}>
            {notice}
          </div>
        )}

        <div className="row g-4">
          <div className="col-12 col-lg-8 d-flex flex-column gap-4">
            <div className="row g-3">
              <div className="col-12 col-xl-8">
                <section className="position-relative glass-card rounded-3 overflow-hidden h-100" style={{ minHeight: '380px', borderRadius: '12px' }}>
                  {canAccessCourse ? (
                    <CinemaVideoPlayer
                      innerRef={videoRef}
                      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                      courseId={String(course.id)}
                      lessonId="1_1"
                    />
                  ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4" style={{ minHeight: '380px' }}>
                      <span className="material-symbols-outlined mb-3" style={{ color: '#75ff9e', fontSize: '56px' }}>lock</span>
                      <h2 className="h5 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
                        {accessLoading ? 'جاري التحقق من الاشتراك...' : ACCESS_REQUIRED_MESSAGE}
                      </h2>
                      <p className="text-muted mb-4" style={{ maxWidth: '420px', lineHeight: 1.8 }}>
                        اشترك في الدورة لفتح المحاضرات، الملاحظات، الاختبارات، والمواد التعليمية.
                      </p>
                      <button
                        type="button"
                        onClick={handleEnroll}
                        disabled={enrolling || authLoading || accessLoading}
                        className="btn btn-primary-cta px-4 py-2 fw-bold d-flex align-items-center gap-2"
                        style={{ borderRadius: '8px', fontFamily: 'var(--font-sans)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>school</span>
                        {enrolling ? 'جاري الاشتراك...' : 'اشترك الآن'}
                      </button>
                      {accessMessage && !accessLoading && (
                        <p className="text-muted mt-3 mb-0" style={{ fontSize: '13px' }}>{accessMessage}</p>
                      )}
                    </div>
                  )}
                </section>
              </div>
              <div className="col-12 col-xl-4">
                {canAccessCourse ? (
                  <VideoNotesSidebar videoRef={videoRef} courseId={String(course.id)} lessonId="1_1" />
                ) : (
                  <div className="glass-card p-4 rounded-3 h-100 d-flex flex-column justify-content-center">
                    <img
                      src={courseImage(course)}
                      alt={course.title}
                      className="w-100 rounded-3 object-cover mb-3"
                      style={{ height: '180px' }}
                    />
                    <h3 className="h6 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>{course.title}</h3>
                    <p className="text-muted m-0" style={{ fontSize: '13px', lineHeight: 1.8 }}>{course.short_description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
              <div>
                <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>{course.title}</h1>
                <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', lineHeight: 1.8 }}>{course.short_description}</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                {canAccessCourse ? (
                  <>
                    <button onClick={() => setIsQuizOpen(true)} className="btn px-4 py-2 fw-bold interactive btn-primary-cta d-flex align-items-center gap-2" style={{ borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>quiz</span>
                      اختبر معلوماتك
                    </button>
                    <button className="btn px-4 py-2 fw-semibold" style={{ backgroundColor: '#75ff9e', color: '#003918', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)', boxShadow: '0 0 15px rgba(117,255,158,0.12)' }}>
                      متابعة التعلم
                    </button>
                  </>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling || authLoading} className="btn px-4 py-2 fw-semibold" style={{ backgroundColor: '#75ff9e', color: '#003918', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)', boxShadow: '0 0 15px rgba(117,255,158,0.12)' }}>
                    {enrolling ? 'جاري الاشتراك...' : 'اشترك الآن'}
                  </button>
                )}
                <button onClick={() => setIsBookmarked(!isBookmarked)} className="btn px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-white border" style={{ borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)', fontSize: '13px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isBookmarked ? '#75ff9e' : 'white', fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                  {isBookmarked ? 'محفوظ' : 'حفظ'}
                </button>
              </div>
            </div>

            <CourseQuiz isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />

            <div className="row g-4">
              <div className="col-12 col-md-8">
                <div className="glass-card p-4 rounded-3 h-100">
                  <h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#75ff9e', fontFamily: 'var(--font-sans)' }}>
                    <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '20px' }}>info</span> عن هذه الدورة
                  </h3>
                  <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.85, fontFamily: 'var(--font-sans)' }}>
                    {course.description}
                  </p>
                  <div className="pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h4 className="font-mono-data text-white text-uppercase mb-3" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>تفاصيل سريعة</h4>
                    <div className="row g-2">
                      {courseMeta.map((item) => (
                        <div key={item.icon} className="col-6 d-flex align-items-center gap-1 text-muted" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                          <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '14px' }}>{item.icon}</span> {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="glass-card p-4 rounded-3 text-center h-100 d-flex flex-column align-items-center justify-content-between">
                  <div className="rounded-circle border border-2 p-1 mb-3" style={{ width: '96px', height: '96px', borderColor: '#75ff9e' }}>
                    <img alt={course.instructor_name} className="w-100 h-100 object-cover rounded-circle" src={courseImage(course)} />
                  </div>
                  <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>{course.instructor_name}</h3>
                  <p className="font-mono-data text-uppercase my-2" style={{ color: '#75ff9e', fontSize: '9px' }}>مدرب الدورة</p>
                  <p className="text-muted mb-3" style={{ fontSize: '12px', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
                    يقدم محتوى عملياً يساعدك على تحويل مفاهيم التداول إلى خطوات قابلة للتطبيق.
                  </p>
                </div>
              </div>
            </div>

            {canAccessCourse && (
              <section className="glass-card p-4 rounded-3">
                <h3 className="h5 text-white fw-bold mb-3" style={{ fontFamily: 'var(--font-sans)' }}>المواد القابلة للتنزيل</h3>
                <div className="row g-3">
                  {[
                    { icon: 'picture_as_pdf', color: '#75ff9e', name: 'Course_Handbook.pdf', meta: 'ملف تدريبي أساسي' },
                    { icon: 'terminal', color: '#81cfff', name: 'Trading_Worksheet.xlsx', meta: 'نموذج متابعة عملي' },
                  ].map((resource) => (
                    <div key={resource.name} className="col-12 col-md-6">
                      <div className="p-3 rounded border d-flex align-items-center justify-content-between hover-glow" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-3">
                          <span className="material-symbols-outlined" style={{ color: resource.color, fontSize: '28px' }}>{resource.icon}</span>
                          <div>
                            <p className="m-0 text-white font-mono-data fw-semibold" style={{ fontSize: '12px' }}>{resource.name}</p>
                            <p className="m-0 text-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}>{resource.meta}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-muted">download</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="col-12 col-lg-4">
            {canAccessCourse ? (
              <CourseCurriculum />
            ) : (
              <div className="glass-card p-4 rounded-3 position-sticky" style={{ top: '88px' }}>
                <h3 className="h5 text-white fw-bold mb-3" style={{ fontFamily: 'var(--font-sans)' }}>ابدأ رحلتك</h3>
                <p className="text-muted" style={{ fontSize: '14px', lineHeight: 1.8 }}>
                  بعد الاشتراك ستظهر المحاضرات، الملاحظات، والاختبارات الخاصة بهذه الدورة.
                </p>
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling || authLoading}
                  className="btn btn-primary-cta w-100 py-2 fw-bold"
                  style={{ borderRadius: '8px', fontFamily: 'var(--font-sans)' }}
                >
                  {enrolling ? 'جاري الاشتراك...' : 'اشترك الآن'}
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
