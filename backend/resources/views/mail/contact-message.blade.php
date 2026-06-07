<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسالة تواصل جديدة - بورصة أكاديمي</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0d1117;
      direction: rtl;
      padding: 32px 16px;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #0b0e11 0%, #111820 100%);
      border: 1px solid rgba(117, 255, 158, 0.25);
      border-radius: 12px 12px 0 0;
      padding: 32px;
      text-align: center;
    }
    .logo-badge {
      display: inline-block;
      background: rgba(117, 255, 158, 0.08);
      border: 1px solid rgba(117, 255, 158, 0.3);
      border-radius: 999px;
      padding: 6px 20px;
      color: #75ff9e;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .header h1 {
      color: #F8FAFC;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .header p {
      color: #94A3B8;
      font-size: 14px;
    }
    .body {
      background: #111417;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-top: none;
      padding: 32px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #75ff9e;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(117, 255, 158, 0.15);
    }
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 24px;
    }
    .info-row {
      display: table-row;
    }
    .info-label {
      display: table-cell;
      color: #64748B;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 8px 0;
      width: 100px;
      vertical-align: top;
    }
    .info-value {
      display: table-cell;
      color: #E2E8F0;
      font-size: 14px;
      padding: 8px 0 8px 16px;
      vertical-align: top;
    }
    .message-box {
      background: rgba(11, 14, 17, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 8px;
      padding: 20px;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    .message-box p {
      color: #CBD5E1;
      font-size: 15px;
      line-height: 1.9;
      white-space: pre-wrap;
    }
    .meta-row {
      background: rgba(117, 255, 158, 0.04);
      border: 1px solid rgba(117, 255, 158, 0.1);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .meta-icon {
      color: #75ff9e;
      font-size: 16px;
    }
    .meta-text {
      color: #94A3B8;
      font-size: 12px;
    }
    .meta-text strong {
      color: #E2E8F0;
    }
    .footer {
      background: #0b0e11;
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-top: none;
      border-radius: 0 0 12px 12px;
      padding: 20px 32px;
      text-align: center;
    }
    .footer p {
      color: #475569;
      font-size: 12px;
      line-height: 1.7;
    }
    .footer a {
      color: #75ff9e;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.05);
      margin: 20px 0;
    }
    .subject-pill {
      display: inline-block;
      background: rgba(129, 207, 255, 0.1);
      border: 1px solid rgba(129, 207, 255, 0.25);
      border-radius: 999px;
      padding: 4px 14px;
      color: #81cfff;
      font-size: 13px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header">
      <div class="logo-badge">Borsa Academy</div>
      <h1>رسالة تواصل جديدة</h1>
      <p>وردت عبر نموذج التواصل في الموقع</p>
    </div>

    <!-- Body -->
    <div class="body">

      <div class="section-title">بيانات المُرسِل</div>

      <div class="info-grid">
        <div class="info-row">
          <div class="info-label">الاسم</div>
          <div class="info-value"><strong>{{ $senderName }}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">البريد</div>
          <div class="info-value">
            <a href="mailto:{{ $senderEmail }}" style="color: #81cfff; text-decoration: none;">
              {{ $senderEmail }}
            </a>
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">الموضوع</div>
          <div class="info-value">
            <span class="subject-pill">{{ $subject }}</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>
      <div class="section-title">نص الرسالة</div>
      <div class="message-box">
        <p>{{ $messageBody }}</p>
      </div>

      <div class="divider"></div>

      <!-- Submission time -->
      <div class="meta-row">
        <span class="meta-icon">🕐</span>
        <span class="meta-text">
          وقت الإرسال: <strong>{{ $submittedAt }}</strong>
        </span>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        هذه الرسالة وردت تلقائيًا من نموذج التواصل في
        <a href="https://borsa.academy">بورصة أكاديمي</a>.
        للرد على المُرسِل اضغط "رد" وسيُعاد توجيه الرد إلى بريده الإلكتروني مباشرةً.
      </p>
    </div>

  </div>
</body>
</html>
