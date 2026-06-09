import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const COURSES_API_URL = 'http://127.0.0.1:8000/api/courses';
const PER_PAGE = 9;

const FALLBACK_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuATh_A_uzdSV_rjevMXSboWzp7GGyObR4rpvA2Ev0DHczf7PXHjv_zQPIC5UCUjaY8CbOAgcgnDNSdpISv2rgM_G8zvgioT12jcNYTB1vjTvxcDTWyr6W6J1Ju0qCygeMDCjEkkm4GZK0LsjhzynOthKsPQtS3_-7SmybRXijz_ltbbS8IOL8b3GNQDflLoMtvkh0tly4mo7t0EFcY_b6lzkB0foHoRkm-8M1jYV2jv4N9oWLSWnke7WQNR7eh8b6o5f5VsFaEpVtgY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC_uLJEYZ6mltA_CcRI6igASpikHY7N4qUqnV8Qt1L0wJ48w3hSv0pSpOxT4bY8PjiYPUJuqKJX_HqW9aAoIbvRjRFiKLn5RYhCjWb-f7_xgm10Ps0fevscsAZWuIooWK8Xa3P9LVHkRBRIuJk3JayecwQ9Rpg2MrkK9rouUD0r-sqWwwPMBTODo6mn3mfn9PMANL5spC9soaBiG_tcrWytRERtwo2c9ZreZ-DDY4EhIJ18d-l5g_yRP6AfSCdn142dMGaRRG56RKY0',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNkakt9-OlOuIiRAgvzdNf_QPGfHuoBEB0EGN-5JlmIAJyJdB0mMnoK4ViTjtb-LmV2iUWZrgrIEIjBJ-stktz5BqjKla5Jq9UJg4ekbd8eIXlnr_3Edt5XQ8B_gQdzwFARESkOobDYcfx9g7LWV1tNLZ5G6tzvi38Ld8azMLog61Tj2jp-Zy5FqDFsX8PGMzduYeSFp_irKrQZs8eJqzS8tQtdrkmUOIneTbPECyducLzasrBLsE2tdo4m5Y6WLoEEbS1cR40adxT',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAibgpWq8YsSj0a6ekzq950KrsvPYIocgViSguRN6Cw_qKjrkj_dwPFNyThVdDkZZkNxRNkQRF12-Kj0XubStWj7WVw1AAEkyUlRpQF344uwyIPjBrD2ASsu4HKtuC5pTPnpZ-_-Hx0tH6nPOmFBJVsWeiEtF8ueO05FKkQ-mYSEWMX1NaI1bExgjvdtlCIdflUWXCfUPdLPixG4rHRy8YNkTKsjvfnGgE0mFb14giyXu5qhittieqYGB_G9LIXKHsXfBMh8wRvY722',
];

const LEVELS = [
  { label: 'مبتدئ', value: 'beginner' },
  { label: 'متوسط', value: 'intermediate' },
  { label: 'متقدم', value: 'advanced' },
];

const CATEGORIES = [
  'أساسيات التداول',
  'التحليل الفني',
  'حركة السعر',
  'إدارة المخاطر',
  'الفوركس',
  'العملات الرقمية',
  'الخيارات',
  'التداول المتأرجح',
  'التداول الخوارزمي',
  'إدارة المحافظ',
];

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  total: 0,
  from: null,
  to: null,
};

const levelLabel = (level) => {
  if (level === 'beginner') return 'مبتدئ';
  if (level === 'intermediate') return 'متوسط';
  if (level === 'advanced') return 'متقدم';
  return level || 'كل المستويات';
};

const fallbackImageFor = (id = 0) => {
  const index = Math.abs(Number(id) || 0) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
};

const BACKEND_URL = 'http://127.0.0.1:8000';

const resolveImage = (course, index) => {
  // 1. If thumbnail is a full HTTP URL, use it directly
  if (course.thumbnail && /^https?:\/\//i.test(course.thumbnail)) {
    return course.thumbnail;
  }
  // 2. If image_path is a relative storage path, build the full URL
  if (course.image_path && !course.image_path.startsWith('http')) {
    return `${BACKEND_URL}/storage/${course.image_path}`;
  }
  // 3. If image_path is already a full URL
  if (course.image_path && /^https?:\/\//i.test(course.image_path)) {
    return course.image_path;
  }
  // 4. Fallback
  return fallbackImageFor(course.id ?? index);
};

