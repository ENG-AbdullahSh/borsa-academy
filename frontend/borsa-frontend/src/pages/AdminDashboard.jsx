import { useEffect, useMemo, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AdminCourses from './AdminCourses';
import AdminCurriculum from './AdminCurriculum';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: 'grid_view' },
  { id: 'courses', label: 'إدارة الكورسات', icon: 'auto_stories' },
  { id: 'curriculum', label: 'المحتوى التعليمي', icon: 'menu_book' },
  { id: 'instructors', label: 'المدربون', icon: 'group' },
  { id: 'settings', label: 'الإعدادات', icon: 'settings' },
];

const EMPTY_DASHBOARD = {
  stats: {
    total_courses: 0,
    published_courses: 0,
    total_students: 0,
    total_enrollments: 0,
    completed_enrollments: 0,
    average_progress: 0,
    total_certificates: 0,
  },
  recent_enrollments: [],
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}) {
  const visibilityLabel = visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور';

  return (
    <div className="mb-3">
      <label className="form-label text-muted" htmlFor={id} style={{ fontSize: '13px' }}>
        {label}
      </label>
      <div className="position-relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="form-control custom-input py-2 border-0"
          placeholder="••••••••"
          autoComplete={autoComplete}
          style={{
            background: 'rgba(255,255,255,0.03)',
            direction: 'ltr',
            textAlign: 'left',
            paddingLeft: '46px',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visibilityLabel}
          aria-pressed={visible}
          aria-controls={id}
          title={visibilityLabel}
          className="btn border-0 position-absolute d-flex align-items-center justify-content-center"
          style={{
            left: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
            color: '#bacbb9',
            background: 'transparent',
          }}
        >
          {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <section className="glass-card rounded-3 px-4 py-5 text-center">
      <span className="material-symbols-outlined mb-3" style={{ color: '#75ff9e', fontSize: '52px' }}>
        {icon}
      </span>
      <h2 className="h5 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>{title}</h2>
      <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '560px', lineHeight: 1.8, fontSize: '14px' }}>
        {description}
      </p>
    </section>
  );
}

function progressStatus(enrollment) {
  if (enrollment.completed || Number(enrollment.progress) >= 100) {
    return { label: 'مكتمل', color: '#75ff9e', background: 'rgba(117,255,158,0.1)' };
  }

  if (Number(enrollment.progress) > 0) {
    return { label: 'قيد التقدم', color: '#81cfff', background: 'rgba(129,207,255,0.1)' };
  }

  return { label: 'لم يبدأ', color: '#bacbb9', background: 'rgba(255,255,255,0.05)' };
}

