import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

const USERS_ENDPOINT = `${API_BASE_URL}/admin/users`;
const PER_PAGE = 15;

const ROLE_OPTIONS = [
  { value: 'student', label: 'طالب' },
  { value: 'instructor', label: 'مدرب' },
  { value: 'admin', label: 'مسؤول' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
  { value: 'suspended', label: 'موقوف' },
];

function roleStyle(role) {
  switch (role) {
    case 'admin':
      return { color: '#ffb4ab', background: 'rgba(255,180,171,0.1)' };
    case 'instructor':
      return { color: '#ffd54f', background: 'rgba(255,213,79,0.1)' };
    default:
      return { color: '#81cfff', background: 'rgba(129,207,255,0.1)' };
  }
}

function statusStyle(status) {
  switch (status) {
    case 'active':
      return { color: '#75ff9e', background: 'rgba(117,255,158,0.1)' };
    case 'suspended':
      return { color: '#ff8a80', background: 'rgba(255,138,128,0.1)' };
    default:
      return { color: '#bacbb9', background: 'rgba(186,203,185,0.1)' };
  }
}

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="position-fixed d-flex align-items-center justify-content-center p-3"
      style={{ inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-card rounded-3 w-100"
        style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(17,20,23,0.98)' }}
      >
        <div
          className="d-flex align-items-center justify-content-between p-4 border-bottom"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <h2 className="h5 text-white fw-bold m-0">{title}</h2>
          <button type="button" className="btn p-0 border-0 bg-transparent text-muted" onClick={onClose} aria-label="إغلاق">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const headers = useMemo(() => apiHeaders(token), [token]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!token) return undefined;

    const controller = new AbortController();

    const loadUsers = async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (role !== 'all') params.set('role', role);
      if (status !== 'all') params.set('status', status);

      try {
        const response = await fetch(`${USERS_ENDPOINT}?${params}`, {
          headers,
          signal: controller.signal,
        });
        const data = await readJsonResponse(response);

        setUsers(Array.isArray(data.data) ? data.data : []);
        setPagination({
          currentPage: data.current_page || 1,
          lastPage: data.last_page || 1,
          total: data.total || 0,
          from: data.from || 0,
          to: data.to || 0,
        });
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setUsers([]);
          setError(requestError.message || 'تعذر تحميل المستخدمين.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadUsers();
    return () => controller.abort();
  }, [debouncedSearch, headers, page, refreshKey, role, status, token]);

  const notify = (type, message) => {
    addNotification({
      type,
      title: type === 'success' ? 'نجاح' : 'خطأ',
      message,
    });
  };

  const updateUser = async (targetUser, field, value) => {
    if (targetUser.id === currentUser?.id && value !== targetUser[field]) {
      notify('error', field === 'status'
        ? 'لا يمكنك تغيير حالة حسابك الشخصي.'
        : 'لا يمكنك تغيير دور حسابك الشخصي.');
      return;
    }

    const operation = `${targetUser.id}:${field}`;
    setUpdating(operation);

    try {
      const response = await fetch(`${USERS_ENDPOINT}/${targetUser.id}/${field}`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify({ [field]: value }),
      });
      const data = await readJsonResponse(response);

      setUsers((current) => current.map((item) => (
        item.id === targetUser.id ? data.data : item
      )));
      setSelectedUser((current) => (
        current?.id === targetUser.id ? data.data : current
      ));
      notify('success', data.message || 'تم تحديث المستخدم بنجاح.');
    } catch (requestError) {
      notify('error', requestError.message || 'تعذر تحديث المستخدم.');
    } finally {
      setUpdating('');
    }
  };

  const viewUser = async (targetUser) => {
    setSelectedUser(targetUser);
    setDetailsLoading(true);

    try {
      const response = await fetch(`${USERS_ENDPOINT}/${targetUser.id}`, { headers });
      const data = await readJsonResponse(response);
      setSelectedUser(data.data);
    } catch (requestError) {
      setSelectedUser(null);
      notify('error', requestError.message || 'تعذر تحميل تفاصيل المستخدم.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeRoleFilter = (event) => {
    setRole(event.target.value);
    setPage(1);
  };

  const changeStatusFilter = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div>
          <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
            إدارة المستخدمين
          </h1>
          <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            البحث في الحسابات وتحديث الحالة أو الصلاحية دون حذف بيانات المستخدم.
          </p>
        </div>

        <section className="glass-card p-3 rounded-3 d-flex flex-wrap gap-3 align-items-center">
          <div className="flex-grow-1" style={{ minWidth: '220px' }}>
            <input
              type="search"
              placeholder="بحث بالاسم أو البريد..."
              className="form-control custom-input w-100"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="form-select custom-input"
            style={{ width: 'auto', minWidth: '140px' }}
            value={role}
            onChange={changeRoleFilter}
            aria-label="تصفية حسب الدور"
          >
            <option value="all">كل الأدوار</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            className="form-select custom-input"
            style={{ width: 'auto', minWidth: '140px' }}
            value={status}
            onChange={changeStatusFilter}
            aria-label="تصفية حسب الحالة"
          >
            <option value="all">كل الحالات</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </section>

        {error && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3 mb-0" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setRefreshKey((value) => value + 1)}>
              إعادة المحاولة
            </button>
          </div>
        )}

        <section className="glass-card p-4 rounded-3">
          <div className="d-flex justify-content-between align-items-center mb-3 text-muted" style={{ fontSize: '13px' }}>
            <span>إجمالي المستخدمين: {pagination.total}</span>
            {pagination.total > 0 && <span>عرض {pagination.from} - {pagination.to}</span>}
          </div>

          <div className="table-responsive" style={{ background: '#11151D', borderRadius: '12px', padding: '12px' }}>
            <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
              <thead>
                <tr style={{ fontSize: '12px', color: '#bacbb9', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="py-3 px-3">المستخدم</th>
                  <th className="py-3 px-3 text-center">الدور</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">الدورات</th>
                  <th className="py-3 px-3 text-center">الشهادات</th>
                  <th className="py-3 px-3 text-center">تاريخ الانضمام</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
                      جاري تحميل المستخدمين...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">لا يوجد مستخدمون مطابقون.</td>
                  </tr>
                ) : users.map((listedUser) => {
                  const isCurrentAdmin = listedUser.id === currentUser?.id;
                  const roleBusy = updating === `${listedUser.id}:role`;
                  const statusBusy = updating === `${listedUser.id}:status`;

                  return (
                    <tr key={listedUser.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-3 px-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                          </div>
                          <div>
                            <div className="text-white fw-bold" style={{ fontSize: '14px' }}>
                              {listedUser.name}
                              {isCurrentAdmin && <span className="text-muted fw-normal me-2">(أنت)</span>}
                            </div>
                            <div className="text-muted" dir="ltr" style={{ fontSize: '12px', textAlign: 'right' }}>
                              {listedUser.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          className="form-select form-select-sm custom-input mx-auto"
                          style={{ width: '115px', ...roleStyle(listedUser.role) }}
                          value={listedUser.role}
                          disabled={isCurrentAdmin || roleBusy || Boolean(updating)}
                          onChange={(event) => updateUser(listedUser, 'role', event.target.value)}
                          aria-label={`تغيير دور ${listedUser.name}`}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          className="form-select form-select-sm custom-input mx-auto"
                          style={{ width: '115px', ...statusStyle(listedUser.status) }}
                          value={listedUser.status}
                          disabled={isCurrentAdmin || statusBusy || Boolean(updating)}
                          onChange={(event) => updateUser(listedUser, 'status', event.target.value)}
                          aria-label={`تغيير حالة ${listedUser.name}`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center text-white">{listedUser.enrollments_count}</td>
                      <td className="py-3 px-3 text-center text-white">{listedUser.certificates_count}</td>
                      <td className="py-3 px-3 text-center text-muted" style={{ fontSize: '13px' }}>
                        {new Date(listedUser.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-edit-course fw-bold px-3"
                          onClick={() => viewUser(listedUser)}
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.lastPage > 1 && (
            <div className="d-flex align-items-center justify-content-center gap-3 mt-4">
              <button
                type="button"
                className="btn btn-sm btn-secondary-cta"
                disabled={loading || pagination.currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                السابق
              </button>
              <span className="text-muted" style={{ fontSize: '13px' }}>
                الصفحة {pagination.currentPage} من {pagination.lastPage}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary-cta"
                disabled={loading || pagination.currentPage >= pagination.lastPage}
                onClick={() => setPage((value) => Math.min(pagination.lastPage, value + 1))}
              >
                التالي
              </button>
            </div>
          )}
        </section>
      </div>

      {selectedUser && (
        <ModalShell title="تفاصيل المستخدم" onClose={() => setSelectedUser(null)}>
          {detailsLoading ? (
            <div className="text-center text-muted py-4">جاري تحميل التفاصيل...</div>
          ) : (
            <div className="d-flex flex-column gap-3" style={{ direction: 'rtl' }}>
              <div>
                <div className="text-muted small mb-1">الاسم</div>
                <div className="text-white fw-bold">{selectedUser.name}</div>
              </div>
              <div>
                <div className="text-muted small mb-1">البريد الإلكتروني</div>
                <div className="text-white" dir="ltr" style={{ textAlign: 'right' }}>{selectedUser.email}</div>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-muted small mb-1">الدور</div>
                  <span className="px-3 py-1 rounded" style={roleStyle(selectedUser.role)}>
                    {labelFor(ROLE_OPTIONS, selectedUser.role)}
                  </span>
                </div>
                <div className="col-6">
                  <div className="text-muted small mb-1">الحالة</div>
                  <span className="px-3 py-1 rounded" style={statusStyle(selectedUser.status)}>
                    {labelFor(STATUS_OPTIONS, selectedUser.status)}
                  </span>
                </div>
                <div className="col-6">
                  <div className="text-muted small mb-1">عدد الدورات</div>
                  <div className="text-white">{selectedUser.enrollments_count}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted small mb-1">عدد الشهادات</div>
                  <div className="text-white">{selectedUser.certificates_count}</div>
                </div>
              </div>
              <div>
                <div className="text-muted small mb-1">تاريخ الانضمام</div>
                <div className="text-white">{new Date(selectedUser.created_at).toLocaleString('ar-EG')}</div>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </>
  );
}
