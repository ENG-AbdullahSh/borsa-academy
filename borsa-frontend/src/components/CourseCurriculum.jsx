import React, { useState, useEffect } from 'react';

const MOCK_CURRICULUM = [
  {
    id: 'sec1',
    title: 'الوحدة ١: أساسيات تدفق الأوامر',
    lessons: [
      { id: 'l1', title: '١.١ تشريح الصفقة', duration: '١٢:٠٥', state: 'completed' },
      { id: 'l2', title: '١.٢ شرح عمق السوق', duration: '١٨:٤٠', state: 'completed' },
      { id: 'l3', title: '١.٣ ديناميكية السيولة', duration: '١٤:٢٠', state: 'current' },
    ],
  },
  {
    id: 'sec2',
    title: 'الوحدة ٢: استراتيجيات التنفيذ',
    lessons: [
      { id: 'l4', title: '٢.١ استراتيجية الفيد', duration: '٢٥:١٠', state: 'locked' },
      { id: 'l5', title: '٢.٢ دخول الزخم الانفجاري', duration: '٣٢:١٥', state: 'locked' },
      { id: 'l6', title: '٢.٣ إدارة الصفقات المتقدمة', duration: '٢٠:٠٠', state: 'locked' },
    ],
  },
  {
    id: 'sec3',
    title: 'الوحدة ٣: إدارة المخاطر',
    lessons: [
      { id: 'l7', title: '٣.١ تحديد وقف الخسارة', duration: '١٥:٥٠', state: 'locked' },
      { id: 'l8', title: '٣.٢ حساب حجم العقد', duration: '١٠:٣٠', state: 'locked' },
      { id: 'l9', title: '٣.٣ نفسية التداول', duration: '٢٢:١٥', state: 'locked' },
    ],
  },
];

export default function CourseCurriculum() {
  const [expandedSections, setExpandedSections] = useState({ sec1: true });
  const [progressWidth, setProgressWidth] = useState(0);
  
  // Calculate completion
  const totalLessons = MOCK_CURRICULUM.reduce((acc, curr) => acc + curr.lessons.length, 0);
  const completedLessons = MOCK_CURRICULUM.reduce((acc, curr) => acc + curr.lessons.filter(l => l.state === 'completed').length, 0);
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  useEffect(() => {
    // Animate progress bar on mount
    const timer = setTimeout(() => {
      setProgressWidth(progressPercent);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderIcon = (state) => {
    switch(state) {
      case 'completed':
        return <span className="material-symbols-outlined" style={{ color: '#00e676', fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
      case 'current':
        return (
          <div className="pulse-indicator-container">
            <div className="pulse-indicator"></div>
          </div>
        );
      case 'locked':
      default:
        return <span className="material-symbols-outlined text-muted" style={{ fontSize: '18px' }}>lock</span>;
    }
  };

  return (
    <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100" style={{ position: 'sticky', top: '88px', maxHeight: 'calc(100vh - 120px)' }}>
      {/* Progress Header */}
      <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <h3 className="h6 text-white fw-bold mb-3" style={{ fontFamily: 'var(--font-sans)' }}>منهج الكورس</h3>
        <div className="d-flex justify-content-between font-mono-data text-muted mb-2" style={{ fontSize: '12px' }}>
          <span>{MOCK_CURRICULUM.length} وحدات • {totalLessons} درس</span>
          <span style={{ color: '#00e676', fontWeight: 'bold' }}>{progressPercent}٪ مكتمل</span>
        </div>
        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${progressWidth}%`, 
              height: '100%', 
              backgroundColor: '#00e676', 
              boxShadow: '0 0 10px #00E676',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '99px'
            }} 
          />
        </div>
      </div>

      {/* Curriculum Accordion */}
      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 custom-scrollbar">
        {MOCK_CURRICULUM.map((section) => (
          <div key={section.id} className="accordion-section rounded border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <button 
              onClick={() => toggleSection(section.id)}
              className="w-100 btn p-3 border-0 bg-transparent text-start d-flex align-items-center justify-content-between text-white section-header-btn"
            >
              <span className="font-mono-data fw-semibold" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                {section.title}
              </span>
              <span 
                className="material-symbols-outlined text-muted transition-transform" 
                style={{ transform: expandedSections[section.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>
            
            <div 
              className={`section-content ${expandedSections[section.id] ? 'expanded' : ''}`}
            >
              <div className="px-2 pb-2 d-flex flex-column gap-1 border-top pt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {section.lessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className={`p-2 rounded d-flex align-items-center justify-content-between font-mono-data lesson-item ${lesson.state}`}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {renderIcon(lesson.state)}
                      <span className={`lesson-title ${lesson.state === 'current' ? 'fw-bold text-white' : ''}`}>
                        {lesson.title}
                      </span>
                    </div>
                    <span className="lesson-duration">{lesson.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer / Certificate Action */}
      <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold text-muted border border-secondary border-opacity-25 rounded interactive-btn" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>workspace_premium</span> الحصول على الشهادة
        </button>
      </div>
    </div>
  );
}
