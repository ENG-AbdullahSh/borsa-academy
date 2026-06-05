import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const ADMIN_COURSES_API_URL = 'http://127.0.0.1:8000/api/admin/courses';

const EMPTY_FORM = {
  title: '',
  slug: '',
  short_description: '',
  description: '',
  thumbnail: '',
  price: '',
  level: 'beginner',
  category: '',
  instructor_name: '',
  duration_hours: '',
  status: 'draft',
};

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'مسودة' },
  { value: 'published', label: 'منشور' },
];

const DEFAULT_CATEGORIES = [
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

const getLevelLabel = (level) => LEVEL_OPTIONS.find((item) => item.value === level)?.label || level;
const getStatusLabel = (status) => STATUS_OPTIONS.find((item) => item.value === status)?.label || status;

const getValidationSummary = (data) => {
  if (!data?.errors) {
    return data?.message || 'تعذر تنفيذ العملية. حاول مرة أخرى.';
  }

  return Object.values(data.errors).flat().join(' ');
};

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

function buildCoursePayload(form) {
  const payload = {
    title: form.title.trim(),
    short_description: form.short_description.trim(),
    description: form.description.trim(),
    thumbnail: form.thumbnail.trim() || null,
    price: Number(form.price),
    level: form.level,
    category: form.category.trim(),
    instructor_name: form.instructor_name.trim(),
    duration_hours: Number(form.duration_hours),
    status: form.status,
  };

  if (form.slug.trim()) {
    payload.slug = form.slug.trim();
  }

  return payload;
}

function courseToForm(course) {
  return {
    title: course.title || '',
    slug: course.slug || '',
    short_description: course.short_description || '',
    description: course.description || '',
    thumbnail: course.thumbnail || '',
    price: course.price ?? '',
    level: course.level || 'beginner',
    category: course.category || '',
    instructor_name: course.instructor_name || '',
    duration_hours: course.duration_hours ?? '',
    status: course.status || 'draft',
  };
}

function CourseForm({ form, onChange, onSubmit, submitting, submitLabel, compact = false }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...form, [name]: value });
  };

  return (
    <form onSubmit={onSubmit} className="d-flex flex-column gap-3" style={{ direction: 'rtl' }}>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>عنوان الكورس</label>
          <input name="title" value={form.title} onChange={handleChange} className="form-control custom-input" required maxLength={255} />
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>الرابط المختصر اختياري</label>
          <input name="slug" value={form.slug} onChange={handleChange} className="form-control custom-input" maxLength={191} placeholder="advanced-trading-course" style={{ direction: 'ltr', textAlign: 'left' }} />
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>المدرب</label>
          <input name="instructor_name" value={form.instructor_name} onChange={handleChange} className="form-control custom-input" required maxLength={255} />
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>التصنيف</label>
          <input name="category" value={form.category} onChange={handleChange} className="form-control custom-input" required maxLength={191} list="admin-course-categories" />
        </div>
        <div className="col-6 col-lg-2">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>السعر</label>
          <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="form-control custom-input" required style={{ direction: 'ltr', textAlign: 'left' }} />
        </div>
        <div className="col-6 col-lg-2">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>الساعات</label>
          <input name="duration_hours" type="number" min="1" max="1000" value={form.duration_hours} onChange={handleChange} className="form-control custom-input" required style={{ direction: 'ltr', textAlign: 'left' }} />
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>المستوى</label>
          <select name="level" value={form.level} onChange={handleChange} className="form-select custom-input">
            {LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>الحالة</label>
          <select name="status" value={form.status} onChange={handleChange} className="form-select custom-input">
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>رابط الصورة اختياري</label>
          <input name="thumbnail" value={form.thumbnail} onChange={handleChange} className="form-control custom-input" maxLength={2048} placeholder="https://..." style={{ direction: 'ltr', textAlign: 'left' }} />
        </div>
        <div className="col-12">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>وصف قصير</label>
          <textarea name="short_description" value={form.short_description} onChange={handleChange} className="form-control custom-input" required maxLength={500} rows={compact ? 2 : 3} />
        </div>
        <div className="col-12">
          <label className="form-label text-muted" style={{ fontSize: '12px' }}>الوصف الكامل</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="form-control custom-input" required rows={compact ? 4 : 5} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary-cta fw-bold py-2 px-4 align-self-start" disabled={submitting}>
        {submitting && <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />}
        {submitLabel}
      </button>
    </form>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="position-fixed d-flex align-items-center justify-content-center p-3"
      style={{ inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card rounded-3 w-100" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(17,20,23,0.98)' }}>
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

export default function AdminCourses() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const authHeaders = useMemo(() => ({
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const categories = useMemo(() => {
    const apiCategories = courses.map((course) => course.category).filter(Boolean);
    return [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])];
  }, [courses]);

  const stats = useMemo(() => ({
    total: pagination.total || courses.length,
    published: courses.filter((course) => course.status === 'published').length,
    draft: courses.filter((course) => course.status === 'draft').length,
  }), [courses, pagination.total]);

  useEffect(() => {
    const controller = new AbortController();

    const loadCourses = async () => {
      if (!token) return;

      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        per_page: '25',
      });

      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (levelFilter) params.set('level', levelFilter);

      try {
        const response = await fetch(`${ADMIN_COURSES_API_URL}?${params.toString()}`, {
          headers: authHeaders,
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        const apiCourses = Array.isArray(payload.data) ? payload.data : [];

        setCourses(apiCourses);
        setPagination({
          current_page: payload.current_page ?? page,
          last_page: payload.last_page ?? 1,
          total: payload.total ?? apiCourses.length,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCourses([]);
          setMessage({ type: 'error', text: error.message || 'تعذر تحميل الكورسات.' });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadCourses();

    return () => controller.abort();
  }, [authHeaders, levelFilter, page, refreshKey, search, statusFilter, token]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => {
      setMessage((current) => (current?.text === text ? null : current));
    }, 5000);
  };

  const submitCourse = async (event, mode) => {
    event.preventDefault();
    setSubmitting(true);

    const isEdit = mode === 'edit';
    const form = isEdit ? editForm : addForm;
    const endpoint = isEdit ? `${ADMIN_COURSES_API_URL}/${editingCourse.id}` : ADMIN_COURSES_API_URL;

    try {
      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildCoursePayload(form)),
      });
      await readJsonResponse(response);

      if (isEdit) {
        setEditingCourse(null);
        showMessage('success', 'تم تحديث الكورس بنجاح.');
      } else {
        setAddForm(EMPTY_FORM);
        showMessage('success', 'تمت إضافة الكورس بنجاح.');
      }

      setRefreshKey((current) => current + 1);
    } catch (error) {
      showMessage('error', error.message || 'تعذر حفظ الكورس.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCourse) return;

    setDeleting(true);

    try {
      const response = await fetch(`${ADMIN_COURSES_API_URL}/${deletingCourse.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      await readJsonResponse(response);

      setDeletingCourse(null);
      showMessage('success', 'تم حذف الكورس بنجاح.');
      setRefreshKey((current) => current + 1);
    } catch (error) {
      showMessage('error', error.message || 'تعذر حذف الكورس.');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setEditForm(courseToForm(course));
  };

  return (
    <>
      <datalist id="admin-course-categories">
        {categories.map((category) => <option key={category} value={category} />)}
      </datalist>

      <div className="d-flex flex-column gap-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>إدارة الكورسات</h1>
            <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
              إنشاء وتحديث ونشر وحذف كورسات المنصة من مكان واحد.
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: 'الإجمالي', value: stats.total, color: '#81cfff' },
              { label: 'منشور', value: stats.published, color: '#00e676' },
              { label: 'مسودة', value: stats.draft, color: '#ffb4ab' },
            ].map((item) => (
              <div key={item.label} className="px-3 py-2 rounded border" style={{ borderColor: 'rgba(255,255,255,0.08)', minWidth: '92px', background: 'rgba(255,255,255,0.03)' }}>
                <span className="d-block text-muted" style={{ fontSize: '11px' }}>{item.label}</span>
                <strong className="font-mono-data" style={{ color: item.color, fontSize: '18px' }}>{item.value}</strong>
              </div>
            ))}
          </div>
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
          <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 text-white fw-bold m-0">إضافة كورس جديد</h2>
              <p className="text-muted m-0" style={{ fontSize: '12px' }}>سيتم حفظ المسودة أو نشرها حسب الحالة المختارة.</p>
            </div>
          </div>
          <CourseForm
            form={addForm}
            onChange={setAddForm}
            onSubmit={(event) => submitCourse(event, 'create')}
            submitting={submitting && !editingCourse}
            submitLabel="إضافة الكورس"
          />
        </section>

        <section className="glass-card p-4 rounded-3">
          <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
            <div>
              <h2 className="h5 text-white fw-bold m-0">قائمة الكورسات</h2>
              <p className="text-muted m-0" style={{ fontSize: '12px' }}>تعرض القائمة الكورسات المنشورة والمسودات للإدارة فقط.</p>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2">
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                className="form-control custom-input"
                placeholder="بحث بالعنوان أو المدرب..."
                style={{ minWidth: '220px' }}
              />
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="form-select custom-input">
                <option value="">كل الحالات</option>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={levelFilter} onChange={(event) => { setLevelFilter(event.target.value); setPage(1); }} className="form-select custom-input">
                <option value="">كل المستويات</option>
                {LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div className="table-responsive" style={{ background: '#11151D', borderRadius: '12px', padding: '12px' }}>
            <table className="table table-dark table-hover table-borderless m-0 align-middle" style={{ direction: 'rtl' }}>
              <thead>
                <tr style={{ fontSize: '12px', color: '#bacbb9', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="py-3 px-3">الكورس</th>
                  <th className="py-3 px-3">المدرب</th>
                  <th className="py-3 px-3">التصنيف</th>
                  <th className="py-3 px-3 text-center">السعر</th>
                  <th className="py-3 px-3 text-center">المستوى</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center text-muted py-5">جاري تحميل الكورسات...</td></tr>
                ) : courses.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted py-5">لا توجد كورسات مطابقة.</td></tr>
                ) : courses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-3 px-3">
                      <div className="d-flex flex-column">
                        <span className="text-white fw-bold" style={{ fontSize: '14px' }}>{course.title}</span>
                        <span className="font-mono-data text-muted" style={{ fontSize: '11px', direction: 'ltr', textAlign: 'right' }}>{course.slug}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted" style={{ fontSize: '13px' }}>{course.instructor_name}</td>
                    <td className="py-3 px-3 text-muted" style={{ fontSize: '13px' }}>{course.category}</td>
                    <td className="py-3 px-3 text-center font-mono-data" style={{ color: '#00e676' }}>${Number(course.price || 0).toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-1 rounded font-mono-data" style={{ fontSize: '11px', background: 'rgba(129,207,255,0.1)', color: '#81cfff' }}>{getLevelLabel(course.level)}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className="px-2 py-1 rounded font-mono-data"
                        style={{
                          fontSize: '11px',
                          background: course.status === 'published' ? 'rgba(0,230,118,0.12)' : 'rgba(255,180,171,0.1)',
                          color: course.status === 'published' ? '#75ff9e' : '#ffb4ab',
                        }}
                      >
                        {getStatusLabel(course.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex gap-2 justify-content-center">
                        <button type="button" className="btn btn-sm btn-edit-course fw-bold px-3" onClick={() => openEditModal(course)}>تعديل</button>
                        <button type="button" className="btn btn-sm btn-delete-course fw-bold px-3" onClick={() => setDeletingCourse(course)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between gap-3 mt-4">
            <span className="text-muted font-mono-data" style={{ fontSize: '12px' }}>
              صفحة {pagination.current_page} من {pagination.last_page}
            </span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-secondary-cta px-3" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>السابق</button>
              <button className="btn btn-sm btn-primary-cta px-3" disabled={page >= pagination.last_page || loading} onClick={() => setPage((current) => current + 1)}>التالي</button>
            </div>
          </div>
        </section>
      </div>

      {editingCourse && (
        <ModalShell title="تعديل الكورس" onClose={() => setEditingCourse(null)}>
          <CourseForm
            form={editForm}
            onChange={setEditForm}
            onSubmit={(event) => submitCourse(event, 'edit')}
            submitting={submitting}
            submitLabel="حفظ التعديلات"
            compact
          />
        </ModalShell>
      )}

      {deletingCourse && (
        <ModalShell title="تأكيد الحذف" onClose={() => setDeletingCourse(null)}>
          <div style={{ direction: 'rtl' }}>
            <p className="text-white mb-2">هل تريد حذف هذا الكورس؟</p>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>{deletingCourse.title}</p>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-delete-course fw-bold px-4" onClick={confirmDelete} disabled={deleting}>
                {deleting && <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />}
                حذف نهائي
              </button>
              <button type="button" className="btn btn-secondary-cta fw-bold px-4" onClick={() => setDeletingCourse(null)} disabled={deleting}>إلغاء</button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
