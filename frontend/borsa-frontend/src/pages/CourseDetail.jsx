import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import CinemaVideoPlayer from '../components/CinemaVideoPlayer';
import CourseCurriculum from '../components/CourseCurriculum';
import VideoNotesSidebar from '../components/VideoNotesSidebar';
import CourseQuiz from '../components/CourseQuiz';
import LessonPdfViewer from '../components/LessonPdfViewer';
import CourseReviews from '../components/CourseReviews';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { courseImage, levelLabel } from '../utils/courseDisplay';

const ACCESS_REQUIRED_MESSAGE = 'يجب الاشتراك في الدورة أولاً';
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const { token, isAuthenticated, loading: authLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [curriculumError, setCurriculumError] = useState('');
  const [accessMessage, setAccessMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [curriculumRefreshKey, setCurriculumRefreshKey] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizLesson, setQuizLesson] = useState(null);
  const [quizStatus, setQuizStatus] = useState(null);
  const [quizStatusLoading, setQuizStatusLoading] = useState(false);
  // Tracks which lesson the video player is currently showing
  const [activeLesson, setActiveLesson] = useState(null);
  // Active tab below video player
  const [activeTab, setActiveTab] = useState('about');

  const courseId = Number(id);
  const isCourseIdValid = Number.isFinite(courseId) && courseId > 0;
  const canAccessCourse = Boolean(enrollment) || Boolean(curriculum?.can_access_full_curriculum);
  const sections = useMemo(() => curriculum?.sections || [], [curriculum]);
  const progressPercentage = Number(enrollment?.progress ?? curriculum?.progress_percentage ?? 0);

  const courseMeta = useMemo(() => {
    if (!course) return [];

    return [
      { icon: 'signal_cellular_alt', label: levelLabel(course.level) },
      { icon: 'schedule', label: `${Number(course.duration_hours || 0)} ساعة` },
      { icon: 'sell', label: Number(course.price || 0) > 0 ? `$${Number(course.price).toFixed(2)}` : 'مجاني' },
      { icon: 'category', label: course.category || 'تداول' },
    ];
  }, [course]);

  // Flat ordered list of all playable lessons (used for auto-advance)
  const allPlayableLessons = useMemo(() =>
    sections.flatMap((section) => section.lessons || []).filter((l) => !l.is_locked && l.video_url),
  [sections]);

  const firstPlayableLesson = useMemo(() => {
    if (!canAccessCourse) return null;
    return allPlayableLessons[0] || null;
  }, [canAccessCourse, allPlayableLessons]);

  // Resolved lesson shown in the player — falls back to first playable
  const currentLesson = activeLesson || firstPlayableLesson;

  // Prev/Next lesson navigation
  const currentLessonIndex = useMemo(() =>
    currentLesson ? allPlayableLessons.findIndex((l) => l.id === currentLesson.id) : -1,
  [currentLesson, allPlayableLessons]);

  const prevLesson = currentLessonIndex > 0 ? allPlayableLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allPlayableLessons.length - 1
    ? allPlayableLessons[currentLessonIndex + 1]
    : null;

  // Total lessons count across all sections
  const totalLessonsCount = useMemo(() =>
    sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0),
  [sections]);

  const completedLessonsCount = useMemo(() =>
    sections.reduce((sum, s) => sum + (s.lessons?.filter((l) => l.completed).length || 0), 0),
  [sections]);

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
      let enrollmentData = payload.data || null;

      if (enrollmentData) {
        try {
          const progressResponse = await fetch(`${API_BASE_URL}/my-courses/${courseId}/progress`, {
            headers: apiHeaders(token),
            signal,
          });
          const progressPayload = await readJsonResponse(progressResponse);

          enrollmentData = {
            ...enrollmentData,
            progress: progressPayload.progress_percentage ?? enrollmentData.progress,
            completed: progressPayload.course_completed ?? enrollmentData.completed,
          };
        } catch (progressError) {
          if (progressError.name === 'AbortError') {
            throw progressError;
          }
        }
      }

      setEnrollment(enrollmentData);
      return enrollmentData;
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

  const fetchQuizStatus = useCallback(async (signal) => {
    if (!isAuthenticated || !token || !courseId || !enrollment) {
      setQuizStatus(null);
      return null;
    }

    setQuizStatusLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/my-courses/${courseId}/quiz-status`, {
        headers: apiHeaders(token),
        signal,
      });
      const payload = await readJsonResponse(response);
      const nextStatus = payload.data || null;
      setQuizStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      if (error.name !== 'AbortError') {
        setQuizStatus(enrollment.certificate_status || null);
      }

      return null;
    } finally {
      if (!signal?.aborted) setQuizStatusLoading(false);
    }
  }, [courseId, enrollment, isAuthenticated, token]);

  useEffect(() => {
    if (!isCourseIdValid) {
      return undefined;
    }

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

    Promise.resolve().then(fetchCourse);

    return () => controller.abort();
  }, [courseId, isCourseIdValid]);

  useEffect(() => {
    if (authLoading || !isCourseIdValid) {
      return undefined;
    }

    const controller = new AbortController();
    Promise.resolve().then(() => fetchEnrollment(controller.signal));

    return () => controller.abort();
  }, [authLoading, fetchEnrollment, isCourseIdValid]);

  useEffect(() => {
    if (authLoading || !enrollment) return undefined;

    const controller = new AbortController();
    Promise.resolve().then(() => fetchQuizStatus(controller.signal));
    return () => controller.abort();
  }, [authLoading, enrollment, fetchQuizStatus, progressPercentage]);

  useEffect(() => {
    if (authLoading || !isCourseIdValid) {
      return undefined;
    }

    const controller = new AbortController();

    const fetchCurriculum = async () => {
      setCurriculumLoading(true);
      setCurriculumError('');

      try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/curriculum`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        setCurriculum(payload.data || null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCurriculum(null);
          setCurriculumError('تعذر تحميل منهج الدورة.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setCurriculumLoading(false);
        }
      }
    };

    Promise.resolve().then(fetchCurriculum);

    return () => controller.abort();
  }, [authLoading, courseId, curriculumRefreshKey, isCourseIdValid, token]);

  const handleEnroll = async () => {
    setNotice('');
    setAccessMessage('');

    if (authLoading) return;

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
        setCurriculumRefreshKey((current) => current + 1);
        setNotice('أنت مشترك في هذه الدورة بالفعل.');
        return;
      }

      const payload = await readJsonResponse(response);
      setEnrollment(payload.data || null);
      setCurriculumRefreshKey((current) => current + 1);
      setNotice('تم الاشتراك في الدورة بنجاح.');
    } catch (error) {
      setAccessMessage(error.message || 'تعذر إتمام الاشتراك الآن.');
    } finally {
      setEnrolling(false);
    }
  };

  // Switch the player to a specific lesson (called by curriculum sidebar click)
  const handleLessonSelect = useCallback((lesson) => {
    if (!lesson?.video_url) return;
    setActiveLesson(lesson);
  }, []);

  const handleLessonProgressChange = useCallback((lessonId, completed, progress) => {
    const nextLessonPatch = {
      video_completed: progress.video_completed ?? completed,
      completed: progress.lesson_completed ?? completed,
      quiz_status: progress.lesson_quiz_status,
    };

    setCurriculum((current) => {
      if (!current) return current;

      return {
        ...current,
        progress_percentage: progress.progress_percentage,
        course_completed: progress.course_completed,
        sections: (current.sections || []).map((section) => ({
          ...section,
          certificate_status: (progress.section_statuses || []).find((status) => status.section_id === section.id)
            || section.certificate_status,
          completed: (progress.section_statuses || []).find((status) => status.section_id === section.id)?.section_completed
            ?? section.completed,
          lessons: (section.lessons || []).map((lesson) => (
            lesson.id === lessonId ? { ...lesson, ...nextLessonPatch } : lesson
          )),
        })),
      };
    });

    setActiveLesson((current) => (
      current?.id === lessonId ? { ...current, ...nextLessonPatch } : current
    ));

    setEnrollment((current) => current ? {
      ...current,
      progress: progress.progress_percentage,
      completed: progress.course_completed,
      certificate_status: progress.certificate_status,
    } : current);
    setQuizStatus(progress.certificate_status || null);
  }, []);

  // Called by CinemaVideoPlayer when the video reaches the end
  const handleVideoEnded = useCallback(async () => {
    if (!currentLesson || !token || !isAuthenticated) return;

    // 1. Auto-mark as complete if not already
    if (!currentLesson.completed) {
      try {
        const response = await fetch(`${API_BASE_URL}/lessons/${currentLesson.id}/complete`, {
          method: 'POST',
          headers: apiHeaders(token),
        });
        const payload = await readJsonResponse(response);
        handleLessonProgressChange(currentLesson.id, true, payload);
        if (payload.lesson_quiz_status?.can_take_quiz) {
          setQuizLesson({ ...currentLesson, video_completed: true, quiz_status: payload.lesson_quiz_status });
          setIsQuizOpen(true);
        } else if (!payload.lesson_quiz_status?.quiz_passed) {
          setNotice(payload.lesson_quiz_status?.locked_message || 'يجب اجتياز اختبار الدرس قبل فتح الدرس التالي.');
        }
      } catch (err) {
        console.warn('⚠️ Auto-complete failed:', err);
      }
    }

    return;

    // 2. Auto-advance to the next lesson
    const currentIndex = allPlayableLessons.findIndex((l) => l.id === currentLesson.id);
    const nextLesson = allPlayableLessons[currentIndex + 1] || null;
    if (nextLesson) {
      setActiveLesson(nextLesson);
    }
  }, [currentLesson, token, isAuthenticated, allPlayableLessons, handleLessonProgressChange]);

  const handleQuizPassed = useCallback((payload) => {
    if (payload.lesson_id) {
      handleLessonProgressChange(payload.lesson_id, true, {
        ...payload,
        video_completed: true,
        lesson_completed: true,
        lesson_quiz_status: {
          ...(quizLesson?.quiz_status || {}),
          lesson_id: payload.lesson_id,
          section_id: payload.section_id,
          video_completed: true,
          lesson_completed: true,
          gate_passed: true,
          quiz_passed: true,
          can_take_quiz: false,
          passed_attempt: payload.attempt,
          latest_attempt: payload.attempt,
          locked_reason: null,
          locked_message: null,
        },
        });
      const currentIndex = allPlayableLessons.findIndex((lesson) => lesson.id === payload.lesson_id);
      const nextLesson = allPlayableLessons[currentIndex + 1] || null;
      if (nextLesson) {
        setActiveLesson(nextLesson);
      }
      setNotice('تم اجتياز اختبار الدرس. يمكنك المتابعة إلى الدرس التالي.');
      return;
    }

    setQuizStatus((current) => ({
      ...(current || {}),
      quiz_passed: true,
      can_take_quiz: false,
      certificate_unlocked: true,
      certificate_id: payload.certificate_id,
      locked_reason: null,
      locked_message: null,
      passed_attempt: payload.attempt,
      latest_attempt: payload.attempt,
    }));
  }, [allPlayableLessons, handleLessonProgressChange, quizLesson]);

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
    <div className="min-vh-100" style={{ paddingTop: '64px', direction: 'rtl' }}>
      <main className="py-4 px-3 px-lg-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── Breadcrumb ── */}
        <div className="d-flex align-items-center gap-1 font-mono-data text-muted mb-3" style={{ fontSize: '11px' }}>
          <Link to="/courses" className="text-decoration-none text-muted" style={{ transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.target.style.color = '#75ff9e')}
            onMouseLeave={(e) => (e.target.style.color = '')}>
            الكورسات
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
          <span style={{ color: '#75ff9e' }} className="text-truncate" title={course.title}>{course.title}</span>
        </div>

        {/* ── Notice banner ── */}
        {notice && (
          <div className="alert mb-3 border-0 d-flex align-items-center gap-2" role="status"
            style={{ backgroundColor: 'rgba(117,255,158,0.1)', color: '#75ff9e', borderRadius: '8px', borderRight: '3px solid #75ff9e' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
            {notice}
          </div>
        )}

        {/* ── Enhanced Progress Bar ── */}
        {canAccessCourse && (
          <section className="mb-4 glass-card p-3 rounded-3" aria-label="تقدم الدورة"
            style={{ borderRight: progressPercentage >= 100 ? '3px solid #75ff9e' : '3px solid rgba(117,255,158,0.3)', transition: 'border-color 0.4s' }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '18px' }}>
                  {progressPercentage >= 100 ? 'emoji_events' : 'school'}
                </span>
                <span className="text-white fw-semibold" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                  {progressPercentage >= 100 ? '🏆 تم إكمال الدورة بنجاح!' : 'تقدمك في الدورة'}
                </span>
              </div>
              <div className="d-flex align-items-center gap-3">
                {totalLessonsCount > 0 && (
                  <span className="font-mono-data" style={{ color: '#bacbb9', fontSize: '12px' }}>
                    {completedLessonsCount} / {totalLessonsCount} درس
                  </span>
                )}
                <span className="font-mono-data fw-bold" style={{ color: '#75ff9e', fontSize: '16px' }}>
                  {progressPercentage}%
                </span>
              </div>
            </div>
            <div role="progressbar" aria-valuenow={progressPercentage} aria-valuemin="0" aria-valuemax="100"
              style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercentage}%`, height: '100%', borderRadius: '999px',
                background: progressPercentage >= 100
                  ? 'linear-gradient(90deg, #00ff7f, #75ff9e)'
                  : 'linear-gradient(90deg, #3ddc84, #75ff9e)',
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 8px rgba(117,255,158,0.5)',
              }} />
            </div>
          </section>
        )}

        {/* ── Main Layout: Video + Sidebar ── */}
        <div className="row g-4">

          {/* ── LEFT COLUMN: Video Player + Tabs ── */}
          <div className="col-12 col-lg-8 col-xl-9 d-flex flex-column gap-3">

            {/* Lesson Header */}
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                {canAccessCourse && currentLesson && (
                  <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#75ff9e', fontSize: '20px' }}>play_circle</span>
                )}
                <div style={{ minWidth: 0 }}>
                  <h1 className="fw-bold text-white mb-0 text-truncate"
                    style={{ fontSize: 'clamp(16px, 2.5vw, 24px)', fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>
                    {canAccessCourse && currentLesson ? currentLesson.title : course.title}
                  </h1>
                  {canAccessCourse && currentLesson && (
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                      {course.title}
                      {currentLessonIndex >= 0 && (
                        <span className="ms-2 font-mono-data" style={{ color: '#75ff9e', fontSize: '11px' }}>
                          · الدرس {currentLessonIndex + 1} من {allPlayableLessons.length}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Prev / Next + Action Buttons */}
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                {canAccessCourse && (
                  <>
                    <button
                      onClick={() => prevLesson && setActiveLesson(prevLesson)}
                      disabled={!prevLesson}
                      title="الدرس السابق"
                      className="btn d-flex align-items-center gap-1"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)', color: prevLesson ? '#bacbb9' : '#3a4a3a',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                        fontSize: '12px', fontFamily: 'var(--font-sans)', padding: '6px 12px',
                        transition: 'all 0.2s',
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                      <span className="d-none d-sm-inline">السابق</span>
                    </button>
                    <button
                      onClick={() => nextLesson && setActiveLesson(nextLesson)}
                      disabled={!nextLesson}
                      title="الدرس التالي"
                      className="btn d-flex align-items-center gap-1"
                      style={{
                        backgroundColor: nextLesson ? 'rgba(117,255,158,0.12)' : 'rgba(255,255,255,0.04)',
                        color: nextLesson ? '#75ff9e' : '#3a4a3a',
                        border: `1px solid ${nextLesson ? 'rgba(117,255,158,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-sans)', padding: '6px 12px',
                        transition: 'all 0.2s',
                      }}>
                      <span className="d-none d-sm-inline">التالي</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  title={isBookmarked ? 'إلغاء الحفظ' : 'حفظ الكورس'}
                  className="btn d-flex align-items-center gap-1"
                  style={{
                    backgroundColor: isBookmarked ? 'rgba(117,255,158,0.1)' : 'rgba(255,255,255,0.04)',
                    color: isBookmarked ? '#75ff9e' : '#bacbb9',
                    border: `1px solid ${isBookmarked ? 'rgba(117,255,158,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px', fontSize: '12px', padding: '6px 12px', transition: 'all 0.2s',
                  }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize: '16px', fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>
                    bookmark
                  </span>
                  <span className="d-none d-sm-inline">{isBookmarked ? 'محفوظ' : 'حفظ'}</span>
                </button>
              </div>
            </div>

            {/* ── Video Player ── */}
            <section className="glass-card rounded-3 overflow-hidden position-relative"
              style={{ borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
              {canAccessCourse ? (
                <CinemaVideoPlayer
                  key={currentLesson?.id ?? 'default'}
                  innerRef={videoRef}
                  src={currentLesson?.video_url || SAMPLE_VIDEO}
                  courseId={String(course.id)}
                  lessonId={String(currentLesson?.id || '1_1')}
                  onVideoEnded={handleVideoEnded}
                />
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-center p-5"
                  style={{ minHeight: '380px', background: 'linear-gradient(135deg, rgba(0,20,10,0.8), rgba(0,40,20,0.6))' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', marginBottom: '20px',
                    background: 'rgba(117,255,158,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(117,255,158,0.3)',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '40px' }}>lock</span>
                  </div>
                  <h2 className="h5 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
                    {accessLoading ? 'جاري التحقق من الاشتراك...' : ACCESS_REQUIRED_MESSAGE}
                  </h2>
                  <p className="text-muted mb-4" style={{ maxWidth: '380px', lineHeight: 1.8, fontSize: '14px' }}>
                    اشترك في الدورة لفتح المحاضرات، الملاحظات، الاختبارات، والمواد التعليمية.
                  </p>
                  <button
                    type="button" onClick={handleEnroll}
                    disabled={enrolling || authLoading || accessLoading}
                    className="btn btn-primary-cta px-5 py-2 fw-bold d-flex align-items-center gap-2"
                    style={{ borderRadius: '10px', fontFamily: 'var(--font-sans)', fontSize: '15px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
                    {enrolling ? 'جاري الاشتراك...' : 'اشترك الآن مجاناً'}
                  </button>
                  {accessMessage && !accessLoading && (
                    <p className="text-muted mt-3 mb-0" style={{ fontSize: '13px' }}>{accessMessage}</p>
                  )}
                </div>
              )}
            </section>

            {/* ── CourseQuiz Modal ── */}
            <CourseQuiz
              isOpen={isQuizOpen}
              onClose={() => setIsQuizOpen(false)}
              courseId={quizLesson ? null : courseId}
              lessonId={quizLesson?.id || null}
              lessonTitle={quizLesson?.title || ''}
              onPassed={handleQuizPassed}
            />

            {/* ── Quiz / Continue Buttons ── */}
            {canAccessCourse && (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {progressPercentage >= 100 && quizStatus?.has_active_quiz && (
                  <button
                    onClick={() => { setQuizLesson(null); setIsQuizOpen(true); }}
                    disabled={quizStatusLoading || quizStatus.quiz_passed || !quizStatus.quiz_ready}
                    className="btn px-4 py-2 fw-bold d-flex align-items-center gap-2"
                    style={{
                      background: quizStatus.quiz_passed
                        ? 'rgba(117,255,158,0.15)' : 'linear-gradient(135deg, #00cc55, #75ff9e)',
                      color: quizStatus.quiz_passed ? '#75ff9e' : '#003918',
                      border: quizStatus.quiz_passed ? '1px solid rgba(117,255,158,0.3)' : 'none',
                      borderRadius: '10px', fontSize: '13px', fontFamily: 'var(--font-sans)',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {quizStatus.quiz_passed ? 'verified' : 'quiz'}
                    </span>
                    {quizStatus.quiz_passed ? 'تم اجتياز الاختبار ✓' : 'ابدأ الاختبار النهائي'}
                  </button>
                )}
                <button
                  onClick={() => nextLesson && setActiveLesson(nextLesson)}
                  disabled={!nextLesson}
                  className="btn px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                  style={{
                    backgroundColor: '#75ff9e', color: '#003918',
                    borderRadius: '10px', fontSize: '13px', fontFamily: 'var(--font-sans)',
                    boxShadow: nextLesson ? '0 0 20px rgba(117,255,158,0.25)' : 'none',
                    opacity: nextLesson ? 1 : 0.5,
                    transition: 'all 0.2s',
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>play_arrow</span>
                  متابعة التعلم
                </button>
              </div>
            )}

            {/* ── Tabs ── */}
            <div>
              {/* Tab Headers */}
              <div className="d-flex gap-0 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                {[
                  { key: 'about', icon: 'info', label: 'عن الدورة' },
                  ...(canAccessCourse ? [{ key: 'notes', icon: 'sticky_note_2', label: 'الملاحظات' }] : []),
                  { key: 'instructor', icon: 'person', label: 'المدرب' },
                  { key: 'reviews', icon: 'star', label: 'التقييمات' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="btn d-flex align-items-center gap-1 px-3 py-2"
                    style={{
                      borderRadius: '0', fontSize: '13px', fontFamily: 'var(--font-sans)',
                      color: activeTab === tab.key ? '#75ff9e' : '#7a8a7a',
                      borderBottom: activeTab === tab.key ? '2px solid #75ff9e' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      transition: 'all 0.2s',
                      marginBottom: '-1px',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{tab.icon}</span>
                    <span className="d-none d-sm-inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="pt-4">

                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="glass-card p-4 rounded-3" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2"
                      style={{ color: '#75ff9e', fontFamily: 'var(--font-sans)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span>
                      عن هذه الدورة
                    </h3>
                    <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: 2, fontFamily: 'var(--font-sans)' }}>
                      {course.description}
                    </p>
                    <div className="pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <h4 className="font-mono-data text-uppercase mb-3" style={{ color: '#75ff9e', fontSize: '10px', letterSpacing: '0.1em' }}>
                        تفاصيل سريعة
                      </h4>
                      <div className="row g-3">
                        {courseMeta.map((item) => (
                          <div key={item.icon} className="col-6 col-sm-3">
                            <div className="d-flex align-items-center gap-2 p-2 rounded-2"
                              style={{ backgroundColor: 'rgba(117,255,158,0.06)', border: '1px solid rgba(117,255,158,0.1)' }}>
                              <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '18px' }}>{item.icon}</span>
                              <span className="text-muted" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>{item.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {canAccessCourse && currentLesson?.pdf_url && (
                      <div className="mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <LessonPdfViewer lesson={currentLesson} />
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && canAccessCourse && (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <VideoNotesSidebar
                      videoRef={videoRef}
                      courseId={String(course.id)}
                      lessonId={String(currentLesson?.id || '1_1')}
                    />
                  </div>
                )}

                {/* Instructor Tab */}
                {activeTab === 'instructor' && (
                  <div className="glass-card p-4 rounded-3" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="d-flex align-items-center gap-4 flex-wrap">
                      <div className="flex-shrink-0">
                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '100px', height: '100px', border: '2px solid #75ff9e', background: 'rgba(117,255,158,0.08)', overflow: 'hidden' }}>
                          <img
                            alt={course.instructor_name}
                            src={courseImage(course)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="h5 text-white fw-bold mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                          {course.instructor_name}
                        </h3>
                        <p className="font-mono-data text-uppercase mb-2" style={{ color: '#75ff9e', fontSize: '10px', letterSpacing: '0.1em' }}>
                          {course.instructor?.specialization || 'مدرب الدورة'}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: '13px', lineHeight: 1.8, fontFamily: 'var(--font-sans)', maxWidth: '500px' }}>
                          {course.instructor?.bio || 'يقدم محتوى عملياً يساعدك على تحويل مفاهيم التداول إلى خطوات قابلة للتطبيق في الأسواق المالية.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <CourseReviews
                      courseId={courseId}
                      enrollment={enrollment}
                      canReview={canAccessCourse}
                    />
                  </div>
                )}
              </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          </div>

          {/* ── RIGHT COLUMN: Curriculum Sidebar (Sticky) ── */}
          <aside className="col-12 col-lg-4 col-xl-3">
            <div style={{ position: 'sticky', top: '80px' }}>
              <CourseCurriculum
                sections={sections}
                isEnrolled={canAccessCourse}
                loading={curriculumLoading}
                error={curriculumError}
                progressPercent={progressPercentage}
                courseId={courseId}
                quizStatus={quizStatus}
                onStartQuiz={(lesson) => {
                  setQuizLesson(lesson || null);
                  setIsQuizOpen(true);
                }}
                onLessonProgressChange={handleLessonProgressChange}
                activeLessonId={currentLesson?.id || null}
                onLessonSelect={handleLessonSelect}
              />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
