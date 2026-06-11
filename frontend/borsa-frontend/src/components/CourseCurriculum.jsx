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
  activeLessonId = null,
  onLessonSelect,
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
        ) : (() => {
          // ── Build a flat, ordered list of ALL lessons across all sections.
          // This is used to determine sequential accessibility:
          // lesson[n] is accessible only when lesson[n-1] is completed.
          const allLessons = sections.flatMap((s) => s.lessons || []);

          return sections.map((section, index) => {
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
                      const isActive = lesson.id === activeLessonId;

                      // ── Sequential access logic ──
                      // A lesson is sequentially locked when the PREVIOUS lesson
                      // (in the flat allLessons order) has not been completed yet.
                      const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
                      const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
                      const isSequentiallyLocked = isEnrolled && prevLesson !== null && !prevLesson.completed;

                      // Final clickability: backend lock OR sequential lock prevents navigation
                      const isHardLocked = lesson.is_locked;
                      const canNavigate = !isHardLocked && !isSequentiallyLocked && isEnrolled && lesson.video_url;

                      // Icon + colour decisions
                      let iconName;
                      let iconColor;
                      if (isHardLocked) {
                        iconName = 'lock';
                        iconColor = '#64748b';
                      } else if (isSequentiallyLocked) {
                        iconName = 'lock_clock';
                        iconColor = '#94a3b8';
                      } else if (isActive) {
                        iconName = 'play_circle';
                        iconColor = '#75ff9e';
                      } else {
                        iconName = 'play_circle';
                        iconColor = '#00e676';
                      }

                      const sequentialTooltip = isSequentiallyLocked ? 'أكمل الدرس السابق أولاً' : undefined;

                      return (
                        <div
                          key={lesson.id}
                          className={`p-2 rounded font-mono-data lesson-item ${(isHardLocked || isSequentiallyLocked) ? 'locked' : 'current'}`}
                          style={{
                            cursor: canNavigate ? 'pointer' : 'default',
                            borderLeft: isActive ? '3px solid #75ff9e' : '3px solid transparent',
                            backgroundColor: isActive ? 'rgba(117,255,158,0.06)' : undefined,
                            transition: 'border-color 0.2s, background-color 0.2s',
                            opacity: isSequentiallyLocked && !isHardLocked ? 0.6 : 1,
                          }}
                          title={sequentialTooltip}
                          onClick={() => {
                            if (canNavigate) {
                              onLessonSelect?.(lesson);
                            }
                          }}
                          role={canNavigate ? 'button' : undefined}
                          tabIndex={canNavigate ? 0 : undefined}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && canNavigate) {
                              onLessonSelect?.(lesson);
                            }
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined" style={{ color: iconColor, fontSize: '18px' }}>
                                {iconName}
                              </span>
                              <div className="d-flex flex-column">
                                <span
                                  className={`lesson-title ${!isHardLocked && !isSequentiallyLocked ? 'fw-bold text-white' : ''}`}
                                  style={{ color: isActive ? '#75ff9e' : undefined }}
                                >
                                  {lesson.title}
                                </span>
                                {isSequentiallyLocked && (
                                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>أكمل الدرس السابق أولاً</span>
                                )}
                                {lesson.is_preview && !isEnrolled && (
                                  <span style={{ color: '#81cfff', fontSize: '10px' }}>معاينة مجانية</span>
                                )}
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                              {isEnrolled && !isHardLocked && !isSequentiallyLocked && (
                                isUpdating ? (
                                  <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ width: '14px', height: '14px', color: '#75ff9e' }} />
                                ) : lesson.completed ? (
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#75ff9e' }} title="مكتمل">check_circle</span>
                                ) : null
                              )}
                              <span className="lesson-duration">{formatDuration(lesson.duration_minutes)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          });
        })()}
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
