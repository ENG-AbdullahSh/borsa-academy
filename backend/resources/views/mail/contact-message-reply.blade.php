<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $replySubject }}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#0d1117;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <div style="max-width:620px;margin:0 auto;background:#111417;border:1px solid rgba(117,255,158,.22);border-radius:12px;overflow:hidden;">
    <div style="padding:28px 32px;background:#0b0e11;text-align:center;border-bottom:1px solid rgba(255,255,255,.06);">
      <div style="display:inline-block;padding:6px 18px;border-radius:999px;background:rgba(117,255,158,.08);color:#75ff9e;font-size:12px;font-weight:700;">
        Borsa Academy
      </div>
      <h1 style="margin:16px 0 0;color:#f8fafc;font-size:22px;">رد على رسالتك</h1>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 18px;color:#e2e8f0;font-size:15px;">مرحبًا {{ $recipientName }}،</p>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">بخصوص رسالتك: {{ $originalSubject }}</p>
      <h2 style="margin:0 0 16px;color:#81cfff;font-size:17px;">{{ $replySubject }}</h2>
      <div style="padding:20px;border-radius:8px;background:#0b0e11;border:1px solid rgba(255,255,255,.07);color:#cbd5e1;font-size:15px;line-height:1.9;white-space:pre-wrap;">{{ $replyMessage }}</div>
    </div>

    <div style="padding:18px 32px;background:#0b0e11;text-align:center;color:#64748b;font-size:12px;">
      فريق بورصة أكاديمي
    </div>
  </div>
</body>
</html>
