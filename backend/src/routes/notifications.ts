import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        organizationId: req.organizationId!,
        OR: [
          { userId: req.user!.userId },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json(notifications);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        organizationId: req.organizationId!,
        OR: [
          { userId: req.user!.userId },
          { userId: null },
        ],
      },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
