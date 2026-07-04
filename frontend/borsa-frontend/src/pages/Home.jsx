import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-vh-100" style={{ paddingTop: '64px' }}>

      {/* HERO */}
      <section className="position-relative d-flex align-items-center justify-content-center overflow-hidden py-5" style={{ minHeight: '100vh' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 0 }}>
          <img className="w-100 h-100 object-cover" style={{ opacity: 0.18, filter: 'grayscale(30%) brightness(0.5)' }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl7Scdp_MO3ApG771hhXrgEhj0_kA0-Y__yBIgDG6xC6L5mqcfHKPCg-w_O9m4OOop8SQyCx1oFfSZ4Y5jX7xEoBT2EbLVgBjv5xpUKhRJXIv42JzxXSfcCDs0R8QYliKLu382QMmrFXmTCvJNjipSQyLa_BYreK6HHnRUlAAyDNiV4LkN5ugJ5z1Q-KdcA5op-8Ylxe5STyYTN97mhcCXkFqVemeVI1KYsOwlDOc1Ck-QtqyRsU0NPBOIxOMTbs6uUoBdV1HVmay5"
            alt="خلفية الأسواق المالية" />
          <div className="position-absolute top-0 start-0 w-100 h-100 hero-gradient" />
        </div>

        <div className="position-relative text-center px-4" style={{ zIndex: 1, maxWidth: '860px' }}>
          {/* Badge */}
          <div className="d-flex justify-content-center mb-4 hero-slide">
            <div className="hero-badge">
              <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="hero-badge-text">محل ثقة أكثر من +١٠ آلاف متدرب</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="fw-bold text-white mb-4 hero-slide delay-100 glow-text" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', lineHeight: 1.2, fontFamily: 'var(--font-sans)' }}>
            احترف التداول في{' '}
            <span style={{ color: '#75ff9e', fontStyle: 'italic', textShadow: '0 0 28px rgba(117,255,158,0.22)' }}>
              الأسواق المالية
            </span>
          </h1>

          {/* Subtitle — high contrast */}
          <p className="hero-subtitle mb-5 mx-auto hero-slide delay-200">
            منصة التعليم المالي الاحترافي للعصر الرقمي. تعلم استراتيجيات التداول عالية الدقة من خبراء متمرسين وأتقن علم نفس السوق لتحقيق الاتساق والربحية المستدامة.
          </p>

          {/* CTAs */}
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-4 hero-slide delay-300">
            <Link to="/courses" className="btn px-5 py-3 fw-bold btn-primary-cta" style={{ fontSize: '15px', fontFamily: 'var(--font-sans)' }}>
              استكشف الكورسات
            </Link>
            <Link to="/about" className="btn px-5 py-3 fw-bold btn-secondary-cta" style={{ fontSize: '15px', fontFamily: 'var(--font-sans)' }}>
              انضم إلى المجتمع
            </Link>
          </div>
        </div>
      </section>

      {/* WHY BORSA */}
      <section className="py-5 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold text-white mb-2" style={{ fontSize: '32px', fontFamily: 'var(--font-sans)' }}>لماذا بورصة أكاديمي؟</h2>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>الأدوات والتوجيه التي تحتاجها للتفوق في الأسواق.</p>
        </div>
        <div className="row g-4 justify-content-center">
          {[
            { icon: 'live_tv', title: 'جلسات تداول مباشرة', body: 'تداول جنبًا إلى جنب مع الخبراء في الوقت الفعلي بينما نحلل إعدادات السوق الحالية.' },
            { icon: 'psychology', title: 'إرشاد احترافي مباشر', body: 'احصل على تغذية راجعة مباشرة حول خطتك التداولية من مرشدين يمتلكون عقودًا من الخبرة.' },
            { icon: 'monitoring', title: 'أدوات تحليل بالبيانات', body: 'استخدم مؤشرات حصرية وماسحات تذبذب مُصمَّمة لاستراتيجياتنا التداولية المميزة.' },
          ].map((f, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="glass-card card-glow p-4 rounded-3 h-100 interactive">
                <div className="d-flex align-items-center justify-content-center mb-4 rounded border interactive" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(117,255,158,0.05)', borderColor: 'rgba(117,255,158,0.18)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#75ff9e' }}>{f.icon}</span>
                </div>
                <h3 className="h5 text-white fw-bold mb-3" style={{ fontFamily: 'var(--font-sans)' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.85, color: '#CBD5E1' }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-5" style={{ backgroundColor: '#0b0e11' }}>
        <div className="px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h2 className="fw-bold text-white mb-2" style={{ fontSize: '32px', fontFamily: 'var(--font-sans)' }}>قصص نجاح المتداولين</h2>
            <p style={{ fontSize: '15px', color: '#94A3B8' }}>نتائج حقيقية من مجتمعنا المتفاني.</p>
          </div>
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="glass-card rounded-3 overflow-hidden d-flex flex-column justify-content-between position-relative" style={{ minHeight: '340px' }}>
                <img className="position-absolute top-0 start-0 w-100 h-100 object-cover" style={{ opacity: 0.09, zIndex: 0 }}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCn0F8cLETwz2m0vxcGTxCSLGY2BZGaihibvvPz5645iW8BvceR-WQiIceqaadme-wUCGbZn2VqVNJM8GokZpMfZYF8GjE_hbmo7rf1nZSKlAYfT6HZ76Mo86ddycpMmkUzV9Mjs6Smn9MvrNLrlV3ysGoI3r_wKmPAz2PHib7RMhF8Nq1TOcUJ0p-YLNS1zCbB27KO-i09hVCCz3DXB5eTgo1S0Ju4AdrP_FNyzNay4bO6GeTBbHQind3hoijkt7BgPY2vcOVTk0Q"
                  alt="بيئة التداول" />
                <div className="position-relative p-4 p-lg-5" style={{ zIndex: 1 }}>
                  <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                  <h4 className="fw-semibold text-white mt-3 mb-4" style={{ fontSize: '20px', lineHeight: 1.7, fontFamily: 'var(--font-sans)', maxWidth: '540px' }}>
                    "بورصة أكاديمي مش بس أعطتني استراتيجية، هادي أعطتني مصلحة كاملة أسترزق منها. تحولت من واحد بيجرب حظه لمتداول بيطّلع ربح ثابت في ٦ شهور بس، الحمد لله."
                  </h4>
                </div>
                <div className="position-relative d-flex align-items-center gap-3 p-4" style={{ zIndex: 1 }}>
                  <div className="d-flex align-items-center justify-content-center font-mono-data fw-bold" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#111417', border: '1px solid rgba(117,255,158,0.25)', color: '#75ff9e', fontSize: '13px' }}>م.أ</div>
                  <div>
                    <p className="m-0 text-white fw-bold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>محمود الأشقر</p>
                    <p className="m-0 font-mono-data text-uppercase" style={{ color: '#75ff9e', fontSize: '9px' }}>متداول فوركس متفرغ</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4 d-flex flex-column gap-4">
              <div className="glass-card p-4 rounded-3 flex-grow-1 d-flex flex-column justify-content-between">
                <p className="fst-italic mb-4" style={{ fontSize: '14px', lineHeight: 1.9, color: '#E2E8F0', fontWeight: 400 }}>"والله جزئية النفسية في التداول كانت هي اللي ضايلالي. فهمت كيف أتحكم بحالي وهادا اللي غيّر كل إشي معي."</p>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '28px', height: '28px', backgroundColor: '#00a9e8' }} />
                  <span className="text-white fw-semibold" style={{ fontSize: '13px' }}>نور حلس</span>
                </div>
              </div>
              <div className="glass-card p-4 rounded-3 flex-grow-1 d-flex flex-column justify-content-between">
                <p className="fst-italic mb-4" style={{ fontSize: '14px', lineHeight: 1.9, color: '#E2E8F0', fontWeight: 400 }}>"من يوم ما دخلت الأكاديمية وأموري تمام التمام، المتابعة والشرح اشي فاخر ع الآخر وبصراحة فرقت معي كتير في التداول."</p>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '28px', height: '28px', backgroundColor: '#00e676' }} />
                  <span className="text-white fw-semibold" style={{ fontSize: '13px' }}>أحمد الدحدوح</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 position-relative overflow-hidden">
        <div className="container text-center position-relative py-5" style={{ maxWidth: '800px', zIndex: 1 }}>
          <h2 className="fw-bold text-white mb-3" style={{ fontSize: '34px', fontFamily: 'var(--font-sans)' }}>هل أنت مستعد لتحقيق الإتقان الرقمي؟</h2>
          <p className="mb-5 mx-auto" style={{ color: '#F8FAFC', fontSize: '16px', maxWidth: '500px', lineHeight: 1.6, fontWeight: 500 }}>
            سجّل اليوم واحصل على وصول فوري إلى ورشة "ميزة التداول" التمهيدية مجانًا.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-4">
            <Link to="/courses" className="btn px-5 py-3 fw-bold btn-primary-cta" style={{ fontSize: '15px', fontFamily: 'var(--font-sans)' }}>
              ابدأ الآن
            </Link>
            <div className="d-flex align-items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-mono-data text-uppercase" style={{ color: '#F8FAFC', fontSize: '11px' }}> ضمان الاحترافية و الاتقان</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
