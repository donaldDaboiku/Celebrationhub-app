<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Reset</title>
</head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Access Reset</p>
        <h1 style="margin:0 0 16px;font-size:28px;">Reset your CelebrationHub access</h1>
        <p style="margin:0 0 16px;line-height:1.6;">Hello {{ $name ?: 'there' }},</p>
        <p style="margin:0 0 16px;line-height:1.6;">We received a request to reset your account access for {{ $organizationName }}.</p>
        <div style="margin:24px 0;padding:20px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#475569;">Your reset code</p>
            <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:.2em;">{{ $token }}</p>
        </div>
        <p style="margin:0 0 16px;line-height:1.6;">Open the reset page and enter your email, this code, your new password, and optionally a new account name.</p>
        <p style="margin:0 0 24px;">
            <a href="{{ $resetUrl }}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#1d4ed8,#f97316);color:#ffffff;text-decoration:none;font-weight:700;">
                Open reset page
            </a>
        </p>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">This code expires in 60 minutes. If you did not request it, you can ignore this email.</p>
    </div>
</body>
</html>
