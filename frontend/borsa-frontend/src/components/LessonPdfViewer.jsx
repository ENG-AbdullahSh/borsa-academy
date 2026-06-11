import { useState } from 'react';

/**
 * LessonPdfViewer
 * Displays the PDF file associated with the currently active lesson.
 * Supports inline preview (via <iframe>) and a download button.
 */
export default function LessonPdfViewer({ lesson }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  if (!lesson?.pdf_url) return null;

  const fileName = lesson.pdf_url.split('/').pop() || `${lesson.title}.pdf`;

  return (
    <section
      className="glass-card rounded-3 overflow-hidden"
      style={{ direction: 'rtl' }}
      aria-label="ملف PDF للدرس"
    >
      {/* ─── Header ─── */}
      <div
        className="p-4 d-flex align-items-center justify-content-between"
        style={{ borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(117,255,158,0.1)',
              border: '1px solid rgba(117,255,158,0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#75ff9e', fontSize: '22px' }}>
              picture_as_pdf
            </span>
          </div>
          <div>
            <p
              className="m-0 text-white fw-semibold"
              style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}
            >
              ملف PDF — {lesson.title}
            </p>
            <p className="m-0 text-muted font-mono-data" style={{ fontSize: '11px' }}>
              {fileName}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Download Button */}
          <a
            href={lesson.pdf_url}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="btn d-flex align-items-center gap-1 fw-semibold"
            style={{
              backgroundColor: 'rgba(117,255,158,0.12)',
              color: '#75ff9e',
              border: '1px solid rgba(117,255,158,0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              padding: '6px 14px',
              textDecoration: 'none',
              transition: 'background-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(117,255,158,0.22)';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(117,255,158,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(117,255,158,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            تحميل
          </a>

          {/* Toggle Preview Button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded((v) => !v);
              setPreviewError(false);
            }}
            className="btn d-flex align-items-center gap-1 fw-semibold"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              padding: '6px 14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px', transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              expand_more
            </span>
            {isExpanded ? 'إخفاء المعاينة' : 'معاينة'}
          </button>
        </div>
      </div>

      {/* ─── Inline Preview ─── */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {previewError ? (
            /* Fallback when the browser blocks the iframe (e.g. Content-Disposition: attachment) */
            <div
              className="d-flex flex-column align-items-center justify-content-center gap-3 py-5 rounded-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#75ff9e' }}>
                picture_as_pdf
              </span>
              <p className="text-muted m-0" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                تعذّر تحميل المعاينة في المتصفح.
              </p>
              <a
                href={lesson.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn fw-semibold"
                style={{
                  backgroundColor: '#75ff9e',
                  color: '#003918',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  padding: '8px 20px',
                  textDecoration: 'none',
                }}
              >
                فتح في تبويب جديد
              </a>
            </div>
          ) : (
            <div
              className="rounded-2 overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}
            >
              {/* Loading shimmer shown behind iframe */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 0,
                }}
              >
                <span className="spinner-border spinner-border-sm" style={{ color: '#75ff9e' }} aria-hidden="true" />
              </div>
              <iframe
                src={lesson.pdf_url}
                title={`PDF — ${lesson.title}`}
                width="100%"
                style={{
                  height: '520px',
                  border: 'none',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: '#1a1a2e',
                }}
                onError={() => setPreviewError(true)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
