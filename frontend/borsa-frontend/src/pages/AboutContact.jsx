import React, { useState } from 'react';

const MENTORS = [
  { name: 'د. إلياس ثورن', role: 'مدير الاقتصاد الكلي الكمي', bio: 'متخصص سابق في بورصة شيكاغو التجارية. ٢٢ عامًا في رسم خريطة لعدم كفاءة الأسواق.', color: '#75ff9e' },
  { name: 'سارة شن، CFA', role: 'مهندسة تدفق الأوامر', bio: 'مكتب الخوارزميات السابق في مورغان ستانلي. متخصصة في تحليل التدفق والبنية الجزئية.', color: '#81cfff' },
  { name: 'ماركوس فولت', role: 'بنية العملات الرقمية الجزئية', bio: 'استراتيجي كمي في HFT متخصص في استخلاص السيولة والتنفيذ منخفض الكمون.', color: '#75ff9e' },
  { name: 'جوليان فانس', role: 'مدرب أداء التداول', bio: 'معالج نفسي سلوكي معرفي ومحلل كمي سابق. متخصص في الانضباط المنهجي.', color: '#81cfff' },
];

const SUBJECTS = ['استفسار عام', 'طلب إرشاد مالي', 'ترخيص مؤسسي'];

export default function AboutContact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'استفسار عام', message: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.email && form.message) {
      setIsSuccess(true);
      setTimeout(() => { setIsSuccess(false); setForm({ name: '', email: '', subject: 'استفسار عام', message: '' }); }, 3500);
    }
  };

  return (
    <div className="min-vh-100" style={{ paddingTop: '64px' }}>

      {/* Page Title */}
      <section className="py-5 text-center px-4" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <h1 className="fw-bold text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.25, fontFamily: 'var(--font-sans)' }}>
          دمقرطة التنفيذ{' '}
          <span style={{ color: '#75ff9e', fontStyle: 'italic' }}>عالي الدقة</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '16px', lineHeight: 1.85, color: '#E2E8F0' }}>
          نسد الفجوة بين المتداولين الأفراد والمكاتب المؤسسية بتقديم مبادئ تداول تقنية موثّقة وحقيقية بعيدًا عن الضجيج المعتاد في الصناعة.
        </p>
      </section>

      {/* Stats */}
      <section className="py-4 container" style={{ maxWidth: '1100px' }}>
        <div className="row g-3">
          {[
            { value: '+٥٠,٠٠٠', label: 'مستخدم نشط في المنصة', color: '#75ff9e' },
            { value: '٩٨.٤٪', label: 'مؤشر الرضا', color: '#81cfff' },
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

      {/* Mentors */}
      <section className="py-5 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold text-white mb-2" style={{ fontSize: '32px', fontFamily: 'var(--font-sans)' }}>تعرف على أساطير القاعة</h2>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>تعليم من متداولين نجوا من دورات سوقية متعددة.</p>
        </div>
        <div className="row g-4 justify-content-center">
          {MENTORS.map((m, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="glass-card rounded-3 overflow-hidden d-flex flex-column h-100 hover-glow">
                <div className="p-4 d-flex flex-column align-items-center text-center flex-grow-1">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 fw-bold font-mono-data" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.04)', border: `2px solid ${m.color}20`, color: m.color, fontSize: '20px' }}>
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

      {/* Contact */}
      <section id="contact" className="py-5" style={{ backgroundColor: '#0b0e11' }}>
        <div className="px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div className="row g-4 align-items-center">

            {/* Info */}
            <div className="col-12 col-md-5">
              <h2 className="fw-bold text-white mb-3" style={{ fontSize: '32px', fontFamily: 'var(--font-sans)' }}>إنشاء تواصل</h2>
              <p style={{ fontSize: '14px', lineHeight: 1.85, maxWidth: '400px', fontFamily: 'var(--font-sans)', color: '#CBD5E1', marginBottom: '2.5rem' }}>
                هل تحتاج إلى دعم مؤسسي متخصص؟ لديك أسئلة حول تكاملات المناهج؟ أرسل تفاصيلك وسيتواصل معك فريق الكم لدينا.
              </p>
              <div className="d-flex flex-column gap-4">
                {[
                  { icon: 'mail', label: 'نقطة دعم الكم', value: 'terminal@borsa.academy' },
                  { icon: 'share', label: 'مركز الإحداثيات', value: 'الطابق ٤٨، برج العالم التجاري، نيويورك' },
                  { icon: 'forum', label: 'مجتمع ديسكورد', value: 'discord.gg/borsa-inner-circle' },
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center border rounded" style={{ width: '40px', height: '40px', minWidth: '40px', backgroundColor: 'rgba(117,255,158,0.05)', borderColor: 'rgba(117,255,158,0.18)' }}>
                      <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '20px' }}>{item.icon}</span>
                    </div>
                    <div>
                      <p className="m-0 text-muted font-mono-data text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>{item.label}</p>
                      <p className="m-0 text-white fw-semibold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="col-12 col-md-7">
              <div className="glass-card p-4 rounded-3">
                {isSuccess ? (
                  <div className="text-center py-5">
                    <span className="material-symbols-outlined display-4 mb-3" style={{ color: '#75ff9e', fontVariationSettings: "'FILL' 1" }}>done_all</span>
                    <h4 className="text-white fw-bold" style={{ fontFamily: 'var(--font-sans)' }}>تم إرسال الاستفسار بنجاح</h4>
                    <p className="text-muted mx-auto" style={{ fontSize: '13px', maxWidth: '360px', fontFamily: 'var(--font-sans)' }}>
                      تم توقيع حزمة بياناتك الآمنة وإرسالها لمراجعة المشغل. توقع ردًا تقنيًا في غضون ساعتين.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="font-mono-data d-block mb-2 text-uppercase" style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.08em' }}>الاسم</label>
                        <input type="text" required placeholder="د. سامي العتيبي" value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="form-control custom-input py-2" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }} />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="font-mono-data d-block mb-2 text-uppercase" style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.08em' }}>البريد الإلكتروني</label>
                        <input type="email" required placeholder="client@terminal.com" value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="form-control custom-input py-2" style={{ fontSize: '13px', direction: 'ltr', textAlign: 'left' }} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="font-mono-data d-block mb-2 text-uppercase" style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.08em' }}>موضوع الاستفسار</label>
                      <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="form-select custom-input py-2" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                        {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="font-mono-data d-block mb-2 text-uppercase" style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.08em' }}>نص الرسالة</label>
                      <textarea rows="4" required placeholder="صِف خلفيتك التداولية وأهداف استفسارك..." value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="form-control custom-input py-2" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'none' }} />
                    </div>
                    <button type="submit" className="btn w-100 py-2 fw-bold"
                      style={{ backgroundColor: '#75ff9e', color: '#003918', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-sans)', boxShadow: '0 0 18px rgba(117,255,158,0.2)' }}>
                      إرسال الإشارة
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
