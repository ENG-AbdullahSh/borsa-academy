import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FieldError } from '../components/FormValidation';
import { hasValidationErrors, invalidClass, invalidProps, normalizeLaravelErrors, validateFields, validators } from '../utils/validation';

const ADMIN_INSTRUCTORS_API_URL = 'http://127.0.0.1:8000/api/admin/instructors';

const EMPTY_FORM = {
  name: '',
  specialization: '',
  bio: '',
  profile_image_path: '',
  user_id: '',
  login_email: '',
  password: '',
  file: null,
  preview: '',
};

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];

function instructorSchema(isEdit) {
  return {
    name: [
      validators.required('اسم المدرب مطلوب.'),
      validators.maxLength(255, 'يجب ألا يتجاوز اسم المدرب 255 حرفاً.'),
    ],
    specialization: [validators.maxLength(255, 'يجب ألا يتجاوز التخصص 255 حرفاً.')],
    login_email: isEdit
      ? [validators.email('صيغة بريد الدخول غير صحيحة.')]
      : [validators.email('صيغة بريد الدخول غير صحيحة.')],
    password: isEdit
      ? [validators.minLength(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.')]
      : [validators.minLength(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.')],
    file: [
      validators.fileType(IMAGE_TYPES, 'صيغة الصورة غير مدعومة. استخدم JPEG أو PNG أو JPG أو GIF أو SVG.'),
      validators.fileSize(IMAGE_MAX_BYTES, 'حجم الصورة يجب ألا يتجاوز 10MB.'),
    ],
  };
}

function validateInstructorForm(form, isEdit) {
  const errors = validateFields(form, instructorSchema(isEdit));

  if (!isEdit && !form.user_id && !form.login_email.trim()) {
    errors.login_email = 'اربط المدرب بحساب موجود أو أدخل بريد دخول جديد.';
  }

  if (!isEdit && !form.user_id && !form.password) {
    errors.password = 'كلمة المرور مطلوبة عند إنشاء حساب دخول جديد.';
  }

  if (form.user_id && (form.login_email.trim() || form.password)) {
    errors.user_id = 'اختر حساباً موجوداً أو أنشئ بيانات دخول جديدة، وليس كليهما.';
  }

  return errors;
}

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

function InstructorForm({
  form,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  isEdit,
  availableUsers,
  errors = {},
  touched = {},
  onBlur,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const previewUrl = URL.createObjectURL(file);
    onChange({ ...form, file, preview: previewUrl });
  };
  
  const removeImage = () => {
    onChange({ ...form, file: null, preview: '', profile_image_path: '' });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...form, [name]: value });
  };

  const errorFor = (field) => touched[field] && errors[field];

  return (
    <form onSubmit={onSubmit} className="d-flex flex-column gap-3" style={{ direction: 'rtl' }}>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>اسم المدرب</label>
          <input name="name" value={form.name} onChange={handleChange} onBlur={() => onBlur?.('name')} className={`form-control custom-input${invalidClass(errorFor('name'))}`} required maxLength={255} {...invalidProps(errorFor('name'), 'instructor-name-error')} />
          <FieldError id="instructor-name-error" message={errorFor('name')} />
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>التخصص (اختياري)</label>
          <input name="specialization" value={form.specialization || ''} onChange={handleChange} className="form-control custom-input" maxLength={255} placeholder="مثل: خبير تحليل فني" />
        </div>
        
        <div className="col-12">
          <label className="form-label text-muted fw-semibold mb-2" style={{ fontSize: '13px' }}>الصورة الشخصية (Profile Image)</label>
          <div 
            className={`position-relative d-flex flex-column align-items-center justify-content-center p-4 text-center transition-all ${dragActive ? 'bg-primary bg-opacity-10' : ''}`}
            style={{ 
              border: `2px dashed ${dragActive ? '#81cfff' : 'rgba(255,255,255,0.15)'}`,
              background: dragActive ? 'rgba(129, 207, 255, 0.05)' : 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              cursor: 'pointer',
              minHeight: '180px',
              overflow: 'hidden'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !form.preview && document.getElementById('instructor-image-upload').click()}
          >
            {form.preview ? (
              <div className="w-100 h-100 position-relative rounded-3 overflow-hidden d-flex align-items-center justify-content-center" style={{ minHeight: '160px' }}>
                <img src={form.preview} alt="Preview" className="img-fluid rounded-circle shadow-sm" style={{ width: '120px', height: '120px', objectFit: 'cover', background: 'rgba(0,0,0,0.2)' }} />
                <div className="position-absolute d-flex gap-2" style={{ top: '12px', right: '12px' }}>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeImage(); }} 
                    className="btn btn-sm d-flex align-items-center justify-content-center shadow-sm transition-all" 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(220,53,69,0.9)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                  >
                     <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center" style={{ pointerEvents: 'none' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', color: '#81cfff' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>face</span>
                </div>
                <span className="text-white fw-bold mb-1" style={{ fontSize: '15px', fontFamily: 'var(--font-sans)' }}>اسحب الصورة وأفلتها هنا</span>
                <span className="text-muted" style={{ fontSize: '12px' }}>أو اضغط لاختيار ملف</span>
              </div>
            )}
            <input 
              id="instructor-image-upload" 
              type="file" 
              accept="image/jpeg, image/png, image/jpg, image/gif, image/svg+xml" 
              className="d-none" 
              onChange={handleFileChange}
              {...invalidProps(errorFor('file'), 'instructor-image-error')}
            />
          </div>
          <FieldError id="instructor-image-error" message={errorFor('file')} />
        </div>
        
        <div className="col-12">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>النبذة التعريفية (Bio)</label>
          <textarea name="bio" value={form.bio || ''} onChange={handleChange} className="form-control custom-input" rows={4} placeholder="معلومات عن خبرات المدرب..." />
        </div>

        <div className="col-12">
          <div className="rounded-3 p-3" style={{ border: '1px solid rgba(117,255,158,0.16)', background: 'rgba(117,255,158,0.03)' }}>
            <h3 className="h6 text-white fw-bold mb-1">حساب تسجيل الدخول</h3>
            <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
              {isEdit
                ? 'اربط الملف بحساب مدرب موجود أو اختر بدون حساب لإلغاء الربط.'
                : 'اربط المدرب بحساب مدرب موجود أو أنشئ حساب دخول جديد ليظهر ضمن المستخدمين.'}
            </p>

            <label className="form-label text-muted" style={{ fontSize: '12px' }}>ربط حساب مدرب موجود</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              onBlur={() => onBlur?.('user_id')}
              className={`form-select custom-input${invalidClass(errorFor('user_id'))}`}
              disabled={!isEdit && Boolean(form.login_email || form.password)}
              {...invalidProps(errorFor('user_id'), 'instructor-user-error')}
            >
              <option value="">{isEdit ? 'بدون حساب دخول' : 'اختر حساب مدرب موجود'}</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email} ({user.status})
                </option>
              ))}
            </select>
            <FieldError id="instructor-user-error" message={errorFor('user_id')} />

            {!isEdit && (
              <div className="row g-3 mt-1">
                <div className="col-12 col-lg-6">
                  <label className="form-label text-muted" style={{ fontSize: '12px' }}>بريد الدخول</label>
                  <input
                    type="email"
                    name="login_email"
                    value={form.login_email}
                    onChange={handleChange}
                    onBlur={() => onBlur?.('login_email')}
                    className={`form-control custom-input${invalidClass(errorFor('login_email'))}`}
                    disabled={Boolean(form.user_id)}
                    required={!isEdit && !form.user_id}
                    autoComplete="off"
                    {...invalidProps(errorFor('login_email'), 'instructor-login-email-error')}
                  />
                  <FieldError id="instructor-login-email-error" message={errorFor('login_email')} />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label text-muted" style={{ fontSize: '12px' }}>كلمة المرور</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={() => onBlur?.('password')}
                    className={`form-control custom-input${invalidClass(errorFor('password'))}`}
                    minLength={8}
                    disabled={Boolean(form.user_id)}
                    required={!isEdit && !form.user_id}
                    autoComplete="new-password"
                    {...invalidProps(errorFor('password'), 'instructor-password-error')}
                  />
                  <FieldError id="instructor-password-error" message={errorFor('password')} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary-cta fw-bold py-2 px-4 align-self-start mt-2" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />}
        {submitLabel}
      </button>
    </form>
  );
}