function formatDate(value) {
  if (!value) return 'غير متاح';

  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirmation: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirmation: false,
  });

  useEffect(() => {
    if (!token) return undefined;

    const controller = new AbortController();

    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: apiHeaders(token),
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);

        setDashboard({
          stats: { ...EMPTY_DASHBOARD.stats, ...(payload.stats || {}) },
          recent_enrollments: Array.isArray(payload.recent_enrollments)
            ? payload.recent_enrollments
            : [],
        });
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setDashboard(EMPTY_DASHBOARD);
          setError('تعذر تحميل بيانات لوحة التحكم. تأكد من تشغيل Laravel API.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [retryKey, token]);

  const statCards = useMemo(() => ([
    {
      label: 'إجمالي الكورسات',
      value: dashboard.stats.total_courses,
      icon: 'auto_stories',
      color: '#75ff9e',
      note: `${dashboard.stats.published_courses} منشور`,
    },
    {
      label: 'الطلاب المسجلون',
      value: dashboard.stats.total_students,
      icon: 'group',
      color: '#81cfff',
      note: 'حسابات الطلاب الفعلية',
    },
    {
      label: 'إجمالي الاشتراكات',
      value: dashboard.stats.total_enrollments,
      icon: 'how_to_reg',
      color: '#ffd54f',
      note: `${dashboard.stats.completed_enrollments} دورة مكتملة`,
    },
    {
      label: 'الشهادات الصادرة',
      value: dashboard.stats.total_certificates,
      icon: 'workspace_premium',
      color: '#d4af37',
      note: 'شهادات الإتمام الصادرة',
    },
    {
      label: 'متوسط التقدم',
      value: `${dashboard.stats.average_progress}%`,
      icon: 'monitoring',
      color: '#ffb4ab',
      note: 'متوسط جميع الاشتراكات',
    },
  ]), [dashboard.stats]);

  const togglePassword = (field) => {
    setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
  };

  const updatePasswordField = (field, value) => {
    setPasswords((current) => ({ ...current, [field]: value }));
  };

  const renderOverview = () => (
    <>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
            مركز التحكم
          </h1>
          <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            بيانات مباشرة من الكورسات والطلاب والاشتراكات المسجلة في النظام.
          </p>
        </div>
        <span
          className="px-3 py-2 rounded font-mono-data"
          style={{ color: '#75ff9e', background: 'rgba(117,255,158,0.08)', fontSize: '11px' }}
        >
          LIVE DATA
        </span>
      </div>

      {error ? (
        <section className="glass-card rounded-3 p-5 text-center">
          <span className="material-symbols-outlined text-muted" style={{ fontSize: '52px' }}>cloud_off</span>
          <h2 className="h5 text-white mt-3">{error}</h2>
          <button
            type="button"
            onClick={() => setRetryKey((current) => current + 1)}
            className="btn btn-primary-cta mt-3 px-4 py-2 fw-bold"
          >
            إعادة المحاولة
          </button>
        </section>
      ) : (
        <>
          <section className="row g-3 mb-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="col-12 col-sm-6 col-xl">
                <article className="glass-card p-4 rounded-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '31px' }}>{stat.icon}</span>
                    <span className="text-white fw-bold font-mono-data" style={{ fontSize: '28px' }}>
                      {loading ? '...' : stat.value}
                    </span>
                  </div>
                  <h2 className="h6 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>{stat.label}</h2>
                  <p className="text-muted mb-0" style={{ fontSize: '12px' }}>{stat.note}</p>
                </article>
              </div>
            ))}
          </section>

          <section className="glass-card p-4 rounded-3">
            <div className="mb-4">
              <h2 className="h6 text-white fw-bold mb-1" style={{ fontFamily: 'var(--font-sans)' }}>أحدث الاشتراكات</h2>
              <p className="text-muted m-0" style={{ fontSize: '12px' }}>آخر عمليات الاشتراك المسجلة فعلياً.</p>
            </div>

            {loading ? (
              <div className="py-5 text-center">
                <span className="spinner-border spinner-border-sm" style={{ color: '#75ff9e' }} aria-hidden="true" />
                <p className="text-muted mt-3 mb-0">جاري تحميل البيانات...</p>
              </div>
            ) : dashboard.recent_enrollments.length === 0 ? (
              <div className="py-5 text-center">
                <span className="material-symbols-outlined text-muted" style={{ fontSize: '46px' }}>inbox</span>
                <p className="text-muted mt-3 mb-0">لا توجد اشتراكات مسجلة بعد.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover table-borderless align-middle mb-0" style={{ direction: 'rtl' }}>
                  <thead>
                    <tr style={{ color: '#bacbb9', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th className="px-3 py-3">الطالب</th>
                      <th className="px-3 py-3">الكورس</th>
                      <th className="px-3 py-3">تاريخ الاشتراك</th>
                      <th className="px-3 py-3 text-center">التقدم</th>
                      <th className="px-3 py-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recent_enrollments.map((enrollment) => {
                      const status = progressStatus(enrollment);

                      return (
                        <tr key={enrollment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="px-3 py-3">
                            <div className="text-white fw-semibold" style={{ fontSize: '13px' }}>
                              {enrollment.student?.name || 'طالب غير متاح'}
                            </div>
                            <div className="text-muted" dir="ltr" style={{ fontSize: '11px', textAlign: 'right' }}>
                              {enrollment.student?.email || ''}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-muted" style={{ fontSize: '13px' }}>
                            {enrollment.course?.title || 'كورس غير متاح'}
                          </td>
                          <td className="px-3 py-3 text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {formatDate(enrollment.enrolled_at)}
                          </td>
                          <td className="px-3 py-3 text-center font-mono-data" style={{ color: '#75ff9e' }}>
                            {Number(enrollment.progress || 0)}%
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className="px-3 py-1 rounded"
                              style={{ color: status.color, background: status.background, fontSize: '11px', whiteSpace: 'nowrap' }}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );

  const renderInstructors = () => (
    <>
      <div className="mb-4">
        <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>المدربون</h1>
        <p className="text-muted m-0" style={{ fontSize: '14px' }}>إدارة حسابات المدربين وتخصصاتهم.</p>
      </div>
      <EmptyState
        icon="construction"
        title="إدارة المدربين قيد التطوير"
        description="لا توجد واجهة خلفية لإدارة المدربين حالياً. ستظهر الحسابات والتخصصات وإحصاءات الطلاب هنا بعد إضافة وحدة المدربين، لذلك تمت إزالة جميع الأسماء والأرقام التجريبية."
      />
    </>
  );

  const renderSettings = () => (
    <>
      <div className="mb-4">
        <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>الإعدادات</h1>
        <p className="text-muted m-0" style={{ fontSize: '14px' }}>إعدادات المنصة العامة والأمان.</p>
      </div>

      <div
        className="rounded-3 px-4 py-3 mb-4 d-flex align-items-start gap-3"
        role="status"
        style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)', color: '#ffd54f' }}
      >
        <span className="material-symbols-outlined">info</span>
        <div>
          <strong className="d-block mb-1">إعدادات تجريبية غير مفعلة بعد</strong>
          <span style={{ color: '#bacbb9', fontSize: '13px' }}>
            الحقول التالية للمعاينة فقط ولا يتم حفظها أو إرسالها إلى الخادم.
          </span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <section className="glass-card p-4 rounded-3 h-100">
            <h2 className="h5 text-white fw-bold mb-4" style={{ fontFamily: 'var(--font-sans)' }}>الإعدادات العامة</h2>
            <div className="mb-3">
              <label className="form-label text-muted" htmlFor="academy-name" style={{ fontSize: '13px' }}>اسم الأكاديمية</label>
              <input
                id="academy-name"
                type="text"
                className="form-control custom-input py-2 border-0"
                value="بورصة أكاديمي"
                disabled
                readOnly
                style={{ background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted" htmlFor="admin-email" style={{ fontSize: '13px' }}>البريد الإلكتروني للإدارة</label>
              <input
                id="admin-email"
                type="email"
                className="form-control custom-input py-2 border-0"
                value={user?.email || ''}
                disabled
                readOnly
                dir="ltr"
                style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted" htmlFor="payment-gateway" style={{ fontSize: '13px' }}>بوابات الدفع</label>
              <select
                id="payment-gateway"
                className="form-select custom-input py-2 border-0"
                value="unavailable"
                disabled
                onChange={() => {}}
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <option value="unavailable">غير مفعلة حالياً</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary-cta py-2 px-4 w-100 fw-bold" disabled>
              سيتم تفعيل الحفظ لاحقاً
            </button>
          </section>
        </div>

        <div className="col-12 col-lg-6">
          <section className="glass-card p-4 rounded-3 h-100">
            <h2 className="h5 text-white fw-bold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>تغيير كلمة المرور</h2>
            <p className="text-muted mb-4" style={{ fontSize: '12px', lineHeight: 1.7 }}>
              واجهة تغيير كلمة المرور غير مرتبطة بالخادم بعد. زر التحديث معطل ولا يتم حفظ أي قيمة.
            </p>
            <PasswordField
              id="admin-current-password"
              label="كلمة المرور الحالية"
              value={passwords.current}
              onChange={(value) => updatePasswordField('current', value)}
              visible={passwordVisibility.current}
              onToggle={() => togglePassword('current')}
              autoComplete="current-password"
            />
            <PasswordField
              id="admin-new-password"
              label="كلمة المرور الجديدة"
              value={passwords.next}
              onChange={(value) => updatePasswordField('next', value)}
              visible={passwordVisibility.next}
              onToggle={() => togglePassword('next')}
              autoComplete="new-password"
            />
            <PasswordField
              id="admin-confirm-password"
              label="تأكيد كلمة المرور الجديدة"
              value={passwords.confirmation}
              onChange={(value) => updatePasswordField('confirmation', value)}
              visible={passwordVisibility.confirmation}
              onToggle={() => togglePassword('confirmation')}
              autoComplete="new-password"
            />
            <button type="button" className="btn btn-secondary-cta py-2 px-4 w-100 fw-bold mt-2" disabled>
              سيتم تفعيل التحديث لاحقاً
            </button>
          </section>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    if (activeTab === 'courses') return <AdminCourses />;
    if (activeTab === 'curriculum') return <AdminCurriculum />;
    if (activeTab === 'instructors') return renderInstructors();
    if (activeTab === 'settings') return renderSettings();
    return renderOverview();
  };

  const profileInitial = (user?.name || user?.email || 'A').trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="admin-shell d-flex min-vh-100" style={{ paddingTop: '64px', backgroundColor: '#0b0e11', direction: 'rtl' }}>
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
            <div className="px-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((current) => !current)}
                className="btn p-0 border-0 bg-transparent text-muted"
                aria-label={sidebarOpen ? 'طي القائمة الجانبية' : 'فتح القائمة الجانبية'}
                style={{ width: '32px', height: '32px' }}
              >
                <span className="material-symbols-outlined">{sidebarOpen ? 'menu_open' : 'menu'}</span>
              </button>
            </div>

            <nav className="d-flex flex-column gap-1">
              {TABS.map((tab) => {
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="btn border-0 d-flex align-items-center gap-3 py-3 rounded-0 w-100"
                    style={{
                      backgroundColor: selected ? 'rgba(0,230,118,0.08)' : 'transparent',
                      color: selected ? '#00e676' : '#bacbb9',
                      paddingRight: sidebarOpen ? '24px' : '0',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      borderRight: selected ? '3px solid #00e676' : '3px solid transparent',
                    }}
                  >
                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '22px' }}>{tab.icon}</span>
                    {sidebarOpen && (
                      <span style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: selected ? 700 : 500 }}>
                        {tab.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div
            className="d-flex align-items-center gap-3 pt-4 border-top px-3 mt-4"
            style={{ borderColor: 'rgba(255,255,255,0.05)', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
              style={{ width: '40px', height: '40px', color: '#003918', background: '#75ff9e' }}
              aria-hidden="true"
            >
              {profileInitial}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="m-0 text-white fw-bold text-truncate" style={{ fontSize: '14px' }}>{user?.name || 'مدير النظام'}</p>
                <p className="m-0 text-muted text-truncate" dir="ltr" style={{ fontSize: '11px', maxWidth: '165px' }}>{user?.email}</p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-grow-1 overflow-x-hidden" style={{ paddingBottom: '82px' }}>
          <div className="p-3 p-md-4 p-lg-5">
            <div className="container-fluid p-0" style={{ maxWidth: '1200px' }}>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      <nav className="admin-mobile-tabs d-flex d-md-none" aria-label="أقسام لوحة التحكم">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="btn border-0 flex-fill d-flex flex-column align-items-center justify-content-center gap-1 py-2"
              style={{
                backgroundColor: 'transparent',
                color: selected ? '#00e676' : '#6b7280',
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '21px' }}>{tab.icon}</span>
              <span style={{ fontWeight: selected ? 700 : 400 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
