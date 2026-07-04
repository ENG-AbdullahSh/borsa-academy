import { formatCertificateDate } from '../utils/certificates';

export default function CertificateCard({ certificate }) {
  return (
    <article
      className="certificate-card position-relative overflow-hidden"
      dir="rtl"
      style={{
        maxWidth: '920px',
        margin: '0 auto',
        padding: 'clamp(28px, 6vw, 64px)',
        borderRadius: '24px',
        border: '1px solid rgba(212,175,55,0.55)',
        background: 'radial-gradient(circle at top, rgba(212,175,55,0.12), transparent 45%), #111417',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
      }}
    >
      <div
        className="position-absolute"
        style={{ inset: '14px', border: '1px solid rgba(212,175,55,0.18)', borderRadius: '16px', pointerEvents: 'none' }}
      />

      <div className="position-relative text-center">
        <span className="material-symbols-outlined mb-3" style={{ color: '#d4af37', fontSize: '58px' }}>
          workspace_premium
        </span>
        <p className="font-mono-data mb-2" style={{ color: '#d4af37', fontSize: '12px', letterSpacing: '0.18em' }}>
          BORSA ACADEMY
        </p>
        <h1 className="text-white fw-bold mb-3" style={{ fontSize: 'clamp(30px, 5vw, 52px)' }}>
          شهادة إتمام دورة
        </h1>
        <p className="text-muted mb-4">تشهد أكاديمية بورصة بأن الطالب/ة</p>
        <h2 className="fw-bold mb-4" style={{ color: '#75ff9e', fontSize: 'clamp(26px, 4vw, 42px)' }}>
          {certificate.student_name}
        </h2>
        <p className="text-muted mb-2">قد أتم/ت بنجاح دورة</p>
        <h3 className="text-white fw-bold mb-5" style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}>
          {certificate.certificate_title || certificate.course_title}
        </h3>

        <div className="row g-3 text-start">
          <div className="col-6 col-md-3">
            <div className="rounded-3 p-3 h-100" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>تاريخ الإصدار</span>
              <strong className="text-white">{formatCertificateDate(certificate.issued_at)}</strong>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="rounded-3 p-3 h-100" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>رقم الشهادة</span>
              <strong className="font-mono-data" dir="ltr" style={{ color: '#d4af37' }}>{certificate.certificate_number}</strong>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="rounded-3 p-3 h-100" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>نسبة الإنجاز</span>
              <strong style={{ color: '#75ff9e' }}>{certificate.progress_percentage}%</strong>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="rounded-3 p-3 h-100" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>عدد الساعات</span>
              <strong className="text-white">{certificate.duration_hours ? `${certificate.duration_hours} ساعة` : '—'}</strong>
            </div>
          </div>
        </div>

        {/* Signatures row */}
        <div className="row g-3 text-center mt-2">
          <div className="col-12 col-md-6">
            <div className="rounded-3 p-3 h-100" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>المدرب</span>
              <div style={{ width: '120px', borderBottom: '1px solid rgba(212,175,55,0.4)', margin: '12px auto 8px' }} />
              <strong className="text-white">{certificate.instructor_name || '—'}</strong>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="rounded-3 p-3 h-100" style={{ background: 'rgba(255,255,255,0.035)' }}>
              <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>مدير المركز</span>
              <div style={{ width: '120px', borderBottom: '1px solid rgba(212,175,55,0.4)', margin: '12px auto 8px' }} />
              <strong className="text-white">{certificate.center_director_name || '—'}</strong>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
