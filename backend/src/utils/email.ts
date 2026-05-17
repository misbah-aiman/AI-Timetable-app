import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const { error } = await resend.emails.send({
    from: `AI Timetable <${FROM}>`,
    to,
    subject: `${otp} — your sign-in code`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:36px 40px;text-align:center;">
      <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
        <span style="font-size:26px;">✨</span>
      </div>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">AI Timetable</h1>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">Your sign-in code</h2>
      <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
        Use the code below to sign in to your account. It expires in <strong>10 minutes</strong>.
      </p>

      <!-- OTP box -->
      <div style="background:#eef2ff;border:2px dashed #6366f1;border-radius:14px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <span style="font-size:46px;font-weight:800;letter-spacing:10px;color:#4338ca;font-variant-numeric:tabular-nums;">${otp}</span>
      </div>

      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
        If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#d1d5db;font-size:12px;">AI Timetable — your smart study companion</p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
};
