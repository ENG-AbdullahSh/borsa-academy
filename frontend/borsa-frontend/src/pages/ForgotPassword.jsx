import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import '../styles/auth.css';
import borsaLogo from '../assets/Borsa Academy.jpeg';

const CheckIcon = () => (
  <svg className="auth-feature-bullet-icon" viewBox="0 0 16 16">
    <polyline points="2.5,8.5 6.5,12.5 13.5,3.5" />
  </svg>
);

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 38, height: 38, stroke: '#00E676', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <polyline points="4,13 9,18 20,7" />
  </svg>
);

export default function ForgotPassword() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await readJsonResponse(res);

      setSuccessMessage(data.message || 'إذا كان البريد مسجلاً لدينا، سيتم إرسال رابط استعادة كلمة المرور');
      setSuccess(true);
    } catch (err) {
      const firstError = Object.values(err.data?.errors || {}).flat().find(Boolean);
      setError(firstError || err.message || 'حدث خطأ ما. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ══════════ RIGHT — Identity Panel ══════════ */}
      <div className="auth-identity">
        <div className="auth-identity-inner">
          <div className="auth-logo-img-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
            <img src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} alt={settings.academy_name || "بورصة أكاديمي"} className="auth-logo-img brand-logo-animated" style={{ borderRadius: '8px' }} />
            <span className="brand-text-glowing" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
            </span>
          </div>
          <div className="auth-logo-underline" />
          <p className="auth-tagline">
            هل نسيت كلمة المرور الخاصة بك؟
            لا تقلق، يمكنك استعادتها بسهولة وأمان لمتابعة رحلتك التعليمية.
          </p>

          <ul className="auth-features">
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">أدخل بريدك الإلكتروني المسجل</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">تحقق من صندوق الوارد الخاص بك</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">أعد تعيين كلمة المرور بكل سهولة</span>
            </li>
          </ul>

          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">{settings.academy_name || 'Borsa Academy'} · Account Recovery</span>
        </div>
      </div>

      {/* ══════════ LEFT — Form Panel ══════════ */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          {success ? (
            <div className="auth-success">
              <div className="auth-success-icon">
                <SuccessIcon />
              </div>
              <h4>تم إرسال رابط إعادة التعيين!</h4>
              <p>{successMessage}</p>
              <Link to="/signin" className="auth-switch" style={{ marginTop: '20px', display: 'inline-block' }}>
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <img 
                  src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} 
                  alt={settings.academy_name || "Borsa Academy"} 
                  className="mx-auto mb-4" 
                  style={{ maxHeight: '55px', borderRadius: '8px', filter: 'drop-shadow(0 0 12px rgba(0, 230, 118, 0.25))' }} 
                />
                <h1 className="auth-form-title">استعادة كلمة المرور</h1>
                <p className="auth-form-subtitle">
                  أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
                </p>
              </div>

              {error && <div className="auth-error-banner">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="auth-field mb-6">
                  <label className="auth-label" htmlFor="forgot-email">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    placeholder="operator@borsa.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="auth-cta-btn hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                  disabled={loading}
                >
                  {loading && <span className="auth-spinner" />}
                  {loading ? 'جارٍ الإرسال…' : 'إرسال رابط إعادة التعيين'}
                </button>
              </form>

              <p className="auth-switch mt-4 text-center">
                تذكرت كلمة المرور؟{' '}
                <Link to="/signin">العودة لتسجيل الدخول</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
