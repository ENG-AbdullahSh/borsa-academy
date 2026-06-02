import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MODULES = [
  {
    key: 'mod1',
    title: 'الوحدة ١: أساسيات تدفق الأوامر',
    completed: true,
    lessons: [
      { title: '١.١ تشريح الصفقة', duration: '١٢:٠٥', active: true },
      { title: '١.٢ شرح عمق السوق', duration: '١٨:٤٠', active: false },
    ],
  },
  {
    key: 'mod2',
    title: 'الوحدة ٢: استراتيجيات التنفيذ',
    completed: false,
    lessons: [
      { title: '٢.١ استراتيجية الفيد', duration: '٢٥:١٠', locked: true },
      { title: '٢.٢ دخول الزخم الانفجاري', duration: '٣٢:١٥', locked: true },
    ],
  },
  {
    key: 'mod3',
    title: 'الوحدة ٣: إدارة المخاطر',
    completed: false,
    lessons: [
      { title: '٣.١ تحديد وقف الخسارة', duration: '١٥:٥٠', locked: true },
    ],
  },
];

export default function CourseDetail() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expanded, setExpanded] = useState({ mod1: true, mod2: false, mod3: false });

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

            {/* Video Player */}
            <section className="position-relative glass-card rounded-3 overflow-hidden" style={{ minHeight: '380px', borderRadius: '12px' }}>
              {isPlaying ? (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75 p-5" style={{ minHeight: '380px' }}>
                  <div className="spinner-grow" role="status" style={{ width: '48px', height: '48px', color: '#75ff9e' }} />
                  <span className="font-mono-data text-uppercase mt-3" style={{ color: '#75ff9e', fontSize: '12px', letterSpacing: '0.1em' }}>جارٍ تزامن تدفق دفتر الأوامر...</span>
                  <p className="text-muted font-mono-data mt-2" style={{ fontSize: '11px' }}>مخطط العمق • ملف حجم السعر • مؤشرات VWAP نشطة</p>
                </div>
              ) : (
                <>
                  <img alt="واجهة التداول المتقدمة" className="w-100 object-cover" style={{ minHeight: '380px', opacity: 0.85 }}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHHrmM7bgkBU4GMt7xzQKoyQOiVLuUg9PexkkiML4CxF82U9zfcUSTSMv0cXRfAaizBMluvgMle--myXkoOAv9z3fCXk95tvVzgvUlyNs88aDjSmRXhiB25gqF6CifQ_bo54ux0p2-ErdEfpfE7mpQWgoS_xFcrie4ar8KNPhmesZRshDUw0ZBuEyIFbikh_Nr9NK4XP3FkkcEfQxXiqkdp1ZdoleBBIDyzNrEv3dn3fClsc5947beLNlkhrYKrFGOHCuwVHSf6Nyi" />
                  <div onClick={() => setIsPlaying(true)} className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center justify-content-center border" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(117,255,158,0.15)', borderColor: 'rgba(117,255,158,0.45)', backdropFilter: 'blur(4px)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#75ff9e' }}>play_arrow</span>
                    </div>
                  </div>
                </>
              )}

              {/* Controls */}
              <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 10 }}>
                <div className="d-flex align-items-center gap-3 glass-card p-2 rounded-2" style={{ direction: 'ltr' }}>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="material-symbols-outlined btn p-0 border-0 bg-transparent" style={{ fontSize: '32px', color: '#75ff9e' }}>
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </button>
                  <div className="flex-grow-1 rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ width: isPlaying ? '38%' : '32%', height: '100%', background: 'linear-gradient(90deg,#00a9e8,#75ff9e)', boxShadow: '0 0 8px rgba(117,255,158,0.5)' }} />
                  </div>
                  <span className="font-mono-data text-white" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{isPlaying ? '17:10' : '14:20'} / 45:00</span>
                  <button className="material-symbols-outlined btn p-0 border-0 bg-transparent text-muted" style={{ fontSize: '20px' }}>volume_up</button>
                  <button className="material-symbols-outlined btn p-0 border-0 bg-transparent text-muted" style={{ fontSize: '20px' }}>fullscreen</button>
                </div>
              </div>
            </section>

            {/* Title & Actions */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
              <div>
                <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>ماستركلاس السكالبينج المتقدم</h1>
                <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>أتقن الاتجاهات الدقيقة باستخدام تحليل تدفق الأوامر عالي الدقة.</p>
              </div>
              <div className="d-flex gap-2">
                <button onClick={() => setIsPlaying(true)} className="btn px-4 py-2 fw-semibold" style={{ backgroundColor: '#75ff9e', color: '#003918', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)', boxShadow: '0 0 15px rgba(117,255,158,0.12)' }}>
                  متابعة التعلم
                </button>
                <button onClick={() => setIsBookmarked(!isBookmarked)} className="btn px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-white border" style={{ borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)', fontSize: '13px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isBookmarked ? '#75ff9e' : 'white', fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                  {isBookmarked ? 'محفوظ' : 'حفظ'}
                </button>
              </div>
            </div>

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
            <div className="glass-card rounded-3 overflow-hidden d-flex flex-column" style={{ position: 'sticky', top: '88px', maxHeight: 'calc(100vh - 120px)' }}>
              <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <h3 className="h6 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>منهج الكورس</h3>
                <div className="d-flex justify-content-between font-mono-data text-muted mb-2" style={{ fontSize: '11px' }}>
                  <span>١٢ وحدة • ٨ ساعات ٤٥ دقيقة</span>
                  <span style={{ color: '#75ff9e' }}>٣٤٪ مكتمل</span>
                </div>
                <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
                  <div style={{ width: '34%', height: '100%', backgroundColor: '#75ff9e', boxShadow: '0 0 8px rgba(117,255,158,0.3)' }} />
                </div>
              </div>

              <div className="flex-grow-1 overflow-auto p-2 d-flex flex-column gap-2 custom-scrollbar">
                {MODULES.map((mod) => (
                  <div key={mod.key} className="rounded border" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <button onClick={() => setExpanded((p) => ({ ...p, [mod.key]: !p[mod.key] }))}
                      className="w-100 btn p-3 border-0 bg-transparent text-start d-flex align-items-center justify-content-between text-white">
                      <div className="d-flex align-items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: mod.completed ? '#75ff9e' : '#7c8e7c', fontSize: '16px', fontVariationSettings: mod.completed ? "'FILL' 1" : "'FILL' 0" }}>
                          {mod.completed ? 'check_circle' : 'circle'}
                        </span>
                        <span className="font-mono-data fw-semibold" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>{mod.title}</span>
                      </div>
                      <span className="material-symbols-outlined text-muted" style={{ transform: expanded[mod.key] ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>expand_more</span>
                    </button>
                    {expanded[mod.key] && (
                      <div className="px-3 pb-3 d-flex flex-column gap-2 border-top pt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        {mod.lessons.map((lesson, i) => (
                          <div key={i} className="p-2 rounded d-flex align-items-center justify-content-between font-mono-data"
                            style={{ fontSize: '11px', backgroundColor: lesson.active ? 'rgba(117,255,158,0.08)' : 'transparent', borderLeft: lesson.active ? '2px solid #75ff9e' : 'none', color: lesson.active ? '#75ff9e' : '#bacbb9', fontFamily: 'var(--font-sans)', direction: 'ltr' }}>
                            <span className="d-flex align-items-center gap-1">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{lesson.locked ? 'lock' : 'play_circle'}</span>
                              {lesson.title}
                            </span>
                            <span className="opacity-75">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-center py-2 text-muted font-mono-data fst-italic" style={{ fontSize: '11px' }}>+ ٩ وحدات إضافية</div>
              </div>

              <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <button className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold text-muted border border-secondary border-opacity-25 rounded" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>workspace_premium</span> الحصول على الشهادة
                </button>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