export default function AdminInstructors() {
  const { token } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [instructorUsers, setInstructorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [deletingInstructor, setDeletingInstructor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const authHeaders = useMemo(() => ({
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    const controller = new AbortController();

    const loadInstructors = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const response = await fetch(ADMIN_INSTRUCTORS_API_URL, {
          headers: authHeaders,
          signal: controller.signal,
        });
        const data = await readJsonResponse(response);
        setInstructors(Array.isArray(data) ? data : []);

        const usersResponse = await fetch('http://127.0.0.1:8000/api/admin/users?role=instructor&per_page=100', {
          headers: authHeaders,
          signal: controller.signal,
        });
        const usersData = await readJsonResponse(usersResponse);
        setInstructorUsers(Array.isArray(usersData.data) ? usersData.data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setInstructors([]);
          setInstructorUsers([]);
          setMessage({ type: 'error', text: error.message || 'تعذر تحميل المدربين.' });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadInstructors();
    return () => controller.abort();
  }, [authHeaders, refreshKey, token]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => {
      setMessage((current) => (current?.text === text ? null : current));
    }, 5000);
  };

  const touchInstructorFields = () => ({
    name: true,
    specialization: true,
    user_id: true,
    login_email: true,
    password: true,
    file: true,
  });

  const handleInstructorBlur = (field) => {
    const isEdit = Boolean(editingInstructor);
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validateInstructorForm(form, isEdit));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isEdit = !!editingInstructor;
    const nextErrors = validateInstructorForm(form, isEdit);
    const touchedFields = touchInstructorFields();

    setTouched(touchedFields);
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) return;

    setSubmitting(true);

    if (!isEdit && !form.user_id && (!form.login_email.trim() || !form.password)) {
      showMessage('error', 'لإضافة مدرب جديد، اربطه بحساب مدرب موجود أو أدخل بريد وكلمة مرور لحساب دخول جديد.');
      setSubmitting(false);
      return;
    }

    const endpoint = isEdit ? `${ADMIN_INSTRUCTORS_API_URL}/${editingInstructor.id}` : ADMIN_INSTRUCTORS_API_URL;

    try {
      let finalPath = form.profile_image_path;

      if (form.file) {
        const formData = new FormData();
        formData.append('file', form.file);
        formData.append('folder', 'instructors');

        const uploadResponse = await fetch('http://127.0.0.1:8000/api/upload', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        const uploadData = await readJsonResponse(uploadResponse);
        if (uploadData.success) {
           finalPath = uploadData.path;
        } else {
           throw new Error(uploadData.message || 'فشل رفع الصورة');
        }
      }

      const payload = {
        name: form.name.trim(),
        specialization: form.specialization?.trim() || null,
        bio: form.bio?.trim() || null,
        profile_image_path: finalPath || null,
      };

      if (isEdit) {
        payload.user_id = form.user_id ? Number(form.user_id) : null;
      } else if (form.user_id) {
        payload.user_id = Number(form.user_id);
      } else if (form.login_email || form.password) {
        payload.login_email = form.login_email.trim();
        payload.password = form.password;
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

      showMessage('success', isEdit ? 'تم تحديث بيانات المدرب بنجاح.' : 'تمت إضافة المدرب بنجاح.');
      setAddModalOpen(false);
      setEditingInstructor(null);
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
      setRefreshKey((k) => k + 1);
    } catch (error) {
      const serverErrors = normalizeLaravelErrors(error);
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors);
        setTouched(touchedFields);
        return;
      }
      showMessage('error', error.message || 'تعذر حفظ البيانات.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingInstructor) return;
    setDeleting(true);

    try {
      const response = await fetch(`${ADMIN_INSTRUCTORS_API_URL}/${deletingInstructor.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      await readJsonResponse(response);

      setDeletingInstructor(null);
      showMessage('success', 'تم حذف المدرب بنجاح.');
      setRefreshKey((k) => k + 1);
    } catch (error) {
      showMessage('error', error.message || 'تعذر حذف المدرب.');
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setEditingInstructor(null);
    setAddModalOpen(true);
  };

  const openEditModal = (instructor) => {
    setEditingInstructor(instructor);
    setForm({
      name: instructor.name || '',
      specialization: instructor.specialization || '',
      bio: instructor.bio || '',
      profile_image_path: instructor.profile_image_path || '',
      user_id: instructor.user_id ? String(instructor.user_id) : '',
      login_email: '',
      password: '',
      file: null,
      preview: instructor.profile_image_path ? `http://127.0.0.1:8000/storage/${instructor.profile_image_path}` : '',
    });
  };

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>إدارة المدربين</h1>
            <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
              إضافة وتعديل بيانات المدربين وتخصصاتهم عبر المنصة.
            </p>
          </div>
          <button type="button" onClick={openAddModal} className="btn btn-primary-cta fw-bold px-4 py-2 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            إضافة مدرب جديد
          </button>
        </div>

        {message && (
          <div
            className="rounded-3 px-4 py-3"
            style={{
              color: message.type === 'success' ? '#75ff9e' : '#fecaca',
              background: message.type === 'success' ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)',
              border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.24)' : 'rgba(255,82,82,0.24)'}`,
              fontSize: '14px',
            }}
          >
            {message.text}
          </div>
        )}

        <section className="glass-card p-4 rounded-3">
          <div className="table-responsive" style={{ background: '#11151D', borderRadius: '12px', padding: '12px' }}>
            <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
              <thead>
                <tr style={{ fontSize: '12px', color: '#bacbb9', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="py-3 px-3">المدرب</th>
                  <th className="py-3 px-3">التخصص</th>
                  <th className="py-3 px-3">حساب الدخول</th>
                  <th className="py-3 px-3">نبذة تعريفية</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center text-muted py-5">جاري تحميل المدربين...</td></tr>
                ) : instructors.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted py-5">لا يوجد مدربون مسجلون حالياً.</td></tr>
                ) : instructors.map((instructor) => (
                  <tr key={instructor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-3">
                        {instructor.profile_image_path ? (
                          <img src={`http://127.0.0.1:8000/storage/${instructor.profile_image_path}`} alt={instructor.name} className="rounded-circle shadow-sm" style={{ width: '42px', height: '42px', objectFit: 'cover' }} />
                        ) : (
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)' }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>face</span>
                          </div>
                        )}
                        <span className="text-white fw-bold" style={{ fontSize: '14px' }}>{instructor.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted" style={{ fontSize: '13px' }}>{instructor.specialization || '-'}</td>
                    <td className="py-3 px-3" style={{ fontSize: '12px' }}>
                      {instructor.user ? (
                        <div className="d-flex flex-column gap-1">
                          <span style={{ color: '#75ff9e' }}>حساب مرتبط</span>
                          <span className="text-muted" dir="ltr">{instructor.user.email}</span>
                          <span style={{ color: instructor.user.status === 'active' ? '#75ff9e' : '#ffd54f' }}>
                            {instructor.user.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">ملف فقط</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted" style={{ fontSize: '13px', maxWidth: '300px' }}>
                      <div className="text-truncate">{instructor.bio || '-'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex gap-2 justify-content-center">
                        <button type="button" className="btn btn-sm btn-edit-course fw-bold px-3" onClick={() => openEditModal(instructor)}>تعديل</button>
                        <button type="button" className="btn btn-sm btn-delete-course fw-bold px-3" onClick={() => setDeletingInstructor(instructor)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {(addModalOpen || editingInstructor) && (
        <ModalShell title={editingInstructor ? "تعديل بيانات المدرب" : "إضافة مدرب جديد"} onClose={() => { setAddModalOpen(false); setEditingInstructor(null); }}>
          <InstructorForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel={editingInstructor ? "حفظ التعديلات" : "حفظ المدرب"}
            isEdit={Boolean(editingInstructor)}
            errors={errors}
            touched={touched}
            onBlur={handleInstructorBlur}
            availableUsers={instructorUsers.filter((user) => (
              !instructors.some((instructor) => instructor.user_id === user.id)
              || user.id === editingInstructor?.user_id
            ))}
          />
        </ModalShell>
      )}

      {deletingInstructor && (
        <ModalShell title="تأكيد الحذف" onClose={() => setDeletingInstructor(null)}>
          <div style={{ direction: 'rtl' }}>
            <p className="text-white mb-2">هل تريد حذف المدرب من النظام؟</p>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>{deletingInstructor.name}</p>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-delete-course fw-bold px-4" onClick={confirmDelete} disabled={deleting}>
                {deleting && <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />}
                حذف نهائي
              </button>
              <button type="button" className="btn btn-secondary-cta fw-bold px-4" onClick={() => setDeletingInstructor(null)} disabled={deleting}>إلغاء</button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
