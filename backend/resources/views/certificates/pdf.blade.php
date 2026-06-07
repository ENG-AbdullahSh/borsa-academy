<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>Certificate of Completion</title>
  <style>
    /* ── Reset & page ──────────────────────────────────────────────── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    body {
      width: 297mm;
      height: 210mm;
      font-family: Georgia, 'Times New Roman', serif;
      background: #0a0e1a;
      color: #ffffff;
      overflow: hidden;
    }

    /* ── Outer frame ───────────────────────────────────────────────── */
    .page {
      width: 297mm;
      height: 210mm;
      position: relative;
      background: linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0d1220 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Decorative corner borders */
    .corner {
      position: absolute;
      width: 60px;
      height: 60px;
      border-color: #22c55e;
      border-style: solid;
      opacity: 0.7;
    }
    .corner-tl { top: 24px; left: 24px;  border-width: 3px 0 0 3px; }
    .corner-tr { top: 24px; right: 24px; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 24px; left: 24px;  border-width: 0 0 3px 3px; }
    .corner-br { bottom: 24px; right: 24px; border-width: 0 3px 3px 0; }

    /* Outer glow ring */
    .outer-border {
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(34, 197, 94, 0.15);
      border-radius: 4px;
    }

    /* ── Content card ──────────────────────────────────────────────── */
    .card {
      position: relative;
      z-index: 10;
      width: 240mm;
      text-align: center;
      padding: 12mm 18mm;
    }

    /* ── Header ────────────────────────────────────────────────────── */
    .academy-name {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #22c55e;
      margin-bottom: 6px;
    }

    .header-rule {
      width: 80px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #22c55e, transparent);
      margin: 0 auto 14px;
    }

    /* ── "Certificate of Completion" title ─────────────────────────── */
    .cert-label {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8pt;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      margin-bottom: 10px;
    }

    .cert-title {
      font-size: 28pt;
      font-weight: 400;
      font-style: italic;
      color: #ffffff;
      margin-bottom: 14px;
      line-height: 1.1;
    }

    /* ── Body text ─────────────────────────────────────────────────── */
    .presented-to {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: rgba(255,255,255,0.5);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .student-name {
      font-size: 22pt;
      font-weight: 700;
      font-style: italic;
      color: #22c55e;
      margin-bottom: 10px;
      line-height: 1.2;
    }

    .completion-text {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: rgba(255,255,255,0.55);
      margin-bottom: 8px;
    }

    .course-name {
      font-size: 14pt;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 18px;
      line-height: 1.3;
    }

    /* ── Decorative separator ──────────────────────────────────────── */
    .separator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .sep-line {
      width: 60px;
      height: 1px;
      background: rgba(34,197,94,0.3);
    }
    .sep-diamond {
      width: 6px;
      height: 6px;
      background: #22c55e;
      transform: rotate(45deg);
      opacity: 0.7;
    }

    /* ── Footer row ────────────────────────────────────────────────── */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .footer-block {
      text-align: center;
      flex: 1;
    }

    .footer-label {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 7pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.35);
      margin-bottom: 4px;
    }

    .footer-value {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      font-weight: 600;
      color: rgba(255,255,255,0.75);
    }

    .footer-divider {
      width: 1px;
      height: 30px;
      background: rgba(255,255,255,0.08);
    }

    /* ── Background glow circles ───────────────────────────────────── */
    .glow-circle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%);
      pointer-events: none;
    }
    .glow-1 { width: 300px; height: 300px; top: -80px; left: -60px; }
    .glow-2 { width: 280px; height: 280px; bottom: -60px; right: -40px; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Background glows -->
    <div class="glow-circle glow-1"></div>
    <div class="glow-circle glow-2"></div>

    <!-- Decorative frame -->
    <div class="outer-border"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- Main content -->
    <div class="card">

      <div class="academy-name">Borsa Academy</div>
      <div class="header-rule"></div>

      <div class="cert-label">Certificate of Completion</div>
      <div class="cert-title">Achievement Recognized</div>

      <div class="presented-to">This certificate is proudly presented to</div>

      <div class="student-name">{{ $studentName }}</div>

      <div class="completion-text">
        for the successful completion of
      </div>

      <div class="course-name">&ldquo;{{ $courseName }}&rdquo;</div>

      <div class="separator">
        <div class="sep-line"></div>
        <div class="sep-diamond"></div>
        <div class="sep-line"></div>
      </div>

      <!-- Footer row -->
      <div class="footer">
        <div class="footer-block">
          <div class="footer-label">Date Issued</div>
          <div class="footer-value">{{ $issuedAt }}</div>
        </div>

        <div class="footer-divider"></div>

        <div class="footer-block">
          <div class="footer-label">Certificate ID</div>
          <div class="footer-value" style="font-family: 'Courier New', monospace; font-size: 8pt; letter-spacing: 1px;">
            {{ $certNumber }}
          </div>
        </div>

        <div class="footer-divider"></div>

        <div class="footer-block">
          <div class="footer-label">Issued By</div>
          <div class="footer-value">Borsa Academy</div>
        </div>
      </div>

    </div><!-- /.card -->

  </div><!-- /.page -->
</body>
</html>
