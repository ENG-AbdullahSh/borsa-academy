<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>شهادة إتمام دورة</title>
  <style>
    /* ══════════════════════════════════════════════════════════════
       FONT EMBEDDING
       DomPDF resolves @font-face src relative to the Blade render
       context, so we pass an absolute OS path.
       ══════════════════════════════════════════════════════════════ */
    @font-face {
      font-family: 'CairoNew';
      font-style: normal;
      font-weight: 400;
      src: url("{{ $fontRegular }}") format('truetype');
    }
    @font-face {
      font-family: 'CairoNew';
      font-style: normal;
      font-weight: 700;
      src: url("{{ $fontBold }}") format('truetype');
    }

    /* ══════════════════════════════════════════════════════════════
       PAGE SETUP
       ══════════════════════════════════════════════════════════════ */
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body, table, tr, td {
      font-family: 'CairoNew', sans-serif;
    }

    body {
      width: 297mm;
      height: 210mm;
      background-color: #111417;
      color: #ffffff;
      overflow: hidden;
      direction: rtl;
    }

    /* ══════════════════════════════════════════════════════════════
       OUTER PAGE WRAPPER
       DomPDF supports position:absolute, so we use it for
       decorative layers instead of Flexbox/Grid.
       ══════════════════════════════════════════════════════════════ */
    .page {
      position: relative;
      width: 297mm;
      height: 210mm;
      background-color: #111417;
      overflow: hidden;
    }

    /* ── Background radial glow (gold top-center) ───────────────── */
    .bg-glow {
      position: absolute;
      top: -40mm;
      left: 50%;
      margin-left: -80mm;
      width: 160mm;
      height: 100mm;
      background: radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 70%);
    }

    /* ── Outer border frame (exact match to React card border) ──── */
    .outer-border {
      position: absolute;
      top: 5mm;
      left: 5mm;
      right: 5mm;
      bottom: 5mm;
      border: 1px solid rgba(212,175,55,0.55);
      border-radius: 16px;
    }

    /* ── Inner border frame (exact match to React card inset border) ─ */
    .inner-border {
      position: absolute;
      top: 9mm;
      left: 9mm;
      right: 9mm;
      bottom: 9mm;
      border: 1px solid rgba(212,175,55,0.18);
      border-radius: 12px;
    }

    /* ══════════════════════════════════════════════════════════════
       CONTENT — centre column (table-based layout for DomPDF)
       ══════════════════════════════════════════════════════════════ */
    .content-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 297mm;
      height: 210mm;
    }

    /* Vertical centering via top padding */
    .content-inner {
      width: 240mm;
      margin: 0 auto;
      padding-top: 15mm;
      text-align: center;
    }

    /* ── Premium star / badge icon (SVG inline) ─────────────────── */
    .badge-icon {
      width: 15mm;
      height: 15mm;
      margin-bottom: 2mm;
    }

    /* ── Academy name ────────────────────────────────────────────── */
    .academy-name {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #d4af37;
      text-transform: uppercase;
      margin-bottom: 1mm;
    }

    /* ── Thin gold rule ─────────────────────────────────────────── */
    .rule {
      width: 40mm;
      height: 0.3mm;
      background: #d4af37;
      margin: 0 auto 4mm;
      opacity: 0.5;
    }

    /* ── "شهادة إتمام دورة" ──────────────────────────────────────── */
    .cert-main-title {
      font-size: 30pt;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 3mm;
      line-height: 1.1;
    }

    /* ── Sub-label "تشهد أكاديمية بورصة بأن الطالب/ة" ──────────── */
    .presented-to {
      font-size: 10pt;
      font-weight: 400;
      color: rgba(255,255,255,0.55);
      margin-bottom: 3mm;
    }

    /* ── Student name ────────────────────────────────────────────── */
    .student-name {
      font-size: 26pt;
      font-weight: 700;
      color: #75ff9e;
      margin-bottom: 3mm;
      line-height: 1.2;
    }

    /* ── "قد أتم/ت بنجاح دورة" ──────────────────────────────────── */
    .completion-label {
      font-size: 10pt;
      font-weight: 400;
      color: rgba(255,255,255,0.55);
      margin-bottom: 2mm;
    }

    /* ── Course name ─────────────────────────────────────────────── */
    .course-name {
      font-size: 20pt;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8mm;
      line-height: 1.3;
    }

    /* ══════════════════════════════════════════════════════════════
       FOOTER ROW — 3 rounded cards matching React card exactly
       ══════════════════════════════════════════════════════════════ */
    .footer-table {
      width: 220mm;
      margin: 0 auto;
      border-collapse: separate;
      border-spacing: 5mm 0;
    }

    .footer-card {
      background: rgba(255, 255, 255, 0.035);
      border-radius: 8px;
      padding: 10px 14px;
      text-align: right;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .footer-label {
      font-size: 8pt;
      font-weight: 400;
      color: rgba(255,255,255,0.40);
      margin-bottom: 2px;
      display: block;
    }

    .footer-value {
      font-size: 10pt;
      font-weight: 700;
      color: #ffffff;
      display: block;
    }

    .footer-value-gold {
      font-size: 9pt;
      font-weight: 700;
      color: #d4af37;
      display: block;
    }

    .footer-value-green {
      font-size: 11pt;
      font-weight: 700;
      color: #75ff9e;
      display: block;
    }
  </style>
</head>
<body>
<div class="page">

  {{-- Background glow --}}
  <div class="bg-glow"></div>

  {{-- Outer gold border --}}
  <div class="outer-border"></div>

  {{-- Inner gold border --}}
  <div class="inner-border"></div>

  {{-- Main content --}}
  <div class="content-wrapper">
    <div class="content-inner">

      {{-- Premium badge SVG (star / workspace_premium equivalent) --}}
      <div style="margin-bottom:2mm; text-align:center;">
        <svg class="badge-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="58" height="58">
          <circle cx="24" cy="24" r="23" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.4"/>
          <polygon points="24,8 27.5,19 39,19 29.5,26 33,37 24,30 15,37 18.5,26 9,19 20.5,19"
                   fill="#d4af37" opacity="0.9"/>
        </svg>
      </div>

      {{-- Academy name --}}
      <div class="academy-name">BORSA ACADEMY</div>
      <div class="rule"></div>

      {{-- Certificate main title (Arabic, pre-shaped) --}}
      <div class="cert-main-title">{{ $labels['certTitle'] }}</div>

      {{-- Presented to --}}
      <div class="presented-to">{{ $labels['presentedTo'] }}</div>

      {{-- Student name --}}
      <div class="student-name">{{ $studentName }}</div>

      {{-- Completion label --}}
      <div class="completion-label">{{ $labels['completionText'] }}</div>

      {{-- Course name --}}
      <div class="course-name">{{ $courseName }}</div>

      {{-- Footer info row --}}
      <table class="footer-table">
        <tr>
          {{-- Date --}}
          <td style="width: 33.33%; padding: 0;">
            <div class="footer-card">
              <span class="footer-label">{{ $labels['labelDate'] }}</span>
              <span class="footer-value">{{ $issuedAt }}</span>
            </div>
          </td>

          {{-- Certificate number --}}
          <td style="width: 33.33%; padding: 0;">
            <div class="footer-card">
              <span class="footer-label">{{ $labels['labelCertNumber'] }}</span>
              <span class="footer-value-gold" dir="ltr">{{ $certNumber }}</span>
            </div>
          </td>

          {{-- Progress --}}
          <td style="width: 33.33%; padding: 0;">
            <div class="footer-card">
              <span class="footer-label">{{ $labels['labelProgress'] }}</span>
              <span class="footer-value-green">{{ $progress }}%</span>
            </div>
          </td>
        </tr>
      </table>

    </div>
  </div>

</div>
</body>
</html>
