import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRole(['ADMIN', 'PRODUCTION_MANAGER', 'HR_MANAGER']), async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
