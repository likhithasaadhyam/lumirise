import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { recordAuditLog } from '../utils/audit.js';
import {
  generateInspectionNumber,
  generateProductionOrderNumber,
  generateDispatchNumber,
} from '../utils/sequence.js';

const router = Router();
router.use(authenticate);

// ==========================================
// PRODUCTION PLANS
// ==========================================
router.get('/plans', requirePermission('production.view'), async (req: Request, res: Response) => {
  try {
    const plans = await prisma.productionPlan.findMany({
      where: { organizationId: req.organizationId! },
      include: {
        orders: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(plans);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/plans', async (req: Request, res: Response) => {
  try {
    const { title, startDate, endDate, notes } = req.body;
    const count = await prisma.productionPlan.count({ where: { organizationId: req.organizationId! } });
    const planNumber = `PLAN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const plan = await prisma.productionPlan.create({
      data: {
        organizationId: req.organizationId!,
        planNumber,
        title,
        startDate,
        endDate,
        notes,
        status: 'APPROVED',
      },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'ProductionPlan',
      entityId: plan.id,
      details: `Created production plan ${plan.planNumber}: ${plan.title}`,
    });

    return res.status(201).json(plan);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// PRODUCTION ORDERS
// ==========================================
router.get('/orders', requirePermission(['production.view', 'my_orders.view']), async (req: Request, res: Response) => {
  try {
    const { status, productId } = req.query;
    const where: any = { organizationId: req.organizationId! };
    if (status && status !== 'ALL') where.status = String(status);
    if (productId && productId !== 'ALL') where.productId = String(productId);

    // If production employee, filter to their supervised or shift orders
    if (req.user?.role === 'PRODUCTION_EMPLOYEE' && req.user.employeeId) {
      where.OR = [
        { assignedSupervisorId: req.user.employeeId },
        { status: 'IN_PROGRESS' },
      ];
    }

    const orders = await prisma.productionOrder.findMany({
      where,
      include: {
        product: true,
        productionPlan: true,
        shift: true,
        assignedSupervisor: true,
        materialIssues: { include: { rawMaterial: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.productionOrder.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: {
        product: true,
        productionPlan: true,
        shift: true,
        assignedSupervisor: true,
        materialIssues: { include: { rawMaterial: true } },
      },
    });
    if (!order) return res.status(404).json({ message: 'Production order not found' });
    return res.json(order);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/orders', requirePermission('production.create'), async (req: Request, res: Response) => {
  try {
    const {
      productId,
      targetQuantity,
      startDate,
      dueDate,
      shiftId,
      assignedSupervisorId,
      productionPlanId,
      notes,
    } = req.body;

    let order: any;
    let attempts = 0;
    while (attempts < 5) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const orderNumber = await generateProductionOrderNumber(tx, req.organizationId!);
          return await tx.productionOrder.create({
            data: {
              organizationId: req.organizationId!,
              orderNumber,
              productId,
              targetQuantity: Number(targetQuantity),
              completedQuantity: 0,
              rejectedQuantity: 0,
              startDate,
              dueDate,
              shiftId: shiftId || null,
              assignedSupervisorId: assignedSupervisorId || null,
              productionPlanId: productionPlanId || null,
              status: 'PLANNED',
              notes,
            },
            include: { product: true },
          });
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'ProductionOrder',
      entityId: order.id,
      details: `Created production order ${order.orderNumber} for ${order.product.name} (Qty: ${order.targetQuantity})`,
      newValue: 'PLANNED',
    });

    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/orders/:id/status', requirePermission('production.manage'), async (req: Request, res: Response) => {
  try {
    const { status, completedQuantity, rejectedQuantity } = req.body;
    const existing = await prisma.productionOrder.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: { product: true },
    });

    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (completedQuantity !== undefined) updateData.completedQuantity = Number(completedQuantity);
    if (rejectedQuantity !== undefined) updateData.rejectedQuantity = Number(rejectedQuantity);

    const updated = await prisma.productionOrder.update({
      where: { id: existing.id },
      data: updateData,
      include: { product: true, shift: true, assignedSupervisor: true },
    });

    // If completed, automatically update product inventory
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      const addedQty = (Number(completedQuantity) || existing.completedQuantity) - existing.completedQuantity;
      if (addedQty > 0) {
        await prisma.product.update({
          where: { id: existing.productId },
          data: { currentStock: { increment: addedQty } },
        });
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'STATUS_CHANGE',
      entity: 'ProductionOrder',
      entityId: updated.id,
      details: `Production Order ${updated.orderNumber} status updated to ${updated.status}. Completed: ${updated.completedQuantity}/${updated.targetQuantity}`,
      oldValue: existing.status,
      newValue: updated.status,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// QUALITY CONTROL
// ==========================================
router.get('/quality', requirePermission(['quality.view', 'quality.manage']), async (req: Request, res: Response) => {
  try {
    const inspections = await prisma.qualityInspection.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(inspections);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/quality', requirePermission('quality.manage'), async (req: Request, res: Response) => {
  try {
    const {
      stage,
      referenceType,
      referenceNumber,
      itemName,
      sampleSize,
      defectsCount,
      status,
      notes,
    } = req.body;

    let inspection: any;
    let attempts = 0;
    while (attempts < 5) {
      try {
        inspection = await prisma.$transaction(async (tx) => {
          const inspectionNumber = await generateInspectionNumber(tx, req.organizationId!);
          return await tx.qualityInspection.create({
            data: {
              organizationId: req.organizationId!,
              inspectionNumber,
              stage: stage || 'FINISHED_PRODUCT',
              referenceType: referenceType || 'ProductionOrder',
              referenceNumber,
              itemName,
              inspectorName: `${req.user!.firstName} ${req.user!.lastName}`,
              sampleSize: Number(sampleSize) || 10,
              defectsCount: Number(defectsCount) || 0,
              status: status || 'PASS',
              notes,
            },
          });
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'QualityInspection',
      entityId: inspection.id,
      details: `Recorded Quality Inspection ${inspection.inspectionNumber} for ${itemName} [${inspection.status}]`,
      newValue: inspection.status,
    });

    return res.status(201).json(inspection);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// FINISHED GOODS & DISPATCH
// ==========================================
router.get('/finished-goods', requirePermission(['finished_goods.view', 'warehouse.view']), async (req: Request, res: Response) => {
  try {
    const goods = await prisma.finishedGood.findMany({
      where: { organizationId: req.organizationId! },
      include: {
        product: true,
        warehouse: true,
        productionOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(goods);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/dispatches', requirePermission(['dispatch.view', 'dispatch.manage']), async (req: Request, res: Response) => {
  try {
    const dispatches = await prisma.dispatchOrder.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(dispatches);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/dispatches', requirePermission('dispatch.manage'), async (req: Request, res: Response) => {
  try {
    const {
      salesOrderNumber,
      customerName,
      carrier,
      trackingNumber,
      dispatchDate,
      itemSummary,
      totalItems,
      destination,
      notes,
    } = req.body;

    let dispatch: any;
    let attempts = 0;
    while (attempts < 5) {
      try {
        dispatch = await prisma.$transaction(async (tx) => {
          const dispatchNumber = await generateDispatchNumber(tx, req.organizationId!);
          return await tx.dispatchOrder.create({
            data: {
              organizationId: req.organizationId!,
              dispatchNumber,
              salesOrderNumber,
              customerName,
              carrier,
              trackingNumber: trackingNumber || `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
              dispatchDate: dispatchDate || new Date().toISOString().split('T')[0],
              status: 'DISPATCHED',
              itemSummary,
              totalItems: Number(totalItems) || 1,
              destination,
              notes,
            },
          });
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'DispatchOrder',
      entityId: dispatch.id,
      details: `Created Dispatch Order ${dispatch.dispatchNumber} to ${customerName} via ${carrier}`,
      newValue: 'DISPATCHED',
    });

    return res.status(201).json(dispatch);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
