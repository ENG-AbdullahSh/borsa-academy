import { useEffect, useMemo, useState } from 'react';
import AdminCourses from './AdminCourses';
import AdminCurriculum from './AdminCurriculum';
import AdminInstructors from './AdminInstructors';
import AdminMessages from './AdminMessages';
import AdminQuizManager from './AdminQuizManager';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import ProfileSettings from './ProfileSettings';
import AdminActivityWidget from '../components/AdminActivityWidget';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

/* ── Tabs definition ─────────────────────────────────────────── */
const MAIN_TABS = [
  { id: 'overview',     label: 'نظرة عامة',       icon: 'grid_view' },
  { id: 'courses',      label: 'الكورسات',          icon: 'auto_stories' },
  { id: 'users',        label: 'المستخدمون',        icon: 'people' },
  { id: 'messages',     label: 'الرسائل',           icon: 'forum' },
];

const MORE_TABS = [
  { id: 'curriculum',  label: 'المحتوى التعليمي',  icon: 'menu_book' },
  { id: 'quizzes',     label: 'الاختبارات',         icon: 'quiz' },
  { id: 'instructors', label: 'المدربون',            icon: 'group' },
  { id: 'profile',     label: 'الملف الشخصي',      icon: 'account_circle' },
  { id: 'settings',    label: 'الإعدادات',          icon: 'settings' },
];

const ALL_TABS = [...MAIN_TABS, ...MORE_TABS];

/* sidebar grouping */
const SIDEBAR_GROUPS = [
  {
    label: 'الرئيسية',
    tabs: [
      { id: 'overview',    label: 'نظرة عامة',      icon: 'grid_view' },
      { id: 'courses',     label: 'إدارة الكورسات', icon: 'auto_stories' },
      { id: 'curriculum',  label: 'المحتوى التعليمي',icon: 'menu_book' },
      { id: 'quizzes',     label: 'الاختبارات',      icon: 'quiz' },
    ],
  },
  {
    label: 'الإدارة',
    tabs: [
      { id: 'instructors', label: 'المدربون',        icon: 'group' },
      { id: 'users',       label: 'المستخدمون',      icon: 'people' },
      { id: 'messages',    label: 'الرسائل',          icon: 'forum' },
    ],
  },
  {
    label: 'الحساب',
    tabs: [
      { id: 'profile',  label: 'الملف الشخصي',     icon: 'account_circle' },
      { id: 'settings', label: 'الإعدادات',          icon: 'settings' },
    ],
  },
];

/* ── Empty state ─────────────────────────────────────────────── */
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

/* ── Helpers ─────────────────────────────────────────────────── */
function progressStatus(enrollment) {
  if (enrollment.completed || Number(enrollment.progress) >= 100)
    return { label: 'مكتمل', color: '#75ff9e', background: 'rgba(117,255,158,0.1)' };
  if (Number(enrollment.progress) > 0)
    return { label: 'قيد التقدم', color: '#81cfff', background: 'rgba(129,207,255,0.1)' };
  return { label: 'لم يبدأ', color: '#bacbb9', background: 'rgba(255,255,255,0.05)' };
}

function formatDate(value) {
  if (!value) return 'غير متاح';
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(value));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء النور';
}

