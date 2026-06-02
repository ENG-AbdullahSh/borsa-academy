import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTelegram, FaYoutube, FaXTwitter, FaDiscord } from 'react-icons/fa6';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <footer className="pt-5 pb-4 border-top" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="container px-4" style={{ maxWidth: '1440px' }}>
        <div className="row g-4 mb-5">
          {/* Col 1: Brand & Bio */}
          <div className="col-12 col-md-3">
            <Link to="/" className="text-decoration-none fw-bold d-inline-block mb-3 interactive"
              style={{ color: '#75ff9e', fontSize: '22px', fontFamily: 'var(--font-sans)', textShadow: '0 0 12px rgba(117,255,158,0.18)', letterSpacing: '-0.01em' }}>
              بورصة أكاديمي
            </Link>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: 1.8 }}>
              منصة التعليم المالي الاحترافي للعصر الرقمي. نمكّن المتداولين من إتقان الأسواق العالمية بأدوات مؤسسية ورؤى استراتيجية عالية الدقة.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3" style={{ fontSize: '16px', fontFamily: 'var(--font-sans)' }}>روابط سريعة</h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><Link to="/" className="footer-link">الرئيسية</Link></li>
              <li><Link to="/courses" className="footer-link">الكورسات</Link></li>
              <li><Link to="/about" className="footer-link">من نحن واتصل بنا</Link></li>
            </ul>
          </div>

          {/* Col 3: Legal & Risk */}
          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3" style={{ fontSize: '16px', fontFamily: 'var(--font-sans)' }}>القانونية والمخاطر</h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><a href="#" className="footer-link">إخلاء المسؤولية القانونية</a></li>
              <li><a href="#" className="footer-link">شروط الاستخدام</a></li>
              <li><a href="#" className="footer-link">سياسة الخصوصية</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3" style={{ fontSize: '16px', fontFamily: 'var(--font-sans)' }}>اشترك بنشرتنا البريدية</h5>
            <p className="mb-3" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>احصل على أحدث تحليلات السوق مباشرة إلى بريدك.</p>
            {subscribed ? (
              <div className="p-2 rounded text-center font-mono-data" style={{ backgroundColor: 'rgba(117,255,158,0.1)', color: '#75ff9e', fontSize: '12px', border: '1px solid rgba(117,255,158,0.3)' }}>
                شكراً لاشتراكك!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="d-flex flex-column gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  required
                  className="form-control custom-input py-2"
                  style={{ fontSize: '13px', direction: 'ltr', textAlign: 'left' }}
                />
                <button type="submit" className="btn py-2 fw-bold btn-glow" style={{ color: '#003918', fontSize: '13px' }}>
                  اشترك الآن
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Row: Social Icons & Copyright */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center pt-4" style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <p className="m-0 font-mono-data text-uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', letterSpacing: '0.05em' }}>
            &copy; ٢٠٢٦ بورصة أكاديمي. جميع الحقوق محفوظة.
          </p>
          <div className="d-flex align-items-center mt-3 mt-md-0" style={{ gap: '15px' }}>
            <a href="#" className="social-icon-premium">
              <FaTelegram size={18} />
            </a>
            <a href="#" className="social-icon-premium">
              <FaYoutube size={18} />
            </a>
            <a href="#" className="social-icon-premium">
              <FaXTwitter size={18} />
            </a>
            <a href="#" className="social-icon-premium">
              <FaDiscord size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
