import { useEffect, useState } from 'react';
import { FaInstagram, FaTelegram, FaWhatsapp } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

/* ─── Static data ────────────────────────────────────────────── */
const MENTORS = [
  { name: 'احمد ديب',       role: 'المهندس',             bio: 'مسؤول عن الجوانب التقنية وتطوير تجربة المنصة.',              color: '#75ff9e' },
  { name: 'علي ابو عصر',    role: 'ماركتنج',             bio: 'مسؤول عن التسويق والتواصل مع الجمهور وبناء حضور الأكاديمية.', color: '#81cfff' },
  { name: 'احمد العزامي',    role: 'دعم',                 bio: 'مسؤول عن دعم المستخدمين ومتابعة احتياجاتهم اليومية.',         color: '#75ff9e' },
  { name: 'كريم ابو رمضات', role: 'مدير الاعمال والتطوير', bio: 'يقود أعمال الأكاديمية وخطط التطوير والنمو.',                  color: '#81cfff' },
];

const SUBJECTS = [
  'استفسار عام',
  'طلب إرشاد مالي',
  'ترخيص مؤسسي',
  'دعم تقني',
  'شراكة أعمال',
];

const MAX_MSG_LENGTH = 5000;

/* ─── Toast component ────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const isSuccess = toast.type === 'success';
  return (
    <div
      id="contact-toast"
      role="alert"
      aria-live="polite"
      className={`contact-toast ${isSuccess ? 'contact-toast-success' : 'contact-toast-error'}`}
    >
      <span className="material-symbols-outlined contact-toast-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
        {isSuccess ? 'check_circle' : 'error'}
      </span>
      <span className="contact-toast-text">{toast.message}</span>
      <button onClick={onClose} className="contact-toast-close" aria-label="إغلاق">
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
      </button>
    </div>
  );
}

/* ─── Main page component ────────────────────────────────────── */
export default function AboutContact() {
  const { isAuthenticated, loading: authLoading, token, user } = useAuth();
  const EMPTY_FORM = { name: '', email: '', subject: SUBJECTS[0], message: '' };

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [errors,    setErrors]    = useState({});
  const [touched,   setTouched]   = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast,     setToast]     = useState({ show: false, type: '', message: '' });

  const closeToast = () => setToast(t => ({ ...t, show: false }));
  const formDisabled = isLoading || authLoading;

  /* ── Per-field client-side validation ── */
  const validate = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim())          return 'حقل الاسم مطلوب.';
        if (value.trim().length < 3) return 'يجب أن يحتوي الاسم على ٣ أحرف على الأقل.';
        return '';
      case 'email':
        if (!value.trim())          return 'حقل البريد الإلكتروني مطلوب.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'يرجى إدخال بريد إلكتروني صحيح.';
        return '';
      case 'subject':
        if (!value) return 'حقل الموضوع مطلوب.';
        return '';
      case 'message':
        if (!value.trim())           return 'حقل الرسالة مطلوب.';
        if (value.trim().length < 10) return 'يجب أن تحتوي الرسالة على ١٠ أحرف على الأقل.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, form[field]) }));
  };

  /* ── Submit handler ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched and collect errors
    const allTouched = {
      name: !isAuthenticated,
      email: !isAuthenticated,
      subject: true,
      message: true,
    };
    const allErrors  = {
      name:    isAuthenticated ? '' : validate('name', form.name),
      email:   isAuthenticated ? '' : validate('email', form.email),
      subject: validate('subject', form.subject),
      message: validate('message', form.message),
    };
    setTouched(allTouched);
    setErrors(allErrors);

    if (Object.values(allErrors).some(Boolean)) return; // block on client errors

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method:  'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify(isAuthenticated
          ? { subject: form.subject, message: form.message }
          : form),
      });

      const data = await readJsonResponse(res);

      if (data.success) {
        setToast({ show: true, type: 'success', message: 'تم إرسال رسالتك بنجاح ✓' });
        setForm(EMPTY_FORM);
        setTouched({});
        setErrors({});
      } else {
        setToast({ show: true, type: 'error', message: data.message || 'تعذر إرسال الرسالة' });
      }
    } catch (err) {
      // Handle 422 validation errors from server
      if (err.status === 422 && err.data?.errors) {
        const serverErrors = {};
        Object.entries(err.data.errors).forEach(([k, msgs]) => {
          serverErrors[k] = msgs[0];
        });
        setErrors(serverErrors);
        setTouched(allTouched);
      } else if (err.status === 429) {
        setToast({ show: true, type: 'error', message: 'لقد تجاوزت الحد المسموح به. يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.' });
      } else {
        setToast({ show: true, type: 'error', message: 'تعذر إرسال الرسالة. يرجى المحاولة لاحقًا.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Field helper ── */
  const fieldClass = (field) =>
    `form-control custom-input py-2${errors[field] && touched[field] ? ' contact-input-error' : ''}`;

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px' }} dir="rtl">

      {/* Global Toast */}
      <Toast toast={toast} onClose={closeToast} />

      {/* ── Page Title ── */}
      <section className="py-5 text-center px-4" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <h1 className="fw-bold text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.25, fontFamily: 'var(--font-sans)' }}>
          دمقرطة التنفيذ{' '}
          <span style={{ color: '#75ff9e', fontStyle: 'italic' }}>عالي الدقة</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '16px', lineHeight: 1.85, color: '#E2E8F0' }}>
          نسد الفجوة بين المتداولين الأفراد والمكاتب المؤسسية بتقديم مبادئ تداول تقنية موثّقة وحقيقية بعيدًا عن الضجيج المعتاد في الصناعة.
        </p>
      </section>

      {/* ── Stats ── */}
      <section className="py-4 container" style={{ maxWidth: '1100px' }}>
        <div className="row g-3">
          {[
            { value: '+٥٠,٠٠٠',   label: 'مستخدم نشط في المنصة', color: '#75ff9e' },
            { value: '٩٨.٤٪',     label: 'مؤشر الرضا',            color: '#81cfff' },
            { value: '+٢.٤ مليار$', label: 'حجم التداول المحاكى', color: '#75ff9e' },
          ].map((s, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="glass-card p-4 rounded-3 text-center">
                <h2 className="fw-bold mb-1 font-mono-data" style={{ color: s.color, fontSize: '32px' }}>{s.value}</h2>
                <span className="font-mono-data text-uppercase" style={{ color: '#E2E8F0', fontSize: '11px', letterSpacing: '0.08em' }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mentors ── */}
      <section className="py-5 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold text-white mb-2" style={{ fontSize: '32px', fontFamily: 'var(--font-sans)' }}>اكتسب معرفة المتداولين المخضرمين</h2>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>لا تكتفِ بالنظرية. تعلّم من تجارب وخبرات المتداولين الذين نجحوا في تحويل المعرفة إلى أرباح حقيقية في الأسواق.</p>
        </div>
        <div className="row g-4 justify-content-center">
          {MENTORS.map((m, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100 hover-glow">
                <div className="p-4 d-flex flex-column align-items-center text-center flex-grow-1">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-4 fw-bold font-mono-data"
                    style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.04)', border: `2px solid ${m.color}20`, color: m.color, fontSize: '20px' }}
                  >
                    {m.name.slice(0, 2)}
                  </div>
                  <h3 className="h6 text-white fw-bold mb-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '15px' }}>{m.name}</h3>
                  <p className="font-mono-data text-uppercase mb-3" style={{ color: m.color, fontSize: '9px', letterSpacing: '0.08em', textShadow: `0 0 8px ${m.color}55` }}>{m.role}</p>
                  <p style={{ fontSize: '13px', lineHeight: 1.85, fontFamily: 'var(--font-sans)', color: '#94A3B8' }}>{m.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact Section ── */}
      <section id="contact" className="py-5" style={{ backgroundColor: '#0b0e11' }}>
        <div className="px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div className="row g-4 align-items-center">

            {/* Info panel */}
            <div className="col-12 col-md-5">
              <h2 className="fw-bold text-white mb-3" style={{ fontSize: '32px', fontFamily: 'var(--font-sans)' }}>إنشاء تواصل</h2>
              <p style={{ fontSize: '14px', lineHeight: 1.85, maxWidth: '400px', fontFamily: 'var(--font-sans)', color: '#CBD5E1', marginBottom: '2.5rem' }}>
                هل تحتاج إلى دعم مؤسسي متخصص؟ لديك أسئلة حول تكاملات المناهج؟ أرسل تفاصيلك وسيتواصل معك فريق الكم لدينا.
              </p>
              <div className="d-flex flex-column gap-4">
                {[
                  { icon: 'mail',  label: 'نقطة دعم الكم',    value: 'terminal@borsa.academy' },
                  { Icon: FaWhatsapp, label: 'قناة الواتس اب', value: 'قناة بورصة أكاديمي على واتساب' },
                  { Icon: FaTelegram, label: 'قناة التلي غرام', value: 'قناة بورصة أكاديمي على تليغرام' },
                  { Icon: FaInstagram, label: 'الانستغرام',     value: 'حساب بورصة أكاديمي على إنستغرام' },
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center border rounded"
                      style={{ width: '40px', height: '40px', minWidth: '40px', backgroundColor: 'rgba(117,255,158,0.05)', borderColor: 'rgba(117,255,158,0.18)' }}
                    >
                      {item.Icon ? (
                        <item.Icon aria-hidden="true" style={{ color: '#75ff9e', fontSize: '20px' }} />
                      ) : (
                        <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '20px' }}>{item.icon}</span>
                      )}
                    </div>
                    <div>
                      <p className="m-0 text-muted font-mono-data text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>{item.label}</p>
                      <p className="m-0 text-white fw-semibold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form panel */}
            <div className="col-12 col-md-7">
              <div className="glass-card p-4 rounded-3">
                <form id="contact-form" onSubmit={handleSubmit} noValidate>

                  {authLoading ? (
                    <div
                      className="rounded-3 p-3 mb-3"
                      style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.14)' }}
                    >
                      <span className="text-muted" style={{ fontSize: '13px' }}>جاري التحقق من بيانات الحساب...</span>
                    </div>
                  ) : isAuthenticated ? (
                    <div
                      className="rounded-3 p-3 mb-3"
                      style={{ background: 'rgba(129,207,255,0.06)', border: '1px solid rgba(129,207,255,0.18)' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="material-symbols-outlined" style={{ color: '#81cfff' }}>verified_user</span>
                        <div>
                          <p className="text-white fw-semibold mb-1" style={{ fontSize: '14px' }}>
                            {user?.name}
                          </p>
                          <p className="mb-0" style={{ color: '#94a3b8', fontSize: '12px' }}>
                            سيتم إرسال الرسالة باستخدام بريد حسابك:{' '}
                            <span dir="ltr" style={{ color: '#81cfff' }}>{user?.email}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label htmlFor="contact-name" className="contact-field-label">
                          الاسم <span className="contact-required">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          placeholder="د. سامي العتيبي"
                          value={form.name}
                          onChange={handleChange('name')}
                          onBlur={handleBlur('name')}
                          className={fieldClass('name')}
                          style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}
                          disabled={formDisabled}
                          aria-describedby={errors.name && touched.name ? 'err-name' : undefined}
                        />
                        {errors.name && touched.name && (
                          <p id="err-name" className="contact-field-error">{errors.name}</p>
                        )}
                      </div>

                      <div className="col-12 col-sm-6">
                        <label htmlFor="contact-email" className="contact-field-label">
                          البريد الإلكتروني <span className="contact-required">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          placeholder="client@terminal.com"
                          value={form.email}
                          onChange={handleChange('email')}
                          onBlur={handleBlur('email')}
                          className={fieldClass('email')}
                          style={{ fontSize: '13px', direction: 'ltr', textAlign: 'left' }}
                          disabled={formDisabled}
                          aria-describedby={errors.email && touched.email ? 'err-email' : undefined}
                        />
                        {errors.email && touched.email && (
                          <p id="err-email" className="contact-field-error">{errors.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="mb-3">
                    <label htmlFor="contact-subject" className="contact-field-label">
                      موضوع الاستفسار <span className="contact-required">*</span>
                    </label>
                    <select
                      id="contact-subject"
                      value={form.subject}
                      onChange={handleChange('subject')}
                      onBlur={handleBlur('subject')}
                      className={`form-select ${fieldClass('subject')}`}
                      style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}
                      disabled={formDisabled}
                    >
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {errors.subject && touched.subject && (
                      <p className="contact-field-error">{errors.subject}</p>
                    )}
                  </div>

                  {/* Message + char counter */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-baseline mb-2">
                      <label htmlFor="contact-message" className="contact-field-label mb-0">
                        نص الرسالة <span className="contact-required">*</span>
                      </label>
                      <span className={`char-counter${form.message.length > MAX_MSG_LENGTH * 0.9 ? ' char-counter-warn' : ''}`}>
                        {form.message.length.toLocaleString('ar-EG')} / {MAX_MSG_LENGTH.toLocaleString('ar-EG')}
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      rows={4}
                      placeholder="صِف خلفيتك التداولية وأهداف استفسارك..."
                      value={form.message}
                      onChange={handleChange('message')}
                      onBlur={handleBlur('message')}
                      className={fieldClass('message')}
                      style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'none' }}
                      maxLength={MAX_MSG_LENGTH}
                      disabled={formDisabled}
                      aria-describedby={errors.message && touched.message ? 'err-message' : undefined}
                    />
                    {errors.message && touched.message && (
                      <p id="err-message" className="contact-field-error">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    id="contact-submit-btn"
                    type="submit"
                    disabled={formDisabled}
                    className="btn w-100 py-2 fw-bold contact-submit-btn"
                  >
                    {isLoading ? (
                      <>
                        <span className="contact-spinner" aria-hidden="true" />
                        <span>جارٍ الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginLeft: '6px' }}>send</span>
                        إرسال الرسالة
                      </>
                    )}
                  </button>

                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
