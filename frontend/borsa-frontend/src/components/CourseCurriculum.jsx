import { useMemo, useState } from 'react';
import CertificateModal from './CertificateModal';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

function formatDuration(minutes) {
  const value = Number(minutes || 0);

  if (value < 60) {
    return `${value} دقيقة`;
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${hours} س ${remaining} د` : `${hours} ساعة`;
}

function progressErrorMessage(error) {
  if (error?.status === 403) {
    return 'يجب الاشتراك في الدورة أولاً.';
  }

  if (error?.status) {
    return 'فشل تحديث التقدم.';
  }

  return 'حدث خطأ غير متوقع.';
}

export default function CourseCurriculum({
  sections = [],
  isEnrolled = false,
  loading = false,
  error = '',
  progressPercent = 0,
  courseId,
  quizStatus = null,
  onStartQuiz,
  onLessonProgressChange,
}) {
  const { token } = useAuth();
  const [expandedSections, setExpandedSections] = useState({});
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [updatingLessonId, setUpdatingLessonId] = useState(null);
  const [progressError, setProgressError] = useState('');

  const stats = useMemo(() => {
    const totalLessons = sections.reduce((total, section) => total + (section.lessons?.length || 0), 0);
    const completedLessons = sections.reduce(
      (total, section) => total + (section.lessons || []).filter((lesson) => lesson.completed).length,
      0,
    );
    const previewLessons = sections.reduce(
      (total, section) => total + (section.lessons || []).filter((lesson) => lesson.is_preview).length,
      0,
    );

    return {
      totalSections: sections.length,
      totalLessons,
      completedLessons,
      previewLessons,
      progress: Math.min(Math.max(Number(progressPercent || 0), 0), 100),
    };
  }, [progressPercent, sections]);
  const certificateUnlocked = Boolean(
    isEnrolled
    && stats.progress === 100
    && quizStatus?.certificate_unlocked,
  );
  const certificateLockedByQuiz = Boolean(
    isEnrolled
    && stats.progress === 100
    && quizStatus?.has_active_quiz
    && !quizStatus?.quiz_passed,
  );

  const toggleSection = (id) => {
    setExpandedSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleLessonCompletion = async (lesson) => {
    if (!isEnrolled || lesson.is_locked || !token || updatingLessonId !== null) {
      return;
    }

    setUpdatingLessonId(lesson.id);
    setProgressError('');

    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lesson.id}/complete`, {
        method: lesson.completed ? 'DELETE' : 'POST',
        headers: apiHeaders(token),
      });
      const payload = await readJsonResponse(response);
      onLessonProgressChange?.(lesson.id, !lesson.completed, payload);
    } catch (requestError) {
      setProgressError(progressErrorMessage(requestError));
    } finally {
      setUpdatingLessonId(null);
    }
  };

  return (
    <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100" style={{ position: 'sticky', top: '88px', maxHeight: 'calc(100vh - 120px)' }}>
      <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>منهج الدورة</h3>
          {stats.progress === 100 ? (
            <span className="px-2 py-1 rounded" style={{ color: '#75ff9e', backgroundColor: 'rgba(0,230,118,0.1)', fontSize: '10px' }}>
              🏆 تم إكمال الدورة
            </span>
          ) : !isEnrolled ? (
            <span className="px-2 py-1 rounded font-mono-data" style={{ color: '#ffb4ab', backgroundColor: 'rgba(244,67,54,0.1)', fontSize: '10px' }}>
              مقفل
            </span>
          ) : null}
        </div>
        <div className="d-flex justify-content-between font-mono-data text-muted mb-2" style={{ fontSize: '12px' }}>
          <span>{stats.totalSections} وحدات • {stats.totalLessons} درس</span>
          <span style={{ color: isEnrolled ? '#00e676' : '#81cfff', fontWeight: 'bold' }}>
            {isEnrolled ? `${stats.progress}% مكتمل` : `${stats.previewLessons} معاينات`}
          </span>
        </div>
        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${isEnrolled ? stats.progress : 0}%`,
              height: '100%',
              backgroundColor: '#00e676',
              boxShadow: '0 0 10px #00E676',
              transition: 'width 0.35s ease',
              borderRadius: '99px',
            }}
          />
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 custom-scrollbar">
        {progressError && (
          <div className="rounded px-3 py-2" role="alert" style={{ color: '#fecaca', backgroundColor: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', fontSize: '12px' }}>
            {progressError}
          </div>
        )}

        {loading ? (
          <div className="py-5 text-center">
            <span className="spinner-border spinner-border-sm" style={{ color: '#75ff9e' }} aria-hidden="true" />
            <p className="text-muted mt-3 mb-0">جاري تحميل المنهج...</p>
          </div>
        ) : error ? (
          <div className="py-5 text-center">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '42px' }}>cloud_off</span>
            <p className="text-muted mt-3 mb-0">{error}</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="py-5 text-center">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '42px' }}>playlist_add</span>
            <p className="text-muted mt-3 mb-0">لم يتم إضافة دروس لهذه الدورة بعد.</p>
          </div>
        ) : sections.map((section, index) => {
          const isExpanded = expandedSections[section.id] ?? index === 0;

          return (
            <div key={section.id} className="accordion-section rounded border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-100 btn p-3 border-0 bg-transparent text-start d-flex align-items-center justify-content-between text-white section-header-btn"
              >
                <span className="fw-semibold" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                  {section.title}
                </span>
                <span
                  className="material-symbols-outlined text-muted transition-transform"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
              </button>

              <div className={`section-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="px-2 pb-2 d-flex flex-column gap-1 border-top pt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {(section.lessons || []).length === 0 ? (
                    <div className="p-2 text-muted" style={{ fontSize: '12px' }}>لا توجد دروس داخل هذا القسم.</div>
                  ) : (section.lessons || []).map((lesson) => {
                    const isUpdating = updatingLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        className={`p-2 rounded font-mono-data lesson-item ${lesson.is_locked ? 'locked' : 'current'}`}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined" style={{ color: lesson.is_locked ? '#64748b' : '#00e676', fontSize: '18px' }}>
                              {lesson.is_locked ? 'lock' : 'play_circle'}
                            </span>
                            <div className="d-flex flex-column">
                              <span className={`lesson-title ${!lesson.is_locked ? 'fw-bold text-white' : ''}`}>
                                {lesson.title}
                              </span>
                              {lesson.is_preview && !isEnrolled && (
                                <span style={{ color: '#81cfff', fontSize: '10px' }}>معاينة مجانية</span>
                              )}
                            </div>
                          </div>
                          <span className="lesson-duration flex-shrink-0">{formatDuration(lesson.duration_minutes)}</span>
                        </div>

                        {isEnrolled && !lesson.is_locked && (
                          <button
                            type="button"
                            onClick={() => toggleLessonCompletion(lesson)}
                            disabled={updatingLessonId !== null}
                            className="btn border-0 bg-transparent p-0 mt-2 d-flex align-items-center gap-2"
                            style={{ color: lesson.completed ? '#75ff9e' : '#94a3b8', fontSize: '12px', fontFamily: 'var(--font-sans)' }}
                            aria-pressed={Boolean(lesson.completed)}
                          >
                            {isUpdating ? (
                              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                            ) : (
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                {lesson.completed ? 'check_box' : 'check_box_outline_blank'}
                              </span>
                            )}
                            {lesson.completed ? 'مكتمل' : 'تم الإنجاز'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {certificateLockedByQuiz && (
          <div
            className="rounded-3 px-3 py-2 mb-2 text-center"
            style={{ color: '#ffd54f', background: 'rgba(255,213,79,0.08)', border: '1px solid rgba(255,213,79,0.2)', fontSize: '12px' }}
          >
            الشهادة مقفلة حتى اجتياز الاختبار
          </div>
        )}
        {certificateLockedByQuiz && quizStatus?.quiz_ready && (
          <button
            type="button"
            onClick={onStartQuiz}
            className="btn btn-secondary-cta w-100 py-2 mb-2 fw-semibold"
          >
            ابدأ الاختبار
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsCertificateOpen(true)}
          disabled={!certificateUnlocked}
          className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold btn-primary-cta interactive"
          style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', borderRadius: '8px', opacity: certificateUnlocked ? 1 : 0.55 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
          الحصول على الشهادة
        </button>
      </div>

      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        courseId={courseId}
      />
    </div>
  );
}
