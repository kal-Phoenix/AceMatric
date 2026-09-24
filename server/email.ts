import { Resend } from 'resend';

let _resend: Resend | null = null;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your-resend-api-key') {
    console.warn('[email] RESEND_API_KEY not set. Emails will be logged instead of sent.');
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<boolean> {
  const resend = getResend();
  const sender = from || `AceMatric <${process.env.CONTACT_EMAIL || 'support@acematric.edu.et'}>`;

  if (!resend) {
    console.log(`[email] Would send to ${to}: "${subject}"`);
    console.log(`[email] HTML preview: ${html.substring(0, 200)}...`);
    return true; // Return true in dev mode so flow continues
  }

  try {
    await resend.emails.send({
      from: sender,
      to: [to],
      subject,
      html,
    });
    console.log(`[email] Sent to ${to}: "${subject}"`);
    return true;
  } catch (err: any) {
    console.error(`[email] Failed to send to ${to}:`, err.message);
    return false;
  }
}

export function renderRecoveryEmail(code: string, appName = 'AceMatric'): string {
  const safeAppName = escapeHtml(appName);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:16px;">🎓</div>
      <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 8px;">${safeAppName} Password Recovery</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">We received a request to reset your password.</p>
      
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #334155;">
        <p style="color:#64748b;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your recovery code</p>
        <p style="color:#2dd4bf;font-size:32px;font-weight:900;margin:0;letter-spacing:6px;font-family:monospace;">${code}</p>
      </div>

      <p style="color:#64748b;font-size:12px;margin:0;">This code expires in <strong style="color:#94a3b8;">10 minutes</strong>. If you didn't request this, ignore this email.</p>
    </div>
    <div style="padding:16px;background:#0f172a;border-top:1px solid #1e293b;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} ${safeAppName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderWelcomeEmail(name: string, appName = 'AceMatric'): string {
  const safeName = escapeHtml(name);
  const safeAppName = escapeHtml(appName);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:16px;">🎉</div>
      <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 8px;">Welcome to ${safeAppName}!</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">Hi ${safeName}, your account has been created successfully.</p>
      
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #334155;text-align:left;">
        <p style="color:#2dd4bf;font-size:14px;font-weight:bold;margin:0 0 12px;">Here's what you can do:</p>
        <div style="color:#94a3b8;font-size:13px;line-height:1.8;">
          <p style="margin:4px 0;">📚 Study with curriculum-aligned notes</p>
          <p style="margin:4px 0;">🎯 Practice with thousands of questions</p>
          <p style="margin:4px 0;">📝 Take timed past exam simulations</p>
          <p style="margin:4px 0;">🤖 Get help from AI Tutor</p>
          <p style="margin:4px 0;">🏆 Compete on the national leaderboard</p>
        </div>
      </div>

      <a href="${process.env.APP_URL || 'https://acematric.edu.et'}" style="display:inline-block;padding:12px 32px;background:linear-gradient(to right,#2dd4bf,#34d399);color:#0f172a;font-weight:900;font-size:14px;border-radius:12px;text-decoration:none;">Start Studying →</a>
      
      <p style="color:#64748b;font-size:12px;margin:24px 0 0;">Consistency over intensity. You've got this! 💪</p>
    </div>
    <div style="padding:16px;background:#0f172a;border-top:1px solid #1e293b;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderProgressSummaryEmail(name: string, stats: { studyMinutes: number; practiceCount: number; streak: number; readinessScore: number }, appName = 'AceMatric'): string {
  const safeName = escapeHtml(name);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:16px;">📊</div>
      <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 8px;">Weekly Progress Summary</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">Hi ${safeName}, here's how you did this week!</p>
      
      <div style="display:flex;gap:12px;justify-content:center;margin:0 0 24px;">
        <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;flex:1;">
          <p style="color:#64748b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">Study Time</p>
          <p style="color:#2dd4bf;font-size:24px;font-weight:900;margin:8px 0 0;">${stats.studyMinutes}m</p>
        </div>
        <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;flex:1;">
          <p style="color:#64748b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">Streak</p>
          <p style="color:#f59e0b;font-size:24px;font-weight:900;margin:8px 0 0;">${stats.streak}🔥</p>
        </div>
        <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;flex:1;">
          <p style="color:#64748b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">Readiness</p>
          <p style="color:#818cf8;font-size:24px;font-weight:900;margin:8px 0 0;">${stats.readinessScore}%</p>
        </div>
      </div>

      <a href="${process.env.APP_URL || 'https://acematric.edu.et'}" style="display:inline-block;padding:12px 32px;background:linear-gradient(to right,#2dd4bf,#34d399);color:#0f172a;font-weight:900;font-size:14px;border-radius:12px;text-decoration:none;">Keep Studying →</a>
    </div>
    <div style="padding:16px;background:#0f172a;border-top:1px solid #1e293b;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
