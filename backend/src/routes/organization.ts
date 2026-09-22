import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/settings', async (req: Request, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId! },
      include: {
        roles: true,
        _count: {
          select: {
            users: true,
            employees: true,
            departments: true,
            warehouses: true,
            products: true,
          },
        },
      },
    });
    return res.json(org);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/settings', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { name, industry, size, country, email, phone, address, currency } = req.body;
    const updated = await prisma.organization.update({
      where: { id: req.organizationId! },
      data: {
        name,
        industry,
        size,
        country,
        email,
        phone,
        address,
        currency,
      },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/users', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.organizationId! },
      include: { role: true, employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Roles & Permissions Matrix Management
router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: { organizationId: req.organizationId! },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(roles);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/roles/:id/permissions', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body; // array of permission code strings, e.g. ['dashboard.view', ...]
    const roleId = req.params.id;

    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId: req.organizationId! },
    });
    if (!role) return res.status(404).json({ message: 'Role not found' });

    // Wipe existing and re-insert
    await prisma.permission.deleteMany({ where: { roleId } });

    if (Array.isArray(permissions) && permissions.length > 0) {
      await prisma.permission.createMany({
        data: permissions.map((code: string) => {
          const [module = 'general', action = 'view'] = code.split('.');
          return {
            roleId,
            module,
            action,
            code,
          };
        }),
      });
    }

    const updated = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
