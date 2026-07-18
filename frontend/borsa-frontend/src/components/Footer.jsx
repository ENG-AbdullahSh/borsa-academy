import React from 'react';
import { Link } from 'react-router-dom';
import { FaTelegram, FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="pt-5 pb-4 border-top" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="container px-4" style={{ maxWidth: '1440px' }}>
        <div className="row g-4 mb-5">
          {/* Col 1: Brand & Bio */}
          <div className="col-12 col-md-4">
            <Link to="/" className="text-decoration-none fw-bold d-inline-block mb-3 interactive"
              style={{ color: '#75ff9e', fontSize: '22px', fontFamily: 'var(--font-sans)', textShadow: '0 0 12px rgba(117,255,158,0.18)', letterSpacing: '-0.01em' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
            </Link>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: 1.8 }}>
              {settings.general_description || 'منصة التعليم المالي الاحترافي للعصر الرقمي. نمكّن المتداولين من إتقان الأسواق العالمية بأدوات مؤسسية ورؤى استراتيجية عالية الدقة.'}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="col-12 col-md-4">
            <h5 className="text-white fw-bold mb-3" style={{ fontSize: '16px', fontFamily: 'var(--font-sans)' }}>روابط سريعة</h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><Link to="/" className="footer-link">الرئيسية</Link></li>
              <li><Link to="/courses" className="footer-link">الكورسات</Link></li>
              <li><Link to="/about" className="footer-link">من نحن واتصل بنا</Link></li>
            </ul>
          </div>

          {/* Col 3: Legal & Risk */}
          <div className="col-12 col-md-4">
            <h5 className="text-white fw-bold mb-3" style={{ fontSize: '16px', fontFamily: 'var(--font-sans)' }}>القانونية والمخاطر</h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><Link to="/terms" className="footer-link">إخلاء المسؤولية القانونية</Link></li>
              <li><Link to="/terms" className="footer-link">شروط الاستخدام</Link></li>
              <li><Link to="/terms" className="footer-link">سياسة الخصوصية</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Row: Social Icons & Copyright */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center pt-4" style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <p className="m-0 font-mono-data text-uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', letterSpacing: '0.05em' }}>
            &copy; {new Date().getFullYear()} {settings.academy_name || 'بورصة أكاديمي'}. جميع الحقوق محفوظة.
          </p>
          <div className="d-flex align-items-center mt-3 mt-md-0" style={{ gap: '15px' }}>
            <a
              href="https://www.instagram.com/bors_aacademy?igsh=OXpjaDl4dmk1eTU0"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-premium"
              aria-label="إنستغرام"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href="https://wa.me/970598341135"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-premium"
              aria-label="واتساب"
            >
              <FaWhatsapp size={18} />
            </a>
            <a
              href="https://t.me/BorsaAcademy"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-premium"
              aria-label="تلغرام"
            >
              <FaTelegram size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
