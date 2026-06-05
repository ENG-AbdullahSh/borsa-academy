import { useState, useMemo } from 'react';
import AdminCourses from './AdminCourses';

const ENROLLMENTS = [
  { id: 'TRN-809', name: 'سارة مولر', course: 'السكالبينج المتقدم', amount: 499, date: '٢٠٢٦-٠٥-٣١', status: 'نشط' },
  { id: 'TRN-808', name: 'جون ديفيس', course: 'أساسيات الفوركس', amount: 299, date: '٢٠٢٦-٠٥-٣٠', status: 'مكتمل' },
  { id: 'TRN-807', name: 'آنا كوفاكس', course: 'التحليل الخوارزمي', amount: 899, date: '٢٠٢٦-٠٥-٢٩', status: 'معلق' },
  { id: 'TRN-806', name: 'مايكل تشانغ', course: 'علم نفس التداول', amount: 199, date: '٢٠٢٦-٠٥-٢٨', status: 'نشط' },
  { id: 'TRN-805', name: 'إيلينا روستوفا', course: 'السكالبينج المتقدم', amount: 499, date: '٢٠٢٦-٠٥-٢٧', status: 'مكتمل' },
  { id: 'TRN-804', name: 'ديفيد سميث', course: 'أساسيات الفوركس', amount: 299, date: '٢٠٢٦-٠٥-٢٦', status: 'نشط' },
];

const REVENUE = [
  { month: 'يناير', value: 12000 },
  { month: 'فبراير', value: 19000 },
  { month: 'مارس', value: 15000 },
  { month: 'أبريل', value: 27000 },
  { month: 'مايو', value: 32000 },
  { month: 'يونيو', value: 45000 },
];

const NAV_TABS = [
  { name: 'نظرة عامة', icon: 'grid_view' },
  { name: 'إدارة الكورسات', icon: 'auto_stories' },
  { name: 'المدربون', icon: 'group' },
  { name: 'الإعدادات', icon: 'settings' },
];

const STATUS_STYLE = {
  'نشط':    { bg: 'rgba(0, 230, 118, 0.15)',  color: '#00e676', border: 'rgba(0, 230, 118, 0.3)' },
  'مكتمل':  { bg: 'rgba(117, 255, 158, 0.1)', color: '#75ff9e', border: 'rgba(117, 255, 158, 0.2)' },
  'معلق':   { bg: 'rgba(244, 67, 54, 0.1)',   color: '#ffb4ab', border: 'rgba(244, 67, 54, 0.2)' },
};

