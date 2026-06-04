import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import CinemaVideoPlayer from '../components/CinemaVideoPlayer';
import CourseCurriculum from '../components/CourseCurriculum';
import VideoNotesSidebar from '../components/VideoNotesSidebar';
import CourseQuiz from '../components/CourseQuiz';

export default function CourseDetail() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const videoRef = useRef(null);

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px' }}>
      <main className="py-4 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div className="d-flex align-items-center gap-1 font-mono-data text-muted mb-4" style={{ fontSize: '11px', direction: 'rtl' }}>
          <Link to="/courses" className="text-decoration-none text-muted">الكورسات</Link>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
          <span style={{ color: '#75ff9e' }}>ماستركلاس السكالبينج المتقدم</span>
        </div>

        <div className="row g-4">

          {/* Left / Main */}
          <div className="col-12 col-lg-8 d-flex flex-column gap-4">

            {/* Video & Notes Row */}
            <div className="row g-3">
              <div className="col-12 col-xl-8">
                {/* Video Player */}
                <section className="position-relative glass-card rounded-3 overflow-hidden h-100" style={{ minHeight: '380px', borderRadius: '12px' }}>
                  <CinemaVideoPlayer 
                    innerRef={videoRef}
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" 
                    courseId="masterclass" 
                    lessonId="1_1" 
                  />
                </section>
              </div>
              <div className="col-12 col-xl-4">
                <VideoNotesSidebar videoRef={videoRef} courseId="masterclass" lessonId="1_1" />
              </div>
            </div>

            {/* Title & Actions */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
              <div>
                <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>ماستركلاس السكالبينج المتقدم</h1>
                <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>أتقن الاتجاهات الدقيقة باستخدام تحليل تدفق الأوامر عالي الدقة.</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button onClick={() => setIsQuizOpen(true)} className="btn px-4 py-2 fw-bold interactive btn-primary-cta d-flex align-items-center gap-2" style={{ borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>quiz</span>
                  اختبر معلوماتك في هذه المحاضرة
                </button>
                <button onClick={() => setIsPlaying(true)} className="btn px-4 py-2 fw-semibold" style={{ backgroundColor: '#75ff9e', color: '#003918', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)', boxShadow: '0 0 15px rgba(117,255,158,0.12)' }}>
                  متابعة التعلم
                </button>
                <button onClick={() => setIsBookmarked(!isBookmarked)} className="btn px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-white border" style={{ borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)', fontSize: '13px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isBookmarked ? '#75ff9e' : 'white', fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                  {isBookmarked ? 'محفوظ' : 'حفظ'}
                </button>
              </div>
            </div>

            <CourseQuiz isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />

            {/* Info Grid */}
            <div className="row g-4">
              <div className="col-12 col-md-8">
                <div className="glass-card p-4 rounded-3 h-100">
                  <h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#75ff9e', fontFamily: 'var(--font-sans)' }}>
                    <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '20px' }}>info</span> عن هذا الكورس
                  </h3>
                  <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.85, fontFamily: 'var(--font-sans)' }}>
                    تعمق في آليات التداول عالي التردد والسكالبينج. هذه الدورة مصممة للمتداولين المتمرسين الذين يرغبون في تحسين استراتيجيات تنفيذهم باستخدام أدوات تدفق الأوامر المؤسسية.
                  </p>
                  <div className="pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h4 className="font-mono-data text-white text-uppercase mb-3" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>مخرجات التعلم</h4>
                    <div className="row g-2">
                      {['قراءة دفتر الأوامر من المستوى الثاني', 'اكتشاف أوامر الجليد الخفية', 'استراتيجيات رد الفعل بـ٠.٥ ثانية', 'منطق قياس المخاطر الديناميكي'].map((item, i) => (
                        <div key={i} className="col-6 d-flex align-items-center gap-1 text-muted" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                          <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '14px' }}>check_circle</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="glass-card p-4 rounded-3 text-center h-100 d-flex flex-column align-items-center justify-content-between">
                  <div className="rounded-circle border border-2 p-1 mb-3" style={{ width: '96px', height: '96px', borderColor: '#75ff9e' }}>
                    <img alt="د. إيلينا فانس" className="w-100 h-100 object-cover rounded-circle"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdHC77LmwG49gMXeUdo3BC4CnzdYGLc7uanWx7xgzaRtYs51ey0rTNn8TOqZGAJ_Txqm9XO0GeWU9ImvH0TCi5H9DEO35GP8X74Z1DPBwEGL4RI3QzjAKgrqZA0vgYoFEGOFVYtqKASdSlI_v4EcfFKnPOuTr6RnJrNQngfAPUT6h6Yd2T0wQ9grK08GiCIxcIcHHEy5lPcPoQUIRnSLSZ2tPwPIr_5X9Opl2RO6UkMh1NTa_dlXJxdUB8mfGhxoFVrdnPVqvMj4Yr" />
                  </div>
                  <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>د. إيلينا فانس</h3>
                  <p className="font-mono-data text-uppercase my-2" style={{ color: '#75ff9e', fontSize: '9px' }}>كبيرة الاستراتيجيين الكميين</p>
                  <p className="text-muted mb-3" style={{ fontSize: '12px', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>مهندسة HFT سابقة بخبرة ١٥ عامًا في التنفيذ الخوارزمي وبنية السوق الجزئية.</p>
                  <button className="btn btn-link text-decoration-none p-0 border-0 font-mono-data d-flex align-items-center gap-1" style={{ color: '#75ff9e', fontSize: '12px' }}>
                    عرض الملف الشخصي <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resources */}
            <section className="glass-card p-4 rounded-3">
              <h3 className="h5 text-white fw-bold mb-3" style={{ fontFamily: 'var(--font-sans)' }}>المواد القابلة للتنزيل</h3>
              <div className="row g-3">
                {[
                  { icon: 'picture_as_pdf', color: '#75ff9e', name: 'Order_Flow_Handbook.pdf', meta: '١٢.٤ ميغابايت • قراءة أساسية' },
                  { icon: 'terminal', color: '#81cfff', name: 'Scalp_Pro_Indicator.algo', meta: '٤٢ كيلوبايت • TradingView / MetaTrader' },
                ].map((r, i) => (
                  <div key={i} className="col-12 col-md-6">
                    <div className="p-3 rounded border d-flex align-items-center justify-content-between hover-glow" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                      <div className="d-flex align-items-center gap-3">
                        <span className="material-symbols-outlined" style={{ color: r.color, fontSize: '28px' }}>{r.icon}</span>
                        <div>
                          <p className="m-0 text-white font-mono-data fw-semibold" style={{ fontSize: '12px' }}>{r.name}</p>
                          <p className="m-0 text-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}>{r.meta}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-muted">download</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Curriculum */}
          <aside className="col-12 col-lg-4">
            <CourseCurriculum />
          </aside>

        </div>
      </main>
    </div>
  );
}
