import { Router } from 'express';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { supabaseAdmin, formatSupabaseError, snakeToCamel } from '../db';
import { requireAuth, requireAdmin, rateLimitOpts } from '../middleware';
import { imageUpload, MIME_TO_EXT } from '../upload-utils';

const router = Router();

const PAYMENT_AMOUNT = Number(process.env.PRO_MONTHLY_PRICE) || 299;
const MAX_TRANSACTION_REF_LENGTH = 200;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ACCOUNT_DETAILS: Record<string, { bank: string; accountName: string; accountNumber: string; note: string }> = {
  cbe: {
    bank: process.env.PAYMENT_CBE_BANK || 'Commercial Bank of Ethiopia (CBE)',
    accountName: process.env.PAYMENT_CBE_ACCOUNT_NAME || 'AceMatric EdTech',
    accountNumber: process.env.PAYMENT_CBE_ACCOUNT_NUMBER || '',
    note: process.env.PAYMENT_CBE_NOTE || `Transfer exactly ${PAYMENT_AMOUNT} ETB and include your email in the reference.`,
  },
  telebirr: {
    bank: process.env.PAYMENT_TELEBIRR_BANK || 'Telebirr',
    accountName: process.env.PAYMENT_TELEBIRR_ACCOUNT_NAME || 'AceMatric EdTech',
    accountNumber: process.env.PAYMENT_TELEBIRR_ACCOUNT_NUMBER || '',
    note: process.env.PAYMENT_TELEBIRR_NOTE || `Send exactly ${PAYMENT_AMOUNT} ETB via Telebirr and include your email in the note.`,
  },
  abyssinia: {
    bank: process.env.PAYMENT_BANK_BANK || 'Bank of Abyssinia',
    accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME || 'AceMatric EdTech',
    accountNumber: process.env.PAYMENT_BANK_ACCOUNT_NUMBER || '',
    note: process.env.PAYMENT_BANK_NOTE || `Transfer exactly ${PAYMENT_AMOUNT} ETB and include your email in the reference.`,
  },
};

// Rate limiter for payment submissions: 5 per hour per user (Redis-backed when available)
const submitLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many payment submissions. Please try again later.' },
  keyGenerator: (req: any) => req.user?.email || ipKeyGenerator(req),
}));

// Signed URLs stored at upload time expire (7 days), so older payment proofs
// would 404 during admin review. Regenerate from the stored path on every read.
const SCREENSHOT_URL_TTL_SECONDS = 604800;

async function withFreshScreenshotUrl(row: any): Promise<any> {
  if (!row?.screenshot_path) return row;
  try {
    const { getSupabase } = await import('../db');
    const { data, error } = await getSupabase().storage
      .from('payment-screenshots')
      .createSignedUrl(row.screenshot_path, SCREENSHOT_URL_TTL_SECONDS);
    if (!error && data?.signedUrl) {
      return { ...row, screenshot_url: data.signedUrl };
    }
  } catch (err) {
    console.warn('[payments] Failed to refresh screenshot URL:', err);
  }
  return row;
}

// GET /api/payments/accounts — account details (auth required)
router.get('/accounts', requireAuth, (_req, res) => {
  res.json(ACCOUNT_DETAILS);
});