/* ═══════════════════════════════════════════════════════════════
   AdminDashboard
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab]         = useState('overview');
  const [initialLessonId, setInitialLessonId] = useState('');
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [dashboard, setDashboard]         = useState(EMPTY_DASHBOARD);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [retryKey, setRetryKey]           = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  /* fetch dashboard stats */
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
            ? payload.recent_enrollments : [],
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setDashboard(EMPTY_DASHBOARD);
          setError('تعذر تحميل بيانات لوحة التحكم. تأكد من تشغيل Laravel API.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => controller.abort();
  }, [retryKey, token]);

  /* fetch unread messages count */
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/admin/contact-messages`, { headers: apiHeaders(token) })
      .then(r => r.json())
      .then(json => setUnreadMsgCount(json.unread_count ?? 0))
      .catch(() => {});
  }, [token, activeTab]);

  /* stat cards config */
  const statCards = useMemo(() => ([
    {
      label: 'إجمالي الكورسات',
      value: dashboard.stats.total_courses,
      icon: 'auto_stories',
      color: '#75ff9e',
      colorClass: 'color-green',
      iconBg: 'rgba(117,255,158,0.12)',
      note: `${dashboard.stats.published_courses} منشور`,
    },
    {
      label: 'الطلاب المسجلون',
      value: dashboard.stats.total_students,
      icon: 'group',
      color: '#81cfff',
      colorClass: 'color-blue',
      iconBg: 'rgba(129,207,255,0.12)',
      note: 'حسابات الطلاب الفعلية',
    },
    {
      label: 'إجمالي الاشتراكات',
      value: dashboard.stats.total_enrollments,
      icon: 'how_to_reg',
      color: '#ffd54f',
      colorClass: 'color-yellow',
      iconBg: 'rgba(255,213,79,0.12)',
      note: `${dashboard.stats.completed_enrollments} دورة مكتملة`,
    },
    {
      label: 'الشهادات الصادرة',
      value: dashboard.stats.total_certificates,
      icon: 'workspace_premium',
      color: '#d4af37',
      colorClass: 'color-gold',
      iconBg: 'rgba(212,175,55,0.12)',
      note: 'شهادات الإتمام الصادرة',
    },
    {
      label: 'متوسط التقدم',
      value: `${dashboard.stats.average_progress}%`,
      icon: 'monitoring',
      color: '#ffb4ab',
      colorClass: 'color-pink',
      iconBg: 'rgba(255,180,171,0.12)',
      note: 'متوسط جميع الاشتراكات',
    },
  ]), [dashboard.stats]);

  /* tab navigation */
  const handleTabChange = (tabId) => {
    if (tabId !== 'quizzes') setInitialLessonId('');
    setActiveTab(tabId);
    setMoreDrawerOpen(false);
  };

  /* render overview */
  const renderOverview = () => (
    <>
      {/* Header */}
      <div className="admin-overview-header">
        <div className="d-flex align-items-start align-items-sm-center justify-content-between gap-3 flex-column flex-sm-row">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '13px', color: '#75ff9e', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: '4px', letterSpacing: '0.02em' }}>
              {getGreeting()}، {user?.name || 'مدير النظام'} 👋
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)', marginBottom: '6px', lineHeight: 1.2 }}>
              مركز التحكم
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'var(--font-sans)', margin: 0 }}>
              بيانات مباشرة من الكورسات والطلاب والاشتراكات.
            </p>
          </div>
          <span className="admin-live-badge" style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <span className="admin-live-dot" />
            LIVE DATA
          </span>
        </div>
      </div>

      {error ? (
        <div className="glass-card rounded-3 p-5 text-center">
          <span className="material-symbols-outlined text-muted" style={{ fontSize: '52px' }}>cloud_off</span>
          <h2 className="h5 text-white mt-3">{error}</h2>
          <button
            type="button"
            onClick={() => setRetryKey(k => k + 1)}
            className="btn btn-primary-cta mt-3 px-4 py-2 fw-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <section className="row g-3 mb-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="col-12 col-sm-6 col-xl">
                <article className={`admin-stat-card ${stat.colorClass}`}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="admin-stat-icon"
                      style={{ background: stat.iconBg }}
                    >
                      <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>
                        {stat.icon}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: 800,
                        color: loading ? 'transparent' : '#fff',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1,
                        position: 'relative',
                      }}
                    >
                      {loading
                        ? <span className="admin-skeleton d-inline-block" style={{ width: '60px', height: '32px' }} />
                        : stat.value}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '13.5px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
                    {stat.label}
                  </h2>
                  <p style={{ fontSize: '11.5px', color: '#475569', margin: 0, fontFamily: 'var(--font-sans)' }}>
                    {stat.note}
                  </p>
                </article>
              </div>
            ))}
          </section>

          {/* Recent Enrollments */}
          <section className="glass-card rounded-4 overflow-hidden mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(129,207,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: '#81cfff', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                    how_to_reg
                  </span>
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--font-sans)', margin: 0 }}>
                    أحدث الاشتراكات
                  </h2>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                    آخر عمليات الاشتراك المسجلة فعلياً
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-5 text-center">
                <span className="spinner-border spinner-border-sm" style={{ color: '#75ff9e' }} aria-hidden="true" />
                <p className="text-muted mt-3 mb-0" style={{ fontSize: '13px' }}>جاري تحميل البيانات...</p>
              </div>
            ) : dashboard.recent_enrollments.length === 0 ? (
              <div className="py-5 text-center">
                <span className="material-symbols-outlined" style={{ fontSize: '46px', color: '#334155' }}>inbox</span>
                <p style={{ color: '#475569', marginTop: '12px', marginBottom: 0, fontSize: '14px' }}>
                  لا توجد اشتراكات مسجلة بعد.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-borderless align-middle mb-0" style={{ direction: 'rtl' }}>
                  <thead>
                    <tr style={{ fontSize: '11.5px', color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th className="px-4 py-3" style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>الطالب</th>
                      <th className="px-4 py-3" style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>الكورس</th>
                      <th className="px-4 py-3" style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>تاريخ الاشتراك</th>
                      <th className="px-4 py-3 text-center" style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>التقدم</th>
                      <th className="px-4 py-3 text-center" style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recent_enrollments.map((enrollment) => {
                      const status = progressStatus(enrollment);
                      return (
                        <tr key={enrollment.id} className="admin-enrollment-row">
                          <td className="px-4 py-3">
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                              {enrollment.student?.name || 'طالب غير متاح'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569' }} dir="ltr">
                              {enrollment.student?.email || ''}
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '13px', color: '#94a3b8' }}>
                            {enrollment.course?.title || 'كورس غير متاح'}
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                            {formatDate(enrollment.enrolled_at)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#75ff9e', fontFamily: 'var(--font-mono)' }}>
                              {Number(enrollment.progress || 0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              style={{
                                color: status.color,
                                background: status.background,
                                fontSize: '11px',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                fontFamily: 'var(--font-sans)',
                              }}
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

          <section>
            <AdminActivityWidget />
          </section>
        </>
      )}
    </>
  );

  /* render content by tab */
  const renderContent = () => {
    if (activeTab === 'courses') return <AdminCourses />;
    if (activeTab === 'curriculum') {
      return (
        <AdminCurriculum
          onLessonCreated={(lesson) => {
            setInitialLessonId(lesson ? String(lesson.id) : '');
            setActiveTab('quizzes');
          }}
        />
      );
    }
    if (activeTab === 'quizzes')     return <AdminQuizManager initialLessonId={initialLessonId} />;
    if (activeTab === 'instructors') return <AdminInstructors />;
    if (activeTab === 'users')       return <AdminUsers />;
    if (activeTab === 'messages')    return <AdminMessages onUnreadCountChange={setUnreadMsgCount} />;
    if (activeTab === 'profile')     return <ProfileSettings />;
    if (activeTab === 'settings')    return <AdminSettings />;
    return renderOverview();
  };

  const isMoreActive = MORE_TABS.some(t => t.id === activeTab);

  return (
    <>
      {/* ══════════ MAIN LAYOUT ══════════ */}
      <div
        className="admin-shell d-flex"
        style={{ paddingTop: '64px', minHeight: '100vh', direction: 'rtl' }}
      >
        {/* ── Sidebar (desktop) ── */}
        <aside
          className="admin-sidebar d-none d-md-flex flex-column justify-content-between py-3"
          style={{
            width: sidebarOpen ? '256px' : '68px',
            minWidth: sidebarOpen ? '256px' : '68px',
            minHeight: 'calc(100vh - 64px)',
            transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), min-width 0.3s cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Toggle */}
          <div className="d-flex flex-column gap-2">
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(o => !o)}
                className="btn p-0 border-0 bg-transparent"
                aria-label={sidebarOpen ? 'طي القائمة' : 'فتح القائمة'}
                style={{ width: '34px', height: '34px', color: '#475569', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  {sidebarOpen ? 'menu_open' : 'menu'}
                </span>
              </button>
            </div>

            {/* Nav groups */}
            <nav className="d-flex flex-column">
              {SIDEBAR_GROUPS.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <div className="admin-sidebar-divider" />}
                  {sidebarOpen && (
                    <span className="admin-section-label mb-1 mt-2">
                      {group.label}
                    </span>
                  )}
                  {group.tabs.map((tab) => {
                    const selected = activeTab === tab.id;
                    const showBadge = tab.id === 'messages' && unreadMsgCount > 0;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`admin-nav-btn d-flex align-items-center gap-2 py-2 px-3 ${selected ? 'is-active' : ''}`}
                        style={{
                          justifyContent: sidebarOpen ? 'flex-start' : 'center',
                          minHeight: '44px',
                        }}
                        title={!sidebarOpen ? tab.label : undefined}
                      >
                        <span className="admin-nav-active-bar" />
                        <div className="admin-nav-icon-wrap">
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: '20px',
                              color: selected ? '#00e676' : '#64748b',
                              fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0",
                              transition: 'color 0.2s, font-variation-settings 0.2s',
                            }}
                          >
                            {tab.icon}
                          </span>
                        </div>
                        {sidebarOpen && (
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontFamily: 'var(--font-sans)',
                              fontWeight: selected ? 700 : 500,
                              color: selected ? '#e2e8f0' : '#64748b',
                              transition: 'color 0.2s, font-weight 0.2s',
                              flex: 1,
                            }}
                          >
                            {tab.label}
                          </span>
                        )}
                        {sidebarOpen && showBadge && (
                          <span
                            style={{
                              background: '#81cfff',
                              color: '#0b0e11',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px',
                              minWidth: '20px',
                              textAlign: 'center',
                            }}
                          >
                            {unreadMsgCount}
                          </span>
                        )}
                        {!sidebarOpen && showBadge && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '8px',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#81cfff',
                              boxShadow: '0 0 6px rgba(129,207,255,0.6)',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* User info at bottom */}
          <div className="px-2 pb-2">
            <div className="admin-sidebar-divider mb-3" />
            <div
              className="admin-sidebar-user d-flex align-items-center gap-2"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
            >
              <UserAvatar
                name={user?.name || 'A'}
                avatarUrl={user?.avatar_url || null}
                size={34}
              />
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'مدير النظام'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '155px' }} dir="ltr">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-grow-1 overflow-x-hidden" style={{ minWidth: 0 }}>
          <div className="admin-content-area">
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
      <nav className="admin-mobile-nav" aria-label="قائمة لوحة التحكم">
        {/* Primary tabs */}
        {MAIN_TABS.map((tab) => {
          const selected = activeTab === tab.id;
          const showBadge = tab.id === 'messages' && unreadMsgCount > 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`admin-mobile-nav-btn ${selected ? 'is-active' : ''}`}
              aria-label={tab.label}
            >
              <div className="admin-mobile-nav-icon" style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '22px',
                    color: selected ? '#00e676' : '#475569',
                    fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0",
                    transition: 'color 0.2s',
                  }}
                >
                  {tab.icon}
                </span>
                {showBadge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#81cfff',
                      boxShadow: '0 0 6px rgba(129,207,255,0.7)',
                    }}
                  />
                )}
              </div>
              <span
                className="admin-mobile-nav-label"
                style={{ color: selected ? '#00e676' : '#475569' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* "More" button */}
        <button
          type="button"
          onClick={() => setMoreDrawerOpen(true)}
          className={`admin-mobile-nav-btn ${isMoreActive ? 'is-active' : ''}`}
          aria-label="المزيد"
        >
          <div className="admin-mobile-nav-icon">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '22px',
                color: isMoreActive ? '#00e676' : '#475569',
                transition: 'color 0.2s',
              }}
            >
              more_horiz
            </span>
          </div>
          <span
            className="admin-mobile-nav-label"
            style={{ color: isMoreActive ? '#00e676' : '#475569' }}
          >
            المزيد
          </span>
        </button>
      </nav>

      {/* ══════════ MORE DRAWER (mobile) ══════════ */}
      <div
        className={`admin-more-overlay ${moreDrawerOpen ? 'open' : ''}`}
        onClick={() => setMoreDrawerOpen(false)}
        role="presentation"
      />
      <div
        className={`admin-more-drawer ${moreDrawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="قائمة إضافية"
      >
        <div className="admin-drawer-handle" />
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', fontFamily: 'var(--font-sans)', textAlign: 'center', marginBottom: '12px', letterSpacing: '0.05em' }}>
          المزيد من الخيارات
        </p>
        <div className="admin-drawer-grid">
          {MORE_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            const showBadge = tab.id === 'messages' && unreadMsgCount > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`admin-drawer-btn ${selected ? 'is-active' : ''}`}
                aria-label={tab.label}
              >
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '24px',
                      color: selected ? '#00e676' : '#64748b',
                      fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0",
                      transition: 'color 0.2s',
                    }}
                  >
                    {tab.icon}
                  </span>
                  {showBadge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#81cfff',
                      }}
                    />
                  )}
                </div>
                <span
                  className="admin-drawer-btn-label"
                  style={{ color: selected ? '#00e676' : '#94a3b8' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
