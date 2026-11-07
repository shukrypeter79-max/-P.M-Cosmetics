import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create a pending payment record using the server-calculated order total.
// Real gateway intents must be created with configured Stripe/PayPal credentials.
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { orderId, method } = req.body;
    if (typeof orderId !== 'string' || !orderId || !['CREDIT_CARD', 'PAYPAL'].includes(method)) {
      return res.status(400).json({ error: 'A valid orderId and payment method are required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.userId !== req.userId) {
      return res.status(403).json({ error: 'You cannot pay for this order' });
    }
    if (order.paymentStatus === 'COMPLETED') {
      return res.status(409).json({ error: 'Order has already been paid' });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        method,
        amount: order.total,
        gateway: method === 'CREDIT_CARD' ? 'stripe' : 'paypal',
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      payment,
      message: 'Payment is pending. A configured payment gateway is required to complete it.',
    });
  } catch {
    return res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Clients must never be allowed to mark a payment complete by supplying a
// transaction ID. Completion must be confirmed by a verified gateway webhook.
router.post('/verify/:paymentId', authenticate, async (_req: any, res) => {
  return res.status(501).json({
    error: 'Client-side payment verification is disabled; use a verified gateway webhook',
  });
});

export default router;
