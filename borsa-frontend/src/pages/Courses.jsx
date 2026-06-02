import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const COURSES = [
  {
    id: 'advanced-scalping-masterclass',
    title: 'ماستركلاس السكالبينج المتقدم',
    instructor: 'د. إيلينا فانس',
    category: 'عملات رقمية',
    catKey: 'Crypto',
    level: 'متوسط',
    rating: 4.9,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATh_A_uzdSV_rjevMXSboWzp7GGyObR4rpvA2Ev0DHczf7PXHjv_zQPIC5UCUjaY8CbOAgcgnDNSdpISv2rgM_G8zvgioT12jcNYTB1vjTvxcDTWyr6W6J1Ju0qCygeMDCjEkkm4GZK0LsjhzynOthKsPQtS3_-7SmybRXijz_ltbbS8IOL8b3GNQDflLoMtvkh0tly4mo7t0EFcY_b6lzkB0foHoRkm-8M1jYV2jv4N9oWLSWnke7WQNR7eh8b6o5f5VsFaEpVtgY',
    highlights: ['تحليل تدفق الأوامر', 'استراتيجية VWAP', 'التنفيذ الفوري'],
  },
  {
    id: 'forex-fundamentals-pro',
    title: 'أساسيات الفوركس الاحترافية',
    instructor: 'ماركوس ثورن',
    category: 'فوركس',
    catKey: 'Forex',
    level: 'مبتدئ',
    rating: 4.7,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_uLJEYZ6mltA_CcRI6igASpikHY7N4qUqnV8Qt1L0wJ48w3hSv0pSpOxT4bY8PjiYPUJuqKJX_HqW9aAoIbvRjRFiKLn5RYhCjWb-f7_xgm10Ps0fevscsAZWuIooWK8Xa3P9LVHkRBRIuJk3JayecwQ9Rpg2MrkK9rouUD0r-sqWwwPMBTODo6mn3mfn9PMANL5spC9soaBiG_tcrWytRERtwo2c9ZreZ-DDY4EhIJ18d-l5g_yRP6AfSCdn142dMGaRRG56RKY0',
    highlights: ['العوامل الاقتصادية الكلية', 'ميكانيكا البنوك المركزية', 'إدارة المخاطر الأساسية'],
  },
  {
    id: 'algorithmic-equity-analysis',
    title: 'تحليل الأسهم الخوارزمي',
    instructor: 'سارة شن، CFA',
    category: 'أسهم',
    catKey: 'Stocks',
    level: 'متقدم',
    rating: 5.0,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNkakt9-OlOuIiRAgvzdNf_QPGfHuoBEB0EGN-5JlmIAJyJdB0mMnoK4ViTjtb-LmV2iUWZrgrIEIjBJ-stktz5BqjKla5Jq9UJg4ekbd8eIXlnr_3Edt5XQ8B_gQdzwFARESkOobDYcfx9g7LWV1tNLZ5G6tzvi38Ld8azMLog61Tj2jp-Zy5FqDFsX8PGMzduYeSFp_irKrQZs8eJqzS8tQtdrkmUOIneTbPECyducLzasrBLsE2tdo4m5Y6WLoEEbS1cR40adxT',
    highlights: ['الاختبار الخلفي الكمي', 'التداول على الأرباح', 'دمج الذكاء الاصطناعي'],
  },
  {
    id: 'psychology-of-winning',
    title: 'علم نفس التداول الرابح',
    instructor: 'ليو ستيرلينج',
    category: 'عام',
    catKey: 'General',
    level: 'جميع المستويات',
    rating: 4.8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAibgpWq8YsSj0a6ekzq950KrsvPYIocgViSguRN6Cw_qKjrkj_dwPFNyThVdDkZZkNxRNkQRF12-Kj0XubStWj7WVw1AAEkyUlRpQF344uwyIPjBrD2ASsu4HKtuC5pTPnpZ-_-Hx0tH6nPOmFBJVsWeiEtF8ueO05FKkQ-mYSEWMX1NaI1bExgjvdtlCIdflUWXCfUPdLPixG4rHRy8YNkTKsjvfnGgE0mFb14giyXu5qhittieqYGB_G9LIXKHsXfBMh8wRvY722',
    highlights: ['التحكم في FOMO والجشع', 'إتقان إجهاد القرار', 'التداول بالمذكرات'],
  },
];

