import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../../utils/api';
import '../../styles/auth.css';
import borsaLogo from '../../assets/Borsa Academy.jpeg';

export default function ForgotPassword() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني.');
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

      if (data.success || res.ok) {
        setSuccessMessage(data.message || 'تم إرسال كود التحقق بنجاح. يرجى التحقق من سجل النظام أو بريدك.');
        setTimeout(() => {
          navigate('/reset-password', { state: { email: email.trim() } });
        }, 2000);
      } else {
        setErrorMessage(data.message || 'حدث خطأ ما أثناء معالجة الطلب.');
      }
    } catch (err) {
      const firstError = Object.values(err.data?.errors || {}).flat().find(Boolean);
      setErrorMessage(firstError || err.message || 'فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-identity">
        <div className="auth-identity-inner">
          <div className="auth-logo-img-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexDirection: 'row-reverse' }}>
            <img 
              src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} 
              alt={settings.academy_name || 'بورصة أكاديمي'} 
              className="auth-logo-img brand-logo-animated" 
              style={{ borderRadius: '8px' }} 
            />
            <span className="brand-text-glowing" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
            </span>
          </div>
          <div className="auth-logo-underline" />
          <p className="auth-tagline">
            منصة Borsa Academy لتعليم التداول والاستثمار المالي الذكي. استعد حسابك بكل سهولة وأمان.
          </p>

          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">{settings.academy_name || 'Borsa Academy'} · Forgot Password</span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h1 className="auth-form-title">هل نسيت كلمة المرور؟</h1>
            <p className="auth-form-subtitle">
              أدخل بريدك الإلكتروني وسنقوم بإرسال كود تحقق مكون من 6 أرقام لاستعادة حسابك.
            </p>
          </div>

          {successMessage && (
            <div className="alert alert-success border-0 text-white bg-success/20 d-flex align-items-center gap-2 mb-4" role="alert" style={{ fontSize: '14px', borderRadius: '8px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-success">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div>{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger border-0 text-white bg-danger/20 d-flex align-items-center gap-2 mb-4" role="alert" style={{ fontSize: '14px', borderRadius: '8px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-danger">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field mb-4">
              <label className="auth-label" htmlFor="forgot-email">البريد الإلكتروني</label>
              <input
                id="forgot-email"
                type="email"
                className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-cta-btn w-100 py-3 shadow-[0_0_20px_rgba(0,230,118,0.4)]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  جاري إرسال الكود...
                </>
              ) : (
                'إرسال كود التحقق'
              )}
            </button>
          </form>

          <p className="auth-switch mt-4 text-center">
            تذكرت كلمة المرور؟ <Link to="/signin">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
