import { useEffect, useMemo, useState } from 'react';
import AdminCourses from './AdminCourses';
import AdminCurriculum from './AdminCurriculum';
import AdminInstructors from './AdminInstructors';
import AdminMessages from './AdminMessages';
import AdminQuizManager from './AdminQuizManager';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import AdminChatRooms from './AdminChatRooms';
import ProfileSettings from './ProfileSettings';
import AdminActivityWidget from '../components/AdminActivityWidget';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: 'grid_view' },
  { id: 'courses', label: 'إدارة الكورسات', icon: 'auto_stories' },
  { id: 'curriculum', label: 'المحتوى التعليمي', icon: 'menu_book' },
  { id: 'quizzes', label: 'الاختبارات', icon: 'quiz' },
  { id: 'instructors', label: 'المدربون', icon: 'group' },
  { id: 'users', label: 'المستخدمون', icon: 'people' },
  { id: 'messages', label: 'الرسائل', icon: 'forum' },
  { id: 'chat-rooms', label: 'غرف الدردشة', icon: 'video_camera_front' },
  { id: 'profile', label: 'الملف الشخصي', icon: 'account_circle' },
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
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

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

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/admin/contact-messages`, { headers: apiHeaders(token) })
      .then(r => r.json())
      .then(json => setUnreadMsgCount(json.unread_count ?? 0))
      .catch(() => {});
  }, [token, activeTab]);

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

          <section style={{ marginTop: '24px' }}>
            <AdminActivityWidget />
          </section>
        </>
      )}
    </>
  );

  const renderContent = () => {
    if (activeTab === 'courses') return <AdminCourses />;
    if (activeTab === 'curriculum') return <AdminCurriculum />;
    if (activeTab === 'quizzes') return <AdminQuizManager />;
    if (activeTab === 'instructors') return <AdminInstructors />;
    if (activeTab === 'users') return <AdminUsers />;
    if (activeTab === 'messages') {
      return <AdminMessages onUnreadCountChange={setUnreadMsgCount} />;
    }
    if (activeTab === 'chat-rooms') return <AdminChatRooms />;
    if (activeTab === 'profile') return <ProfileSettings />;
    if (activeTab === 'settings') return <AdminSettings />;
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
                const showUnreadCount = tab.id === 'messages' && unreadMsgCount > 0;

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
                      <>
                        <span style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: selected ? 700 : 500 }}>
                          {tab.label}
                        </span>
                        {showUnreadCount && (
                          <span
                            className="rounded-pill px-2 py-1 me-auto"
                            style={{ color: '#81cfff', background: 'rgba(129,207,255,0.14)', fontSize: '10px' }}
                          >
                            {unreadMsgCount}
                          </span>
                        )}
                      </>
                    )}
                    {!sidebarOpen && showUnreadCount && (
                      <span
                        className="position-absolute rounded-circle"
                        style={{ width: '8px', height: '8px', background: '#81cfff', transform: 'translate(-13px, -12px)' }}
                        aria-label={`${unreadMsgCount} رسائل غير مقروءة`}
                      />
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
            <UserAvatar 
              name={user?.name || 'A'} 
              avatarUrl={user?.avatar_url || null} 
              size={40} 
            />
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
          const showUnreadCount = tab.id === 'messages' && unreadMsgCount > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="btn border-0 flex-fill d-flex flex-column align-items-center justify-content-center gap-1 py-2 position-relative"
              style={{
                backgroundColor: 'transparent',
                color: selected ? '#00e676' : '#6b7280',
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '21px' }}>{tab.icon}</span>
              <span style={{ fontWeight: selected ? 700 : 400 }}>{tab.label}</span>
              {showUnreadCount && (
                <span
                  className="position-absolute rounded-pill px-1"
                  style={{ top: '3px', left: 'calc(50% - 20px)', color: '#0b0e11', background: '#81cfff', fontSize: '9px', minWidth: '16px' }}
                >
                  {unreadMsgCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
