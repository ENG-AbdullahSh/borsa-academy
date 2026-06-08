import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';

const ADMIN_USERS_API_URL = 'http://127.0.0.1:8000/api/admin/users';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  status: 'active',
};

function getValidationSummary(data) {
  if (!data?.errors) {
    return data?.message || 'تعذر تنفيذ العملية. حاول مرة أخرى.';
  }
  return Object.values(data.errors).flat().join(' ');
}

async function readJsonResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(getValidationSummary(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="position-fixed d-flex align-items-center justify-content-center p-3"
      style={{ inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card rounded-3 w-100" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(17,20,23,0.98)' }}>
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
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

function UserForm({ form, onChange, onSubmit, submitting, submitLabel, isEdit }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...form, [name]: value });
  };

  return (
    <form onSubmit={onSubmit} className="d-flex flex-column gap-3" style={{ direction: 'rtl' }}>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>اسم المستخدم</label>
          <input name="name" value={form.name} onChange={handleChange} className="form-control custom-input" required maxLength={255} />
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>البريد الإلكتروني</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="form-control custom-input" required maxLength={255} />
        </div>
        
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>كلمة المرور {isEdit && '(اتركها فارغة لعدم التغيير)'}</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="form-control custom-input" required={!isEdit} minLength={8} />
        </div>

        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>الدور (Role)</label>
          <select name="role" value={form.role} onChange={handleChange} className="form-select custom-input" required>
            <option value="student">طالب</option>
            <option value="instructor">مدرب</option>
            <option value="admin">مسؤول</option>
          </select>
        </div>

        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>الحالة</label>
          <select name="status" value={form.status} onChange={handleChange} className="form-select custom-input" required>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary-cta fw-bold py-2 px-4 align-self-start mt-2" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />}
        {submitLabel}
      </button>
    </form>
  );
}

export default function AdminUsers() {
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const authHeaders = useMemo(() => ({
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    const controller = new AbortController();

    const loadUsers = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const response = await fetch(ADMIN_USERS_API_URL, {
          headers: authHeaders,
          signal: controller.signal,
        });
        const data = await readJsonResponse(response);
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setUsers([]);
          addNotification({
            type: 'error',
            title: 'خطأ',
            message: error.message || 'تعذر تحميل المستخدمين.'
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadUsers();
    return () => controller.abort();
  }, [authHeaders, refreshKey, token, addNotification]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const isEdit = !!editingUser;
    const endpoint = isEdit ? `${ADMIN_USERS_API_URL}/${editingUser.id}` : ADMIN_USERS_API_URL;

    try {
      const payload = { ...form };
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      await readJsonResponse(response);

      addNotification({
        type: 'success',
        title: 'نجاح',
        message: isEdit ? 'تم تحديث بيانات المستخدم بنجاح.' : 'تمت إضافة المستخدم بنجاح.'
      });
      setAddModalOpen(false);
      setEditingUser(null);
      setForm(EMPTY_FORM);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: error.message || 'تعذر حفظ البيانات.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);

    try {
      const response = await fetch(`${ADMIN_USERS_API_URL}/${deletingUser.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      await readJsonResponse(response);

      setDeletingUser(null);
      addNotification({
        type: 'success',
        title: 'نجاح',
        message: 'تم حذف المستخدم بنجاح.'
      });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: error.message || 'تعذر حذف المستخدم.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setEditingUser(null);
    setAddModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      status: user.status || 'active',
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return { label: 'مسؤول', color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)' };
      case 'instructor': return { label: 'مدرب', color: '#ffd54f', bg: 'rgba(255,213,79,0.1)' };
      case 'student': return { label: 'طالب', color: '#81cfff', bg: 'rgba(129,207,255,0.1)' };
      default: return { label: role, color: '#fff', bg: 'rgba(255,255,255,0.1)' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return { label: 'نشط', color: '#75ff9e', bg: 'rgba(117,255,158,0.1)' };
      case 'inactive': return { label: 'غير نشط', color: '#bacbb9', bg: 'rgba(186,203,185,0.1)' };
      case 'suspended': return { label: 'موقوف', color: '#ff8a80', bg: 'rgba(255,138,128,0.1)' };
      default: return { label: status, color: '#fff', bg: 'rgba(255,255,255,0.1)' };
    }
  };

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>إدارة المستخدمين</h1>
            <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
              عرض وتعديل بيانات وحالات المستخدمين على المنصة.
            </p>
          </div>
          <button type="button" onClick={openAddModal} className="btn btn-primary-cta fw-bold px-4 py-2 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Filters Section */}
        <section className="glass-card p-3 rounded-3 d-flex flex-wrap gap-3 align-items-center">
          <div className="flex-grow-1" style={{ minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="بحث بالاسم أو البريد..." 
              className="form-control custom-input w-100" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-select custom-input" 
            style={{ width: 'auto', minWidth: '140px' }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">كل الأدوار</option>
            <option value="student">طالب</option>
            <option value="instructor">مدرب</option>
            <option value="admin">مسؤول</option>
          </select>
          <select 
            className="form-select custom-input" 
            style={{ width: 'auto', minWidth: '140px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="suspended">موقوف</option>
          </select>
        </section>

        <section className="glass-card p-4 rounded-3">
          <div className="table-responsive" style={{ background: '#11151D', borderRadius: '12px', padding: '12px' }}>
            <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
              <thead>
                <tr style={{ fontSize: '12px', color: '#bacbb9', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="py-3 px-3">المستخدم</th>
                  <th className="py-3 px-3 text-center">الدور</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">تاريخ الانضمام</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center text-muted py-5">جاري تحميل المستخدمين...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted py-5">لا يوجد مستخدمون مطابقون لبحثك.</td></tr>
                ) : filteredUsers.map((user) => {
                  const roleLabel = getRoleLabel(user.role);
                  const statusLabel = getStatusLabel(user.status);
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-3 px-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>face</span>
                          </div>
                          <div>
                            <div className="text-white fw-bold" style={{ fontSize: '14px' }}>{user.name}</div>
                            <div className="text-muted" dir="ltr" style={{ fontSize: '12px', textAlign: 'right' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-3 py-1 rounded" style={{ fontSize: '12px', color: roleLabel.color, background: roleLabel.bg }}>
                          {roleLabel.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-3 py-1 rounded" style={{ fontSize: '12px', color: statusLabel.color, background: statusLabel.bg }}>
                          {statusLabel.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-muted" style={{ fontSize: '13px' }}>
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="d-flex gap-2 justify-content-center">
                          <button type="button" className="btn btn-sm btn-edit-course fw-bold px-3" onClick={() => openEditModal(user)}>تعديل</button>
                          <button type="button" className="btn btn-sm btn-delete-course fw-bold px-3" onClick={() => setDeletingUser(user)}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {(addModalOpen || editingUser) && (
        <ModalShell title={editingUser ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"} onClose={() => { setAddModalOpen(false); setEditingUser(null); }}>
          <UserForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel={editingUser ? "حفظ التعديلات" : "حفظ المستخدم"}
            isEdit={!!editingUser}
          />
        </ModalShell>
      )}

      {deletingUser && (
        <ModalShell title="تأكيد الحذف" onClose={() => setDeletingUser(null)}>
          <div style={{ direction: 'rtl' }}>
            <p className="text-white mb-2">هل تريد حذف هذا المستخدم من النظام؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>{deletingUser.name} ({deletingUser.email})</p>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-delete-course fw-bold px-4" onClick={confirmDelete} disabled={deleting}>
                {deleting && <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />}
                حذف نهائي
              </button>
              <button type="button" className="btn btn-secondary-cta fw-bold px-4" onClick={() => setDeletingUser(null)} disabled={deleting}>إلغاء</button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