const LEVELS = ['مبتدئ', 'متوسط', 'متقدم'];
const MARKETS = ['عملات رقمية', 'فوركس', 'أسهم'];

export default function Courses() {
  const [search, setSearch] = useState('');
  const [levels, setLevels] = useState({ 'مبتدئ': true, 'متوسط': true, 'متقدم': true, 'جميع المستويات': true });
  const [markets, setMarkets] = useState({ 'عملات رقمية': true, 'فوركس': true, 'أسهم': true, 'عام': true });
  const [sortOption, setSortOption] = useState('الأكثر شيوعًا');

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      const matchSearch = c.title.includes(search) || c.instructor.includes(search);
      const matchLevel = levels[c.level];
      const matchMarket = markets[c.category];
      return matchSearch && matchLevel && matchMarket;
    }).sort((a, b) => b.rating - a.rating);
  }, [search, levels, markets, sortOption]);

  const catColor = (cat) => {
    if (cat === 'عملات رقمية') return 'rgba(0,230,118,0.85)';
    if (cat === 'فوركس') return 'rgba(0,169,232,0.85)';
    return 'rgba(244,67,54,0.85)';
  };

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px' }}>
      <main className="py-5 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="row g-4">

          {/* Sidebar */}
          <aside className="col-12 col-md-3">
            <div className="d-flex flex-column gap-4">
              <div className="glass-card p-4 rounded-3">

                {/* Search */}
                <div className="mb-4">
                  <label className="font-mono-data d-block mb-2 text-uppercase" style={{ fontSize: '10px', color: '#75ff9e', letterSpacing: '0.08em' }}>بحث في الكتالوج</label>
                  <div className="position-relative">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث عن كورس..." className="form-control custom-input py-2"
                      style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', paddingLeft: '36px' }} />
                    <span className="material-symbols-outlined position-absolute top-50 translate-middle-y" style={{ fontSize: '18px', color: '#7c8e7c', left: '10px' }}>search</span>
                  </div>
                </div>

                {/* Level */}
                <div className="mb-4">
                  <h3 className="font-mono-data text-white text-uppercase mb-3 d-flex align-items-center gap-1" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                    <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '16px' }}>signal_cellular_alt</span> المستوى
                  </h3>
                  {LEVELS.map((lvl) => (
                    <label key={lvl} className="d-flex align-items-center gap-2 mb-2 cursor-pointer" style={{ color: levels[lvl] ? '#75ff9e' : '#bacbb9', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
                      <input type="checkbox" checked={levels[lvl]} onChange={() => setLevels((p) => ({ ...p, [lvl]: !p[lvl] }))} style={{ accentColor: '#75ff9e' }} />
                      {lvl}
                    </label>
                  ))}
                </div>

                {/* Market */}
                <div>
                  <h3 className="font-mono-data text-white text-uppercase mb-3 d-flex align-items-center gap-1" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                    <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '16px' }}>monitoring</span> السوق
                  </h3>
                  {MARKETS.map((mkt) => (
                    <label key={mkt} className="d-flex align-items-center gap-2 mb-2 cursor-pointer" style={{ color: markets[mkt] ? '#75ff9e' : '#bacbb9', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
                      <input type="checkbox" checked={markets[mkt]} onChange={() => setMarkets((p) => ({ ...p, [mkt]: !p[mkt] }))} style={{ accentColor: '#75ff9e' }} />
                      {mkt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Pro Teaser */}
              <div className="p-4 rounded-3 border position-relative overflow-hidden" style={{ backgroundColor: 'rgba(117,255,158,0.03)', borderColor: 'rgba(117,255,158,0.15)' }}>
                <h4 className="fw-semibold mb-2" style={{ color: '#75ff9e', fontSize: '20px', fontFamily: 'var(--font-sans)' }}>انضم للنخبة</h4>
                <p className="text-muted mb-4" style={{ fontSize: '13px', lineHeight: 1.7 }}>احصل على وصول إلى أكثر من ٥٠ جلسة تداول حية وأتقن دفاتر الأوامر في إعدادات حقيقية.</p>
                <button className="btn w-100 py-2 fw-semibold border" style={{ borderColor: '#75ff9e', color: '#75ff9e', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                  ترقية العضوية
                </button>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <section className="col-12 col-md-9">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
              <div>
                <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>الكتالوج الاحترافي</h1>
                <p className="text-muted m-0" style={{ fontSize: '14px' }}>٣٢ كورسًا متخصصًا لمتداولي الأداء العالي.</p>
              </div>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}
                className="form-select custom-input py-2 px-3 font-mono-data" style={{ width: '180px', fontSize: '13px' }}>
                <option>الأكثر شيوعًا</option>
                <option>الأحدث أولًا</option>
                <option>التقييم: الأعلى</option>
              </select>
            </div>

            <div className="row g-4">
              {filtered.length > 0 ? filtered.map((course) => (
                <div key={course.id} className="col-12 col-md-6 col-lg-4">
                  <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100">
                    <div className="position-relative overflow-hidden" style={{ height: '160px' }}>
                      <img src={course.image} alt={course.title} className="w-100 h-100 object-cover" />
                      <div className="position-absolute top-0 start-0 p-3 d-flex gap-1" style={{ zIndex: 2 }}>
                        <span className="px-2 py-0 rounded text-white font-mono-data fw-bold" style={{ fontSize: '9px', backgroundColor: catColor(course.category) }}>{course.category}</span>
                        <span className="px-2 py-0 rounded font-mono-data fw-bold" style={{ fontSize: '9px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#75ff9e' }}>{course.level}</span>
                      </div>
                    </div>
                    <div className="p-4 d-flex flex-column flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <h3 className="h6 text-white fw-bold mb-0" style={{ fontSize: '15px', lineHeight: 1.3, fontFamily: 'var(--font-sans)', minHeight: '38px' }}>{course.title}</h3>
                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-mono-data text-white fw-semibold" style={{ fontSize: '12px' }}>{course.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-muted d-flex align-items-center gap-1 mb-3" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span> بقلم {course.instructor}
                      </p>
                      <div className="mb-4 flex-grow-1">
                        <p className="font-mono-data text-uppercase mb-2" style={{ fontSize: '10px', color: '#7c8e7c' }}>أبرز ما ستتعلمه:</p>
                        <ul className="list-unstyled p-0 m-0">
                          {course.highlights.map((h, i) => (
                            <li key={i} className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: '12px', color: '#bacbb9', fontFamily: 'var(--font-sans)' }}>
                              <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '14px' }}>check_circle</span> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link to={`/courses/${course.id}`} className="btn w-100 py-2 text-white fw-semibold d-flex align-items-center justify-content-center gap-2"
                        style={{ backgroundColor: '#272a2e', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-sans)', border: 'none' }}>
                        سجّل الآن <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-12 py-5 text-center">
                  <span className="material-symbols-outlined text-muted" style={{ fontSize: '64px' }}>youtube_searched_for</span>
                  <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>لا توجد كورسات تطابق الفلاتر المحددة</h5>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-5 d-flex align-items-center justify-content-center gap-2">
              {['chevron_right', '1', '2', '3', 'chevron_left'].map((item, i) => (
                <button key={i} className="btn rounded d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', backgroundColor: item === '1' ? '#75ff9e' : 'rgba(21,26,34,0.6)', color: item === '1' ? '#003918' : '#bacbb9', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: item === '1' ? 700 : 400 }}>
                  {item.startsWith('chevron') ? <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item}</span> : item}
                </button>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