const INSTRUCTORS = [
  { id: 1, name: 'سارة مولر', specialty: 'تداول العملات الرقمية', students: 450, status: 'نشط' },
  { id: 2, name: 'جون ديفيس', specialty: 'تحليل فني وفوركس', students: 890, status: 'نشط' },
  { id: 3, name: 'أحمد سعيد', specialty: 'سيكولوجية التداول', students: 320, status: 'في إجازة' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('نظرة عامة');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('جميع الكورسات');
  const [hoveredBar, setHoveredBar] = useState(null);

  const maxRevenue = Math.max(...REVENUE.map((r) => r.value));

  const filtered = useMemo(() =>
    ENROLLMENTS.filter((e) => {
      const matchSearch = e.name.includes(search) || e.id.toLowerCase().includes(search.toLowerCase());
      const matchCourse = courseFilter === 'جميع الكورسات' || e.course === courseFilter;
      return matchSearch && matchCourse;
    }), [search, courseFilter]);

  const renderOverview = () => (
    <>
      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>مركز التحكم</h1>
        <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>لوحة إدارة المنصة التعليمية الكمية.</p>
      </div>

      {/* KPI Cards */}
      <section className="row g-3 mb-4">
        {[
          { label: 'إجمالي إيرادات الفصل', value: '$١٤٨,٢٥٠', change: '+١٢.٤٪', changeColor: '#00e676', note: 'مقارنةً بالنافذة الشهرية السابقة' },
          { label: 'المشتركون النشطون', value: '٣,٤٢١', change: '+٨.٢٪', changeColor: '#00e676', note: 'مقاعد مؤسسية مخصصة' },
          { label: 'معدل اجتياز الشهادات', value: '٩٢.٤٪', change: '-١.١٪', changeColor: '#ffb4ab', note: 'مقاييس إتمام المنهج' },
          { label: 'زمن استجابة الخادم', value: '١٤ms', change: 'طبيعي', changeColor: '#81cfff', note: 'رابط شبكة شيكاغو نشط' },
        ].map((kpi, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="glass-card p-4 rounded-3 h-100 d-flex flex-column justify-content-between">
              <span className="font-mono-data d-block text-uppercase mb-3" style={{ fontSize: '12px', color: '#bacbb9', letterSpacing: '0.04em' }}>{kpi.label}</span>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)', fontSize: '26px', direction: 'ltr' }}>{kpi.value}</span>
                <span className="font-mono-data px-2 py-1 rounded" style={{ backgroundColor: `${kpi.changeColor}15`, color: kpi.changeColor, fontSize: '13px', direction: 'ltr', whiteSpace: 'nowrap' }}>{kpi.change}</span>
              </div>
              <p className="m-0 text-muted" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>{kpi.note}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Revenue Chart */}
      <section className="glass-card p-4 rounded-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>مخطط أداء المحطة</h3>
            <p className="text-muted m-0" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>المقاييس الشهرية للرسوم الدراسية.</p>
          </div>
          <span className="font-mono-data" style={{ color: '#75ff9e', fontSize: '11px' }}>بيانات النصف الأول ٢٠٢٦</span>
        </div>
        <div className="d-flex align-items-end justify-content-between px-2" style={{ height: '180px', borderBottom: '1px solid rgba(255,255,255,0.08)', direction: 'ltr' }}>
          {REVENUE.map((item, i) => {
            const pct = (item.value / maxRevenue) * 100;
            const hovered = hoveredBar === i;
            return (
              <div key={i} className="d-flex flex-column align-items-center flex-fill gap-1"
                onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)} style={{ cursor: 'pointer' }}>
                <div className="font-mono-data text-center px-2 py-0 rounded text-white"
                  style={{ opacity: hovered ? 1 : 0, fontSize: '10px', backgroundColor: '#111417', border: '1px solid #75ff9e', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                  ${item.value.toLocaleString()}
                </div>
                <div className="w-50 rounded-top"
                  style={{ height: `${pct}px`, minHeight: '8px', background: hovered ? 'linear-gradient(to top,#00e676,#75ff9e)' : 'linear-gradient(to top,rgba(129,207,255,0.35),rgba(117,255,158,0.35))', boxShadow: hovered ? '0 0 18px rgba(117,255,158,0.3)' : 'none', transition: 'background 0.3s, box-shadow 0.3s' }} />
                <span className="font-mono-data text-muted" style={{ fontSize: '10px', marginTop: '6px' }}>{item.month}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Enrollments Table */}
      <section className="glass-card p-4 rounded-3 mb-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>سجل التسجيلات</h3>
            <p className="text-muted m-0" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>أحدث تخصيصات المقاعد.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..." className="form-control custom-input py-2 font-mono-data"
              style={{ maxWidth: '160px', fontSize: '13px' }} />
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
              className="form-select custom-input py-2 font-mono-data" style={{ width: '180px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
              {['جميع الكورسات', 'السكالبينج المتقدم', 'أساسيات الفوركس', 'التحليل الخوارزمي', 'علم نفس التداول'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: '#11151D', borderRadius: '12px', padding: '15px' }}>
          <div className="table-responsive">
            <table className="table table-dark table-hover table-borderless m-0" style={{ direction: 'rtl', verticalAlign: 'middle' }}>
              <thead>
                <tr style={{ fontSize: '12px', color: '#bacbb9', fontFamily: 'var(--font-sans)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="py-3 px-3 fw-bold" style={{ whiteSpace: 'nowrap' }}>رقم المعاملة</th>
                  <th className="py-3 px-3 fw-bold">المشترك</th>
                  <th className="py-3 px-3 fw-bold">الكورس</th>
                  <th className="py-3 px-3 fw-bold text-center">الرسوم</th>
                  <th className="py-3 px-3 fw-bold" style={{ whiteSpace: 'nowrap' }}>تاريخ الالتحاق</th>
                  <th className="py-3 px-3 fw-bold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((row) => {
                  const st = STATUS_STYLE[row.status];
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                      <td className="py-3 px-3 font-mono-data text-muted" style={{ fontSize: '12px', direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap' }}>{row.id}</td>
                      <td className="py-3 px-3 text-white fw-bold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>{row.name}</td>
                      <td className="py-3 px-3 text-muted" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>{row.course}</td>
                      <td className="py-3 px-3 text-center font-mono-data fw-bold" style={{ color: '#00e676', fontSize: '14px' }}>${row.amount}</td>
                      <td className="py-3 px-3 font-mono-data text-muted" style={{ fontSize: '12px', direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-3 py-1 rounded fw-bold font-mono-data"
                          style={{ fontSize: '11px', backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" className="text-center py-5 text-muted" style={{ fontFamily: 'var(--font-sans)' }}>لم يتم العثور على سجلات مطابقة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <span className="font-mono-data text-muted" style={{ fontSize: '12px' }}>
            عرض {filtered.length} من {ENROLLMENTS.length} سجل
          </span>
          <div className="d-flex gap-2">
            <button disabled className="btn py-1 px-3 font-mono-data text-muted border" style={{ borderColor: 'rgba(255,255,255,0.06)', fontSize: '12px' }}>السابق</button>
            <button className="btn py-1 px-3 font-mono-data border" style={{ borderColor: 'rgba(0,230,118,0.3)', color: '#00e676', fontSize: '12px', background: 'rgba(0,230,118,0.05)' }}>التالي</button>
          </div>
        </div>
      </section>
    </>
  );

  const renderCourses = () => <AdminCourses />;

  const renderInstructors = () => (
    <>
      <div className="mb-4">
        <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>المدربون</h1>
        <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>إدارة الموجهين والخبراء.</p>
      </div>
      <section className="glass-card p-4 rounded-3">
        <div className="table-responsive">
          <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
            <thead>
              <tr className="border-bottom" style={{ fontSize: '12px', color: '#bacbb9', fontFamily: 'var(--font-sans)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <th className="py-3 px-4 fw-bold">الاسم</th>
                <th className="py-3 px-4 fw-bold">التخصص</th>
                <th className="py-3 px-4 fw-bold text-center">الطلاب</th>
                <th className="py-3 px-4 fw-bold text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {INSTRUCTORS.map(instructor => {
                const isActive = instructor.status === 'نشط';
                const isOnLeave = instructor.status === 'في إجازة';
                const badgeStyle = isActive
                  ? { bg: 'rgba(0, 230, 118, 0.15)', color: '#00e676', border: 'rgba(0, 230, 118, 0.3)' }
                  : isOnLeave
                  ? { bg: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', border: 'rgba(255, 152, 0, 0.3)' }
                  : { bg: 'rgba(255,255,255,0.05)', color: '#bacbb9', border: 'rgba(255,255,255,0.1)' };
                return (
                  <tr key={instructor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                    <td className="py-3 px-4 text-white fw-bold" style={{ fontSize: '15px', fontFamily: 'var(--font-sans)' }}>{instructor.name}</td>
                    <td className="py-3 px-4" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: '#bacbb9' }}>{instructor.specialty}</td>
                    <td className="py-3 px-4 text-center font-mono-data fw-bold text-white" style={{ fontSize: '15px' }}>{instructor.students}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 rounded fw-bold font-mono-data"
                        style={{ fontSize: '11px', backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}`, whiteSpace: 'nowrap' }}>
                        {instructor.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="mb-4">
        <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>الإعدادات</h1>
        <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>تكوين إعدادات المنصة العامة والأمان.</p>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4 rounded-3 h-100">
            <h3 className="h5 text-white fw-bold mb-4" style={{ fontFamily: 'var(--font-sans)' }}>الإعدادات العامة</h3>
            <div className="mb-3">
              <label className="form-label text-muted" style={{ fontSize: '13px' }}>اسم الأكاديمية</label>
              <input type="text" className="form-control custom-input py-2 border-0" defaultValue="بورصة أكاديمي" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted" style={{ fontSize: '13px' }}>البريد الإلكتروني للإدارة</label>
              <input type="email" className="form-control custom-input py-2 border-0" defaultValue="admin@borsa.io" style={{ direction: 'ltr', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }} />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted" style={{ fontSize: '13px' }}>بوابات الدفع (تكوين)</label>
              <select className="form-select custom-input py-2 border-0 text-white" style={{ background: 'rgba(255,255,255,0.03)', direction: 'rtl' }}>
                <option>Stripe & PayPal</option>
                <option>Mada & Visa</option>
              </select>
            </div>
            <button className="btn fw-bold btn-primary-cta py-2 px-4 w-100 mt-2" style={{ fontSize: '14px' }}>حفظ التغييرات</button>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4 rounded-3 h-100">
            <h3 className="h5 text-white fw-bold mb-4" style={{ fontFamily: 'var(--font-sans)' }}>الأمان</h3>
            <div className="mb-3">
              <label className="form-label text-muted" style={{ fontSize: '13px' }}>كلمة المرور الحالية</label>
              <input type="password" className="form-control custom-input py-2 border-0" placeholder="••••••••" style={{ background: 'rgba(255,255,255,0.03)', direction: 'ltr', textAlign: 'left' }} />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted" style={{ fontSize: '13px' }}>كلمة المرور الجديدة</label>
              <input type="password" className="form-control custom-input py-2 border-0" placeholder="••••••••" style={{ background: 'rgba(255,255,255,0.03)', direction: 'ltr', textAlign: 'left' }} />
            </div>
            <button className="btn fw-bold btn-secondary-cta py-2 px-4 w-100 mt-4" style={{ fontSize: '14px' }}>تحديث كلمة المرور</button>
          </div>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'نظرة عامة': return renderOverview();
      case 'إدارة الكورسات': return renderCourses();
      case 'المدربون': return renderInstructors();
      case 'الإعدادات': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <>
      {/* ── Desktop Layout ── */}
      <div className="admin-shell d-flex min-vh-100" style={{ paddingTop: '64px', backgroundColor: '#0b0e11' }}>

        {/* Sidebar — hidden on mobile (< 768px), visible on md+ */}
        <aside
          className="admin-sidebar d-none d-md-flex flex-column justify-content-between py-4 border-start"
          style={{
            width: sidebarOpen ? '260px' : '72px',
            minWidth: sidebarOpen ? '260px' : '72px',
            backgroundColor: '#111417',
            borderColor: 'rgba(255,255,255,0.05)',
            minHeight: 'calc(100vh - 64px)',
            transition: 'width 0.3s ease, min-width 0.3s ease',
            flexShrink: 0,
          }}
        >
          <div className="d-flex flex-column gap-4">
            {/* Toggle */}
            <div className="px-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn p-0 border-0 bg-transparent text-muted interactive"
                style={{ width: '32px', height: '32px' }}
              >
                <span className="material-symbols-outlined">{sidebarOpen ? 'menu_open' : 'menu'}</span>
              </button>
            </div>

            {/* Nav */}
            <nav className="d-flex flex-column gap-1 mt-2">
              {NAV_TABS.map((tab) => {
                const isTabActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className="btn border-0 d-flex align-items-center gap-3 py-3 rounded-0 w-100 interactive"
                    style={{
                      backgroundColor: isTabActive ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
                      color: isTabActive ? '#00e676' : '#bacbb9',
                      paddingRight: sidebarOpen ? '24px' : '0',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      borderRight: isTabActive ? '3px solid #00e676' : '3px solid transparent',
                      textAlign: 'start',
                    }}
                  >
                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '22px' }}>{tab.icon}</span>
                    {sidebarOpen && (
                      <span style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: isTabActive ? '700' : '500' }}>
                        {tab.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Profile */}
          <div
            className="d-flex align-items-center gap-3 pt-4 border-top px-3 mt-4"
            style={{ borderColor: 'rgba(255,255,255,0.05)', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
          >
            <div className="rounded-circle border flex-shrink-0" style={{ width: '40px', height: '40px', borderColor: '#00e676', overflow: 'hidden' }}>
              <img alt="المشرف" className="w-100 h-100 object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdHC77LmwG49gMXeUdo3BC4CnzdYGLc7uanWx7xgzaRtYs51ey0rTNn8TOqZGAJ_Txqm9XO0GeWU9ImvH0TCi5H9DEO35GP8X74Z1DPBwEGL4RI3QzjAKgrqZA0vgYoFEGOFVYtqKASdSlI_v4EcfFKnPOuTr6RnJrNQngfAPUT6h6Yd2T0wQ9grK08GiCIxcIcHHEy5lPcPoQUIRnSLSZ2tPwPIr_5X9Opl2RO6UkMh1NTa_dlXJxdUB8mfGhxoFVrdnPVqvMj4Yr"
              />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="m-0 text-white fw-bold text-truncate" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>د. إيلينا فانس</p>
                <p className="m-0 font-mono-data text-uppercase" style={{ fontSize: '11px', color: '#7c8e7c' }}>مشرف النظام</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow-1 overflow-x-hidden" style={{ paddingBottom: '80px' }}>
          <div className="p-3 p-md-4 p-lg-5">
            <div className="container-fluid p-0" style={{ maxWidth: '1200px' }}>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar (visible only on < 768px) ── */}
      <nav className="admin-mobile-tabs d-flex d-md-none">
        {NAV_TABS.map((tab) => {
          const isTabActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className="btn border-0 flex-fill d-flex flex-column align-items-center justify-content-center gap-1 py-2"
              style={{
                backgroundColor: 'transparent',
                color: isTabActive ? '#00e676' : '#6b7280',
                transition: 'color 0.2s ease',
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: isTabActive ? "'FILL' 1" : "'FILL' 0" }}>
                {tab.icon}
              </span>
              <span style={{ fontWeight: isTabActive ? '700' : '400' }}>{tab.name}</span>
              {isTabActive && (
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#00e676', boxShadow: '0 0 6px #00e676' }} />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
