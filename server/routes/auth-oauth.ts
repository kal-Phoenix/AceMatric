import { Router } from 'express';

const router = Router();

// Public, non-secret OAuth configuration for the browser.
// Secrets (client secrets, private keys) are never exposed here.
router.get('/config', (_req, res) => {
  res.json({
    google: {
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  });
});

export default router;
