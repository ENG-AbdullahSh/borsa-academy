import { useMemo, useState } from 'react';
import CertificateModal from './CertificateModal';

function formatDuration(minutes) {
  const value = Number(minutes || 0);

  if (value < 60) {
    return `${value} دقيقة`;
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${hours} س ${remaining} د` : `${hours} ساعة`;
}

export default function CourseCurriculum({
  sections = [],
  isEnrolled = false,
  loading = false,
  error = '',
  progressPercent = 0,
}) {
  const [expandedSections, setExpandedSections] = useState({});
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const stats = useMemo(() => {
    const totalLessons = sections.reduce((total, section) => total + (section.lessons?.length || 0), 0);
    const previewLessons = sections.reduce(
      (total, section) => total + (section.lessons || []).filter((lesson) => lesson.is_preview).length,
      0,
    );

    return {
      totalSections: sections.length,
      totalLessons,
      previewLessons,
      progress: Math.min(Math.max(Number(progressPercent || 0), 0), 100),
    };
  }, [progressPercent, sections]);

  const toggleSection = (id) => {
    setExpandedSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const renderIcon = (lesson) => {
    if (isEnrolled || !lesson.is_locked) {
      return (
        <span className="material-symbols-outlined" style={{ color: '#00e676', fontSize: '18px' }}>
          play_circle
        </span>
      );
    }

    return <span className="material-symbols-outlined text-muted" style={{ fontSize: '18px' }}>lock</span>;
  };

  return (
    <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100" style={{ position: 'sticky', top: '88px', maxHeight: 'calc(100vh - 120px)' }}>
      <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>منهج الدورة</h3>
          {!isEnrolled && (
            <span className="px-2 py-1 rounded font-mono-data" style={{ color: '#ffb4ab', backgroundColor: 'rgba(244,67,54,0.1)', fontSize: '10px' }}>
              مقفل
            </span>
          )}
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
              transition: 'width 0.5s ease',
              borderRadius: '99px',
            }}
          />
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 custom-scrollbar">
        {loading ? (
          <div className="py-5 text-center">
            <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '42px' }}>progress_activity</span>
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
                  ) : (section.lessons || []).map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`p-2 rounded d-flex align-items-center justify-content-between font-mono-data lesson-item ${lesson.is_locked ? 'locked' : 'current'}`}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {renderIcon(lesson)}
                        <div className="d-flex flex-column">
                          <span className={`lesson-title ${!lesson.is_locked ? 'fw-bold text-white' : ''}`}>
                            {lesson.title}
                          </span>
                          {lesson.is_preview && !isEnrolled && (
                            <span style={{ color: '#81cfff', fontSize: '10px' }}>معاينة مجانية</span>
                          )}
                        </div>
                      </div>
                      <span className="lesson-duration">{formatDuration(lesson.duration_minutes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={() => setIsCertificateOpen(true)}
          disabled={!isEnrolled}
          className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold btn-primary-cta interactive"
          style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', borderRadius: '8px', opacity: isEnrolled ? 1 : 0.55 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
          الحصول على الشهادة
        </button>
      </div>

      <CertificateModal isOpen={isCertificateOpen} onClose={() => setIsCertificateOpen(false)} />
    </div>
  );
}
