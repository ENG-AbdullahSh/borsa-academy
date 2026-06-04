import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';

export default function CertificateModal({ isOpen, onClose, studentName = '' }) {
  const certificateRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    const element = certificateRef.current;
    if (!element) return;
    const opt = {
      margin: 0,
      filename: 'Borsa_Academy_Certificate.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#111111', logging: false, allowTaint: true },
      jsPDF: { unit: 'px', format: [1120, 792], orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <AnimatePresence>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@700&display=swap');

        .cert-wrap * { box-sizing: border-box; }
        .cert-arabic { font-family: 'Cairo', sans-serif; }
        .cert-english { font-family: 'Inter', sans-serif; }
        .cert-signature-script { font-family: 'Dancing Script', cursive; }

        .cert-gold {
          background: linear-gradient(135deg, #D4AF37 0%, #F5D060 40%, #C8961C 70%, #E8C84A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cert-gold-border-seal {
          background: conic-gradient(#D4AF37, #F5D060, #C8961C, #F5D060, #D4AF37);
        }
      `}</style>

      {/* Backdrop */}
      <motion.div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', padding: '16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="d-flex flex-column"
          style={{ width: '100%', maxWidth: '900px' }}
          initial={{ scale: 0.88, y: 28 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        >

          {/* ─────────────── CERTIFICATE CANVAS ─────────────── */}
          <div
            id="certificate-print-area"
            ref={certificateRef}
            className="cert-wrap"
            style={{
              width: '1120px',
              height: '792px',
              backgroundColor: '#111111',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '44px 56px 32px',
              position: 'relative',
              overflow: 'hidden',
              transformOrigin: 'top left'
            }}
          >
            {/* Subtle vignette overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 65%), radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.03) 0%, transparent 60%)',
              zIndex: 0
            }} />

            {/* Thin inner gold frame line */}
            <div style={{
              position: 'absolute', inset: '12px', border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: '2px', pointerEvents: 'none', zIndex: 0
            }} />

            {/* ── BODY CONTENT ── */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

              {/* Logo + Academy Name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
                {/* Gold Chart SVG Icon */}
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '6px' }}>
                  <path d="M8 40 L18 26 L26 32 L36 16 L44 22" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M36 16 L44 16 L44 24" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="26" cy="10" r="6" fill="none" stroke="#D4AF37" strokeWidth="2"/>
                  <path d="M23 10 L25 12 L29 7" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="cert-english" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '5px', color: '#D4AF37', textTransform: 'uppercase' }}>BORSA</span>
                <span className="cert-english" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '6px', color: 'rgba(212,175,55,0.65)', textTransform: 'uppercase', marginTop: '-3px' }}>ACADEMY</span>
              </div>

              {/* Arabic Main Title */}
              <h1 dir="rtl" className="cert-arabic" style={{ margin: '0 0 2px', fontSize: '38px', fontWeight: 900, color: '#D4AF37', textAlign: 'center', lineHeight: 1.15 }}>
                شهادة إتمام دورة تدريبية
              </h1>

              {/* English Title */}
              <p dir="ltr" className="cert-english" style={{ margin: '0 0 18px', fontSize: '13px', fontWeight: 600, letterSpacing: '4px', color: '#D4AF37', textAlign: 'center', opacity: 0.85 }}>
                CERTIFICATE OF COMPLETION
              </p>

              {/* Divider */}
              <div style={{ width: '50%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.5), transparent)', marginBottom: '14px' }} />

              {/* Bilingual Verdict */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <p dir="rtl" className="cert-arabic" style={{ margin: '0 0 2px', fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  تمنح أكاديمية <span style={{ color: '#D4AF37', fontWeight: 700 }}>Borsa Academy</span> هذه الشهادة فخراً واعتزازاً بـ:
                </p>
                <p dir="ltr" className="cert-english" style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                  This is to proudly certify that
                </p>
              </div>

              {/* Student Name */}
              <div dir="rtl" style={{ textAlign: 'center', marginBottom: '10px' }}>
                <span className="cert-arabic" style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>
                  {studentName || '[ اسم الطالب الرباعي بالكامل ]'}
                </span>
              </div>

              {/* Sub-verdict bilingual */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <p dir="rtl" className="cert-arabic" style={{ margin: '0 0 2px', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                  لاجتيازه بنجاح البرنامج التدريبي المتكامل في:
                </p>
                <p dir="ltr" className="cert-english" style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                  Has successfully completed the intensive training program in:
                </p>
              </div>

              {/* Course Title */}
              <div style={{ textAlign: 'center' }}>
                <h2 dir="rtl" className="cert-arabic" style={{ margin: '0 0 4px', fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                  احتراف التداول وتحليل الأسواق المالية
                </h2>
                <p dir="ltr" className="cert-english" style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3px' }}>
                  Professional Trading & Financial Markets Analysis.
                </p>
              </div>
            </div>

            {/* ── FOOTER ROW ── */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

              {/* Bottom Left: Meta Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="cert-english" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', minWidth: '82px' }}>Issue Date:</span>
                  <span className="cert-arabic" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, direction: 'ltr' }}>
                    2026/06/04 &nbsp;:تاريخ الإصدار
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="cert-english" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', minWidth: '82px' }}>Serial No:</span>
                  <span className="cert-english" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    #BA-2026-X992 &nbsp;<span className="cert-arabic" style={{ color: 'rgba(255,255,255,0.38)' }}>:رقم الشهادة الرقمي</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="cert-english" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', minWidth: '82px' }}>Level: Advanced</span>
                  <span className="cert-arabic" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    متقدم &nbsp;:مستوى البرنامج
                  </span>
                </div>
              </div>

              {/* Bottom Center: Gold Seal */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                <div className="cert-gold-border-seal" style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  padding: '3px',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    backgroundColor: '#1a1400',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(212,175,55,0.3)'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                      <path d="M8 40 L18 26 L26 32 L36 16 L44 22" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M36 16 L44 16 L44 24" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="cert-english" style={{ fontSize: '6.5px', fontWeight: 800, letterSpacing: '1.5px', color: '#D4AF37', textTransform: 'uppercase', marginTop: '2px' }}>BORSA ACADEMY</span>
                    <span className="cert-english" style={{ fontSize: '5px', fontWeight: 500, letterSpacing: '0.5px', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase' }}>CERTIFIED</span>
                  </div>
                </div>
              </div>

              {/* Bottom Right: QR + Signature */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '16px', minWidth: '220px', justifyContent: 'flex-end' }}>
                {/* Signature */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span className="cert-signature-script" style={{ fontSize: '28px', color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>
                    Fahad Al-Rashid
                  </span>
                  <div style={{ height: '1px', width: '130px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <span className="cert-english" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>Digital Sit Director</span>
                </div>

                {/* QR Placeholder */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '34px' }}>qr_code_2</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── SCALE + BUTTONS ─── */}
          {/* Scale the wide canvas down for preview */}
          <style>{`
            #certificate-print-area {
              transform: scale(calc(min(100vw - 32px, 900px) / 1120));
              transform-origin: top left;
              margin-bottom: calc((792px * calc(min(100vw - 32px, 900px) / 1120)) - 792px);
            }
          `}</style>

          <div className="d-flex gap-3 mt-3 justify-content-end">
            <button
              onClick={onClose}
              className="btn px-4 py-2 fw-semibold text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontFamily: "'Inter', sans-serif" }}
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn px-4 py-2 fw-bold d-flex align-items-center gap-2 btn-primary-cta"
              style={{ borderRadius: '8px', fontFamily: "'Inter', sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              Download PDF Certificate
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
