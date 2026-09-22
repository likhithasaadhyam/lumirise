import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { recordAuditLog } from '../utils/audit.js';

const router = Router();
router.use(authenticate);

// ==========================================
// CUSTOMERS
// ==========================================
router.get('/customers', requirePermission('customers.view'), async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { organizationId: req.organizationId! },
      include: {
        _count: { select: { salesOrders: true, invoices: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(customers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/customers', requirePermission('customers.manage'), async (req: Request, res: Response) => {
  try {
    const { name, company, email, phone, address, creditLimit, taxNumber } = req.body;
    const count = await prisma.customer.count({ where: { organizationId: req.organizationId! } });
    const code = `CUST-${String(count + 1).padStart(3, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        organizationId: req.organizationId!,
        code,
        name,
        company: company || name,
        email,
        phone,
        address,
        taxNumber,
        creditLimit: Number(creditLimit) || 50000,
        status: 'ACTIVE',
      },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      details: `Created customer account ${customer.name} [${customer.code}]`,
    });

    return res.status(201).json(customer);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// LEADS
// ==========================================
router.get('/leads', requirePermission('leads.view'), async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(leads);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/leads', requirePermission('leads.manage'), async (req: Request, res: Response) => {
  try {
    const { name, company, email, phone, source, estimatedValue, assignedToName, notes } = req.body;
    const lead = await prisma.lead.create({
      data: {
        organizationId: req.organizationId!,
        name,
        company: company || name,
        email,
        phone,
        source: source || 'WEBSITE',
        status: 'NEW',
        estimatedValue: Number(estimatedValue) || 0,
        assignedToName,
        notes,
      },
    });
    return res.status(201).json(lead);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/leads/:id/stage', requirePermission('leads.manage'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// SALES ORDERS
// ==========================================
router.get('/orders', requirePermission('sales_orders.view'), async (req: Request, res: Response) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: { organizationId: req.organizationId! },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/orders', requirePermission('sales_orders.manage'), async (req: Request, res: Response) => {
  try {
    const { customerId, deliveryDate, subtotal, tax, total, items, notes } = req.body;
    const count = await prisma.salesOrder.count({ where: { organizationId: req.organizationId! } });
    const orderNumber = `SO-${9010 + count + 1}`;

    const order = await prisma.salesOrder.create({
      data: {
        organizationId: req.organizationId!,
        orderNumber,
        customerId,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        subtotal: Number(subtotal) || 0,
        tax: Number(tax) || 0,
        total: Number(total) || (Number(subtotal) || 0),
        status: 'CONFIRMED',
        itemsJson: JSON.stringify(items || []),
        notes,
      },
      include: { customer: true },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'SalesOrder',
      entityId: order.id,
      details: `Generated Sales Order ${order.orderNumber} for ${order.customer.name} ($${order.total})`,
      newValue: 'CONFIRMED',
    });

    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// INVOICES & PAYMENTS
// ==========================================
router.get('/invoices', requirePermission('invoices.view'), async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { organizationId: req.organizationId! },
      include: { customer: true, salesOrder: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(invoices);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/invoices', requirePermission('invoices.manage'), async (req: Request, res: Response) => {
  try {
    const { customerId, salesOrderId, dueDate, subtotal, tax, total, items, notes } = req.body;
    const count = await prisma.invoice.count({ where: { organizationId: req.organizationId! } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(100 + count + 1)}`;

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: req.organizationId!,
        invoiceNumber,
        customerId,
        salesOrderId: salesOrderId || null,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        subtotal: Number(subtotal) || 0,
        tax: Number(tax) || 0,
        total: Number(total) || (Number(subtotal) || 0),
        amountPaid: 0,
        status: 'SENT',
        itemsJson: JSON.stringify(items || []),
        notes,
      },
      include: { customer: true },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: `Generated Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} ($${invoice.total})`,
    });

    return res.status(201).json(invoice);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/payments', requirePermission('payments.manage'), async (req: Request, res: Response) => {
  try {
    const { invoiceId, customerId, amount, paymentDate, method, reference, notes } = req.body;
    const count = await prisma.payment.count({ where: { organizationId: req.organizationId! } });
    const paymentNumber = `PAY-${8800 + count + 1}`;

    const payment = await prisma.payment.create({
      data: {
        organizationId: req.organizationId!,
        paymentNumber,
        invoiceId,
        customerId,
        amount: Number(amount),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        method: method || 'BANK_TRANSFER',
        reference,
        notes,
      },
    });

    // Update invoice balance
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (invoice) {
      const newPaid = invoice.amountPaid + Number(amount);
      const newStatus = newPaid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newPaid, status: newStatus },
      });
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      details: `Received payment ${payment.paymentNumber} ($${amount}) for Invoice`,
    });

    return res.status(201).json(payment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