// GET /api/payments/my — user's own payment requests
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, user_email, user_name, payment_method, amount, transaction_ref, screenshot_url, status, admin_notes, created_at, reviewed_at')
      .eq('user_email', req.user!.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[payments] Fetch error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    const rows = await Promise.all((data || []).map(withFreshScreenshotUrl));
    res.json(rows.map(snakeToCamel));
  } catch (err: any) {
    console.error('[payments] Error fetching payments:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// PAYMENTS DISABLED — everything is free for now. Reject before multer runs.
const paymentsDisabled = (_req: any, res: any) =>
  res.status(503).json({ error: 'Payments are disabled — AceMatric is currently free for everyone.' });

// POST /api/payments/submit — submit a payment request with screenshot
router.post('/submit', requireAuth, submitLimiter, paymentsDisabled, imageUpload.single('screenshot'), async (req, res) => {
  try {
    const { paymentMethod, transactionRef } = req.body;

    if (!paymentMethod || !ACCOUNT_DETAILS[paymentMethod]) {
      return res.status(400).json({ error: 'Invalid payment method. Choose CBE, Telebirr, or Abyssinia.' });
    }
    if (!transactionRef || typeof transactionRef !== 'string' || transactionRef.trim().length < 3) {
      return res.status(400).json({ error: 'Transaction reference is required (phone number, reference code, etc.).' });
    }
    if (transactionRef.trim().length > MAX_TRANSACTION_REF_LENGTH) {
      return res.status(400).json({ error: `Transaction reference must be ${MAX_TRANSACTION_REF_LENGTH} characters or fewer.` });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required.' });
    }

    // Validate magic bytes match declared MIME type
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected) {
      return res.status(400).json({ error: 'Could not verify file type. Please upload a valid image.' });
    }
    if (detected.mime !== req.file.mimetype) {
      return res.status(400).json({ error: 'File content does not match declared type' });
    }

    const email = req.user!.email;

    // Check for existing pending payment
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('payment_requests')
      .select('id, status')
      .eq('user_email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingError) {
      console.error('[payments] Existing payment check error:', existingError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    if (existing) {
      return res.status(409).json({ error: 'You already have a pending payment request. Please wait for it to be reviewed.' });
    }

    // Upload screenshot to Supabase Storage
    const ext = MIME_TO_EXT[req.file.mimetype] || '.jpg';
    const fileName = `payment-${crypto.randomUUID()}${ext}`;
    const filePath = `${email}/${fileName}`;

    const { getSupabase } = await import('../db');
    const sb = getSupabase();

    const { error: uploadError } = await sb.storage
      .from('payment-screenshots')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: 'Failed to upload screenshot. Please try again.' });
    }

    // Generate signed URL (7 day expiry) for admin review
    const { data: signedData, error: signedError } = await sb.storage
      .from('payment-screenshots')
      .createSignedUrl(filePath, 604800);

    if (signedError || !signedData?.signedUrl) {
      return res.status(500).json({ error: 'Failed to generate screenshot URL. Please try again.' });
    }

    const screenshotUrl = signedData.signedUrl;

    // Get user name from profile
    const { data: profile } = await supabaseAdmin
      .from('student_profiles')
      .select('name')
      .eq('email', email)
      .maybeSingle();

    const paymentId = `pay-${crypto.randomUUID()}`;

    const record = {
      id: paymentId,
      user_email: email,
      user_name: profile?.name || email.split('@')[0],
      payment_method: paymentMethod,
      amount: PAYMENT_AMOUNT,
      transaction_ref: transactionRef.trim(),
      screenshot_url: screenshotUrl,
      screenshot_path: filePath,
      status: 'pending',
      admin_notes: '',
      created_at: new Date().toISOString(),
      reviewed_at: null,
    };

    const { error: insertError } = await supabaseAdmin
      .from('payment_requests')
      .insert([record]);

    if (insertError) {
      console.error('[payments] Insert error:', insertError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    res.json({ success: true, payment: snakeToCamel(record) });
  } catch (err: any) {
    console.error('[payments] Error submitting payment:', err);
    res.status(500).json({ error: 'Failed to submit payment request.' });
  }
});

// GET /api/payments — admin: list all payment requests
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('payment_requests')
      .select('id, user_email, user_name, payment_method, amount, transaction_ref, screenshot_url, status, admin_notes, created_at, reviewed_at')
      .order('created_at', { ascending: false });

    if (status && typeof status === 'string' && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(200);
    if (error) {
      console.error('[payments] Admin list error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    const rows = await Promise.all((data || []).map(withFreshScreenshotUrl));
    res.json(rows.map(snakeToCamel));
  } catch (err: any) {
    console.error('[payments] Error listing payments:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// PUT /api/payments/:id — admin: approve or reject
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected".' });
    }

    // Atomic check-and-update to prevent race condition (two admins approving simultaneously)
    const { data: payment, error: atomicUpdateError } = await supabaseAdmin
      .from('payment_requests')
      .update({
        status,
        admin_notes: adminNotes || '',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (atomicUpdateError) {
      console.error('[payments] Atomic update error:', atomicUpdateError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    if (!payment) {
      return res.status(400).json({ error: 'This payment has already been reviewed or was not found.' });
    }

    // If approving, update isPremium with expiry date (30 days from now)
    if (status === 'approved') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: premiumError } = await supabaseAdmin
        .from('student_profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
        })
        .eq('email', payment.user_email);

      if (premiumError) {
        console.error('[payments] Premium upgrade error:', premiumError);
        // Rollback: set payment back to pending since premium update failed
        await supabaseAdmin
          .from('payment_requests')
          .update({ status: 'pending', admin_notes: '', reviewed_at: null })
          .eq('id', id);
        return res.status(500).json({ error: 'Failed to upgrade user to Pro. Please try again.' });
      }
    }

    if (status === 'rejected') {
      const { error: rejectError } = await supabaseAdmin
        .from('student_profiles')
        .update({ is_premium: false })
        .eq('email', payment.user_email);

      if (rejectError) {
        console.error('[payments] Rejection error:', rejectError);
      }
    }

    // Send notification (best effort, don't fail the request)
    try {
      const notifId = `notif-${crypto.randomUUID()}`;
      const notifMessage = status === 'approved'
        ? 'Your payment has been verified. You now have unlimited access to all Pro features.'
        : (adminNotes ? `Your payment could not be verified. ${escapeHtml(adminNotes)}` : 'Your payment could not be verified. Please try again or contact support.');
      const notifTitle = status === 'approved' ? 'Pro Upgrade Approved!' : 'Payment Not Verified';
      const notifType = status === 'approved' ? 'achievement' : 'info';
      const notifAction = status === 'approved' ? 'dashboard' : 'upgrade';

      await supabaseAdmin.from('notifications').insert([{
        id: notifId,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: notifAction,
        user_email: payment.user_email,
      }]);

      // Send email notification (best effort)
      try {
        const { sendEmail } = await import('../email');
        const appName = process.env.APP_NAME || 'AceMatric';
        const emailHtml = status === 'approved'
          ? `<div style="font-family:sans-serif;max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155;color:#f1f5f9;">
              <h1 style="font-size:20px;margin:0 0 12px;">🎉 Payment Approved!</h1>
              <p style="color:#94a3b8;font-size:14px;">Your ${payment.payment_method.toUpperCase()} payment of ${payment.amount} ETB has been verified.</p>
              <p style="color:#2dd4bf;font-size:14px;font-weight:bold;">You now have unlimited access to all Pro features.</p>
              <p style="color:#64748b;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} ${appName}</p>
            </div>`
          : `<div style="font-family:sans-serif;max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155;color:#f1f5f9;">
              <h1 style="font-size:20px;margin:0 0 12px;">Payment Not Verified</h1>
              <p style="color:#94a3b8;font-size:14px;">Your payment could not be verified.</p>
              ${adminNotes ? `<p style="color:#f87171;font-size:13px;">Reason: ${escapeHtml(adminNotes)}</p>` : ''}
              <p style="color:#94a3b8;font-size:13px;">Please try again or contact support.</p>
              <p style="color:#64748b;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} ${appName}</p>
            </div>`;

        await sendEmail({
          to: payment.user_email,
          subject: `${appName} — ${notifTitle}`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error('[payments] Failed to send email notification:', emailErr);
      }
    } catch (notifErr) {
      console.error('[payments] Failed to send notification:', notifErr);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[payments] Error reviewing payment:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

export default router;
