import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { supabase, formatSupabaseError, snakeToCamel } from '../db';
import { requireAuth, requireAdmin } from '../middleware';

const router = Router();

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  }
});

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

// Rate limiter for payment submissions: 5 per hour per user
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many payment submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.email || ipKeyGenerator(req),
});

// GET /api/payments/accounts — public account details
router.get('/accounts', (_req, res) => {
  res.json(ACCOUNT_DETAILS);
});

// GET /api/payments/my — user's own payment requests
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('id, user_email, user_name, payment_method, amount, transaction_ref, screenshot_url, status, admin_notes, created_at, reviewed_at')
      .eq('user_email', req.user!.email)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json((data || []).map(snakeToCamel));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// POST /api/payments/submit — submit a payment request with screenshot
router.post('/submit', requireAuth, submitLimiter, upload.single('screenshot'), async (req, res) => {
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
    const { data: existing, error: existingError } = await supabase
      .from('payment_requests')
      .select('id, status')
      .eq('user_email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ error: formatSupabaseError(existingError) });
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
    const { data: profile } = await supabase
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

    const { error: insertError } = await supabase
      .from('payment_requests')
      .insert([record]);

    if (insertError) {
      return res.status(500).json({ error: formatSupabaseError(insertError) });
    }

    res.json({ success: true, payment: snakeToCamel(record) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit payment request.' });
  }
});

// ── Admin Routes ───────────────────────────────────────────────────────────

// GET /api/payments — admin: list all payment requests
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('payment_requests')
      .select('id, user_email, user_name, payment_method, amount, transaction_ref, screenshot_url, status, admin_notes, created_at, reviewed_at')
      .order('created_at', { ascending: false });

    if (status && typeof status === 'string' && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(200);
    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json((data || []).map(snakeToCamel));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
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

    // Fetch the payment request
    const { data: payment, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment request not found.' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'This payment has already been reviewed.' });
    }

    // If approving, update isPremium first
    if (status === 'approved') {
      const { error: premiumError } = await supabase
        .from('student_profiles')
        .update({ is_premium: true })
        .eq('email', payment.user_email);

      if (premiumError) {
        return res.status(500).json({ error: 'Failed to upgrade user to Pro. Please try again.' });
      }
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({
        status,
        admin_notes: adminNotes || '',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      // Rollback isPremium if payment update fails after approval
      if (status === 'approved') {
        await supabase
          .from('student_profiles')
          .update({ is_premium: false })
          .eq('email', payment.user_email);
      }
      return res.status(500).json({ error: formatSupabaseError(updateError) });
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

      await supabase.from('notifications').insert([{
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
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
