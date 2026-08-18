import { Router } from 'express';
import { requireAuth } from '../middleware';
import { savePushSubscription, removePushSubscription, getPushSubscriptions } from '../push';
import { validateBody, pushSubscribeSchema, pushUnsubscribeSchema } from '../validation';

const router = Router();

// POST /api/push/subscribe — register a push subscription
router.post('/subscribe', requireAuth, validateBody(pushSubscribeSchema), async (req, res) => {
  try {
    const { endpoint, p256dh, auth } = req.body;

    const success = await savePushSubscription(req.user!.email, endpoint, p256dh, auth);
    if (!success) return res.status(500).json({ error: 'Failed to save subscription.' });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
});

// POST /api/push/unsubscribe — remove a push subscription
router.post('/unsubscribe', requireAuth, validateBody(pushUnsubscribeSchema), async (req, res) => {
  try {
    const { endpoint } = req.body;

    const success = await removePushSubscription(endpoint);
    if (!success) return res.status(500).json({ error: 'Failed to remove subscription.' });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove subscription.' });
  }
});

// GET /api/push/status — check if user has active subscriptions
router.get('/status', requireAuth, async (req, res) => {
  try {
    const subscriptions = await getPushSubscriptions(req.user!.email);
    res.json({ subscribed: subscriptions.length > 0, count: subscriptions.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check subscription status.' });
  }
});

export default router;
