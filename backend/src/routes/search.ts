import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ employees: [], orders: [], products: [], customers: [], invoices: [] });
    }

    const orgId = req.organizationId!;

    const [employees, orders, products, customers, invoices] = await Promise.all([
      prisma.employee.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { employeeCode: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { designation: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.productionOrder.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { orderNumber: { contains: q } },
            { product: { name: { contains: q } } },
          ],
        },
        include: { product: true },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { sku: { contains: q } },
            { name: { contains: q } },
            { category: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.customer.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { code: { contains: q } },
            { name: { contains: q } },
            { company: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { invoiceNumber: { contains: q } },
            { customer: { name: { contains: q } } },
          ],
        },
        include: { customer: true },
        take: 5,
      }),
    ]);

    return res.json({
      employees,
      orders,
      products,
      customers,
      invoices,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