const normalizeCourse = (course, index) => {
  const price = Number(course.price ?? 0);
  const durationHours = Number(course.duration_hours ?? 0);
  const image = resolveImage(course, index);

  return {
    id: course.id,
    title: course.title || 'كورس بدون عنوان',
    instructor: course.instructor_name || 'بورصة أكاديمي',
    category: course.category || 'تداول',
    level: levelLabel(course.level),
    rating: 4.8,
    image,
    createdAt: course.created_at,
    highlights: [
      course.short_description,
      durationHours ? `${durationHours} ساعة تدريبية مركزة` : null,
      price > 0 ? `السعر: $${price.toFixed(2)}` : 'كورس مجاني',
    ].filter(Boolean).slice(0, 3),
  };
};

export default function Courses() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('الأكثر شيوعا');
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCourses = async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedLevel) params.set('level', selectedLevel);
      if (selectedCategory) params.set('category', selectedCategory);

      try {
        const response = await fetch(`${COURSES_API_URL}?${params.toString()}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Courses API returned ${response.status}`);
        }

        const payload = await response.json();
        const apiCourses = Array.isArray(payload.data) ? payload.data : [];

        setCourses(apiCourses.map(normalizeCourse));
        setPagination({
          current_page: payload.current_page ?? page,
          last_page: payload.last_page ?? 1,
          total: payload.total ?? apiCourses.length,
          from: payload.from ?? null,
          to: payload.to ?? null,
        });
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setCourses([]);
          setPagination(DEFAULT_PAGINATION);
          setError('تعذر تحميل الكورسات. تأكد من تشغيل Laravel API.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => controller.abort();
  }, [debouncedSearch, page, retryKey, selectedCategory, selectedLevel]);

  const visibleCourses = useMemo(() => {
    const sorted = [...courses];

    if (sortOption === 'الأحدث أولا') {
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    if (sortOption === 'التقييم: الأعلى') {
      return sorted.sort((a, b) => b.rating - a.rating);
    }

    return sorted;
  }, [courses, sortOption]);

  const pageNumbers = useMemo(() => {
    const lastPage = Math.max(Number(pagination.last_page) || 1, 1);

    if (lastPage <= 3) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(page - 1, lastPage - 2));
    return [start, start + 1, start + 2];
  }, [page, pagination.last_page]);

  const toggleLevel = (level) => {
    setSelectedLevel((current) => (current === level ? '' : level));
    setPage(1);
  };

  const toggleCategory = (category) => {
    setSelectedCategory((current) => (current === category ? '' : category));
    setPage(1);
  };

  const catColor = (cat) => {
    if (cat === 'العملات الرقمية') return 'rgba(0,230,118,0.85)';
    if (cat === 'الفوركس') return 'rgba(0,169,232,0.85)';
    if (cat === 'التحليل الفني' || cat === 'حركة السعر') return 'rgba(117,255,158,0.85)';
    return 'rgba(244,67,54,0.85)';
  };

  const goToPage = (nextPage) => {
    const lastPage = Math.max(Number(pagination.last_page) || 1, 1);
    const safePage = Math.min(Math.max(nextPage, 1), lastPage);
    setPage(safePage);
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
                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)}
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
                  {LEVELS.map((lvl) => {
                    const checked = !selectedLevel || selectedLevel === lvl.value;

                    return (
                      <label key={lvl.value} className="d-flex align-items-center gap-2 mb-2 cursor-pointer" style={{ color: checked ? '#75ff9e' : '#bacbb9', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleLevel(lvl.value)} style={{ accentColor: '#75ff9e' }} />
                        {lvl.label}
                      </label>
                    );
                  })}
                </div>

                {/* Market */}
                <div>
                  <h3 className="font-mono-data text-white text-uppercase mb-3 d-flex align-items-center gap-1" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                    <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '16px' }}>monitoring</span> السوق
                  </h3>
                  {CATEGORIES.map((category) => {
                    const checked = !selectedCategory || selectedCategory === category;

                    return (
                      <label key={category} className="d-flex align-items-center gap-2 mb-2 cursor-pointer" style={{ color: checked ? '#75ff9e' : '#bacbb9', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCategory(category)} style={{ accentColor: '#75ff9e' }} />
                        {category}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pro Teaser */}
              <div className="p-4 rounded-3 border position-relative overflow-hidden" style={{ backgroundColor: 'rgba(117,255,158,0.03)', borderColor: 'rgba(117,255,158,0.15)' }}>
                <h4 className="fw-semibold mb-2" style={{ color: '#75ff9e', fontSize: '20px', fontFamily: 'var(--font-sans)' }}>انضم للنخبة</h4>
                <p className="text-muted mb-4" style={{ fontSize: '13px', lineHeight: 1.7 }}>احصل على وصول إلى جلسات تداول مباشرة وتدرب على دفاتر الأوامر في ظروف سوق واقعية.</p>
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
                <p className="text-muted m-0" style={{ fontSize: '14px' }}>
                  {loading ? 'جاري تحميل الكورسات...' : `${pagination.total} كورسات متاحة للمتداولين المحترفين.`}
                </p>
              </div>
              <select value={sortOption} onChange={(event) => setSortOption(event.target.value)}
                className="form-select custom-input py-2 px-3 font-mono-data" style={{ width: '180px', fontSize: '13px' }}>
                <option>الأكثر شيوعا</option>
                <option>الأحدث أولا</option>
                <option>التقييم: الأعلى</option>
              </select>
            </div>

            <div className="row g-4">
              {loading ? (
                <div className="col-12 py-5 text-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#75ff9e' }}>progress_activity</span>
                  <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>جاري تحميل الكورسات...</h5>
                </div>
              ) : error ? (
                <div className="col-12 py-5 text-center">
                  <span className="material-symbols-outlined text-muted" style={{ fontSize: '64px' }}>cloud_off</span>
                  <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>{error}</h5>
                  <button className="btn mt-3 px-4 py-2 fw-semibold border" onClick={() => setRetryKey((current) => current + 1)}
                    style={{ borderColor: '#75ff9e', color: '#75ff9e', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                    حاول مرة أخرى
                  </button>
                </div>
              ) : visibleCourses.length > 0 ? visibleCourses.map((course) => (
                <div key={course.id} className="col-12 col-md-6 col-lg-4">
                  <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100">
                    <div className="position-relative overflow-hidden" style={{ height: '160px' }}>
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-100 h-100 object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImageFor(course.id);
                        }}
                      />
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
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span> بإشراف {course.instructor}
                      </p>
                      <div className="mb-4 flex-grow-1">
                        <p className="font-mono-data text-uppercase mb-2" style={{ fontSize: '10px', color: '#7c8e7c' }}>أبرز ما ستتعلمه:</p>
                        <ul className="list-unstyled p-0 m-0">
                          {course.highlights.map((highlight) => (
                            <li key={highlight} className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: '12px', color: '#bacbb9', fontFamily: 'var(--font-sans)' }}>
                              <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '14px' }}>check_circle</span> {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link to={`/courses/${course.id}`} className="btn w-100 py-2 text-white fw-semibold d-flex align-items-center justify-content-center gap-2"
                        style={{ backgroundColor: '#272a2e', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-sans)', border: 'none' }}>
                        سجل الآن <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-12 py-5 text-center">
                  <span className="material-symbols-outlined text-muted" style={{ fontSize: '64px' }}>youtube_searched_for</span>
                  <h5 className="text-muted mt-3" style={{ fontFamily: 'var(--font-sans)' }}>لا توجد كورسات تطابق الفلاتر المحددة.</h5>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && !error && (
              <div className="mt-5 d-flex align-items-center justify-content-center gap-2">
                <button className="btn rounded d-flex align-items-center justify-content-center" disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21,26,34,0.6)', color: page <= 1 ? '#5f6b5f' : '#bacbb9', border: 'none', fontFamily: 'var(--font-sans)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                </button>

                {pageNumbers.map((item) => (
                  <button key={item} className="btn rounded d-flex align-items-center justify-content-center"
                    onClick={() => goToPage(item)}
                    style={{ width: '40px', height: '40px', backgroundColor: item === page ? '#75ff9e' : 'rgba(21,26,34,0.6)', color: item === page ? '#003918' : '#bacbb9', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: item === page ? 700 : 400 }}>
                    {item}
                  </button>
                ))}

                <button className="btn rounded d-flex align-items-center justify-content-center" disabled={page >= (Number(pagination.last_page) || 1)}
                  onClick={() => goToPage(page + 1)}
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(21,26,34,0.6)', color: page >= (Number(pagination.last_page) || 1) ? '#5f6b5f' : '#bacbb9', border: 'none', fontFamily: 'var(--font-sans)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                </button>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
