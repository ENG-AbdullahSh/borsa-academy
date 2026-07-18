import React from 'react';

export default function TermsPrivacy() {
  return (
    <div className="min-vh-100" style={{ paddingTop: '64px', backgroundColor: 'var(--bg-color)' }} dir="rtl">
      
      {/* ── Page Header ── */}
      <section className="py-5 text-center px-4" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <h1 className="fw-bold text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.25, fontFamily: 'var(--font-sans)' }}>
          الشروط والأحكام <span style={{ color: '#75ff9e' }}>وسياسة الخصوصية</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '16px', lineHeight: 1.85, color: '#E2E8F0' }}>
          نحن في Borsa Academy نهتم بخصوصيتك ونظامنا التعليمي. يرجى قراءة الشروط التالية بعناية لضمان تجربة تعليمية آمنة وفعالة.
        </p>
      </section>

      {/* ── Main Content ── */}
      <section className="py-4 container px-4 mb-5" style={{ maxWidth: '1100px' }}>
        
        {/* Valdex Requirement (Critical) */}
        <div className="glass-card p-4 p-md-5 rounded-4 mb-5" style={{ border: '1px solid rgba(117, 255, 158, 0.4)', position: 'relative', overflow: 'hidden' }}>
          <div className="position-absolute top-0 start-0 w-100 h-100 hero-gradient" style={{ opacity: 0.5, pointerEvents: 'none' }}></div>
          <div className="d-flex align-items-center mb-3">
            <span className="material-symbols-outlined me-3" style={{ color: '#75ff9e', fontSize: '32px' }}>verified_user</span>
            <h2 className="fw-bold text-white mb-0" style={{ fontSize: '24px', fontFamily: 'var(--font-sans)' }}>الشرط الحصري للوصول (أولوية قصوى)</h2>
          </div>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#F8FAFC', fontWeight: '500' }}>
            نذكرك أن الوصول للمنصة يتطلب أن تكون عضواً نشطاً في شركة <strong>فالدكس (Valdex)</strong>. 
            بدون هذا الارتباط، لا يمكن تفعيل الحساب أو الوصول للكورسات الحصرية المقدمة في أكاديميتنا.
          </p>
        </div>

        <div className="row g-4">
          {/* Terms Cards */}
          {[
            {
              icon: 'school',
              title: 'التعليم ليس نصيحة مالية',
              desc: 'كل ما يُعرض في المنصة من دورات ومواد تعليمية هو لأغراض التدريب والتعليم فقط ولا يُعتبر بأي حال من الأحوال نصيحة مالية أو استثمارية مباشرة.',
              color: '#81cfff'
            },
            {
              icon: 'copyright',
              title: 'حماية الحقوق',
              desc: 'جميع المواد التعليمية مملوكة للأكاديمية. يمنع منعاً باتاً نسخ المحتوى، إعادة توزيعه، أو مشاركة تفاصيل الحساب مع أطراف أخرى.',
              color: '#75ff9e'
            },
            {
              icon: 'person',
              title: 'الاستخدام العادل',
              desc: 'الحساب الذي يتم إنشاؤه مخصص لشخص واحد فقط وللاستخدام من جهاز واحد. أي استخدام يتنافى مع هذا المبدأ يعرض الحساب للتعليق.',
              color: '#81cfff'
            },
            {
              icon: 'gavel',
              title: 'المسؤولية',
              desc: 'نحتفظ بالحق الكامل في تعليق أو إلغاء أي حساب في حال مخالفة سياسات التداول الخاصة بنا، أو في حال انتهاك قواعد السلوك العام للمنصة.',
              color: '#ffb4ab'
            }
          ].map((term, idx) => (
            <div key={idx} className="col-12 col-md-6">
              <div className="glass-card p-4 rounded-3 h-100 hover-glow transition-all">
                <div className="d-flex align-items-center mb-3">
                  <div 
                    className="d-flex align-items-center justify-content-center rounded" 
                    style={{ width: '48px', height: '48px', backgroundColor: `${term.color}15`, border: `1px solid ${term.color}30` }}
                  >
                    <span className="material-symbols-outlined" style={{ color: term.color }}>{term.icon}</span>
                  </div>
                  <h3 className="h5 fw-bold text-white mb-0 ms-3 me-3" style={{ fontFamily: 'var(--font-sans)' }}>
                    {term.title}
                  </h3>
                </div>
                <p className="text-muted mb-0" style={{ fontSize: '15px', lineHeight: 1.8 }}>
                  {term.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Privacy Policy Summary ── */}
        <div className="mt-5 p-4 p-md-5 glass-card rounded-4">
          <h2 className="fw-bold text-white mb-4" style={{ fontSize: '24px', fontFamily: 'var(--font-sans)' }}>سياسة الخصوصية</h2>
          <p className="text-muted mb-4" style={{ fontSize: '15px', lineHeight: 1.8 }}>
            نحن نلتزم بحماية بياناتك الشخصية ومعلومات حسابك. يتم استخدام بياناتك فقط لغرض تفعيل حسابك والتحقق من ارتباطه بشركة فالدكس (Valdex)، بالإضافة إلى تحسين تجربتك التعليمية على منصتنا.
          </p>
          <ul className="list-unstyled d-flex flex-column gap-3 text-muted" style={{ fontSize: '15px' }}>
            <li className="d-flex align-items-start">
              <span className="material-symbols-outlined me-2" style={{ color: '#75ff9e', fontSize: '20px' }}>check_circle</span>
              <span><strong>جمع البيانات:</strong> نجمع المعلومات الأساسية للتسجيل والتواصل، بالإضافة إلى بيانات التقدم في الكورسات.</span>
            </li>
            <li className="d-flex align-items-start">
              <span className="material-symbols-outlined me-2" style={{ color: '#75ff9e', fontSize: '20px' }}>check_circle</span>
              <span><strong>حماية البيانات:</strong> نستخدم أحدث تقنيات التشفير لضمان أمان بياناتك وحمايتها من الوصول غير المصرح به.</span>
            </li>
            <li className="d-flex align-items-start">
              <span className="material-symbols-outlined me-2" style={{ color: '#75ff9e', fontSize: '20px' }}>check_circle</span>
              <span><strong>مشاركة البيانات:</strong> لا نقوم ببيع أو مشاركة بياناتك مع أي جهات خارجية باستثناء ما يتطلبه التحقق من اشتراك Valdex.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
