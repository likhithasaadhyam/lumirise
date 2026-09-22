import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { recordAuditLog } from '../utils/audit.js';

const router = Router();
router.use(authenticate);

// ==========================================
// RAW MATERIALS
// ==========================================
router.get('/raw-materials', requirePermission(['inventory.view', 'stock.view']), async (req: Request, res: Response) => {
  try {
    const materials = await prisma.rawMaterial.findMany({
      where: { organizationId: req.organizationId! },
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });
    return res.json(materials);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/raw-materials', requirePermission('inventory.manage'), async (req: Request, res: Response) => {
  try {
    let { name, code, category, unit, unitCost, minStockLevel, initialStock, supplierId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Material name is required.' });
    }

    // Auto-generate code if empty or whitespace
    if (!code || !code.trim()) {
      const count = await prisma.rawMaterial.count({ where: { organizationId: req.organizationId! } });
      code = `RM-${String(count + 1).padStart(3, '0')}`;
    } else {
      code = code.trim().toUpperCase();
    }

    // Check if code already exists in this organization
    const existing = await prisma.rawMaterial.findFirst({
      where: { organizationId: req.organizationId!, code },
    });
    if (existing) {
      return res.status(409).json({
        message: `A raw material with code "${code}" already exists ("${existing.name}"). Please use a unique code.`,
      });
    }

    const material = await prisma.rawMaterial.create({
      data: {
        organizationId: req.organizationId!,
        code,
        name: name.trim(),
        category: category || 'Raw Materials',
        unit: unit || 'pcs',
        unitCost: Number(unitCost) || 0,
        minStockLevel: Number(minStockLevel) || 50,
        currentStock: Number(initialStock) || 0,
        supplierId: supplierId || null,
      },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'RawMaterial',
      entityId: material.id,
      details: `Added raw material ${material.name} (${material.code})`,
    });

    return res.status(201).json(material);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'A raw material with this code already exists for your organization.',
      });
    }
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// ==========================================
// PRODUCTS
// ==========================================
router.get('/products', requirePermission(['inventory.view', 'stock.view']), async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { name: 'asc' },
    });
    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/products', requirePermission('inventory.manage'), async (req: Request, res: Response) => {
  try {
    let { sku, name, category, description, unit, unitPrice, costPrice, minStockLevel, initialStock } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }

    // Auto-generate SKU if empty
    if (!sku || !sku.trim()) {
      const count = await prisma.product.count({ where: { organizationId: req.organizationId! } });
      sku = `PRD-${String(count + 1).padStart(3, '0')}`;
    } else {
      sku = sku.trim().toUpperCase();
    }

    const existing = await prisma.product.findFirst({
      where: { organizationId: req.organizationId!, sku },
    });
    if (existing) {
      return res.status(409).json({
        message: `A product with SKU "${sku}" already exists ("${existing.name}"). Please use a unique SKU.`,
      });
    }

    const product = await prisma.product.create({
      data: {
        organizationId: req.organizationId!,
        sku,
        name: name.trim(),
        category: category || 'General',
        description,
        unit: unit || 'pcs',
        unitPrice: Number(unitPrice) || 0,
        costPrice: Number(costPrice) || 0,
        minStockLevel: Number(minStockLevel) || 20,
        currentStock: Number(initialStock) || 0,
      },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      details: `Created product ${product.name} [${product.sku}]`,
    });

    return res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'A product with this SKU already exists for your organization.',
      });
    }
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// ==========================================
// WAREHOUSES & SUPPLIERS
// ==========================================
router.get('/warehouses', requirePermission(['warehouse.view', 'inventory.view']), async (req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { name: 'asc' },
    });
    return res.json(warehouses);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/warehouses', requirePermission('warehouse.manage'), async (req: Request, res: Response) => {
  try {
    let { name, code, location, capacity } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Warehouse name is required.' });
    }
    if (!code || !code.trim()) {
      const count = await prisma.warehouse.count({ where: { organizationId: req.organizationId! } });
      code = `WH-${String(count + 1).padStart(2, '0')}`;
    } else {
      code = code.trim().toUpperCase();
    }

    const existing = await prisma.warehouse.findFirst({
      where: { organizationId: req.organizationId!, code },
    });
    if (existing) {
      return res.status(409).json({
        message: `A warehouse with code "${code}" already exists.`,
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: req.organizationId!,
        name: name.trim(),
        code,
        location,
        capacity,
      },
    });
    return res.status(201).json(warehouse);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A warehouse with this code already exists.' });
    }
    return res.status(500).json({ message: err.message });
  }
});

router.get('/suppliers', requirePermission(['supplier.view', 'inventory.view', 'production.view']), async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { name: 'asc' },
    });
    return res.json(suppliers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/suppliers', requirePermission('supplier.manage'), async (req: Request, res: Response) => {
  try {
    let { name, code, contactPerson, email, phone, address, rating } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Supplier name is required.' });
    }
    if (!code || !code.trim()) {
      const count = await prisma.supplier.count({ where: { organizationId: req.organizationId! } });
      code = `SUP-${String(count + 1).padStart(3, '0')}`;
    } else {
      code = code.trim().toUpperCase();
    }

    const existing = await prisma.supplier.findFirst({
      where: { organizationId: req.organizationId!, code },
    });
    if (existing) {
      return res.status(409).json({
        message: `A supplier with code "${code}" already exists.`,
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        organizationId: req.organizationId!,
        name: name.trim(),
        code,
        contactPerson,
        email,
        phone,
        address,
        rating: Number(rating) || 4.5,
      },
    });
    return res.status(201).json(supplier);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A supplier with this code already exists.' });
    }
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// STOCK LEDGER & TRANSACTIONS (Stock In / Stock Out)
// ==========================================
router.get('/ledger', requirePermission(['stock.view', 'inventory.view']), async (req: Request, res: Response) => {
  try {
    const entries = await prisma.stockLedgerEntry.findMany({
      where: { organizationId: req.organizationId! },
      include: { warehouse: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(entries);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/transaction', requirePermission(['stock.manage', 'inventory.manage']), async (req: Request, res: Response) => {
  try {
    const {
      warehouseId,
      itemType,
      itemId,
      transactionType,
      quantity,
      referenceNumber,
      notes,
    } = req.body;

    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Quantity must be positive' });

    let itemName = '';
    let newBalance = 0;

    if (itemType === 'RAW_MATERIAL') {
      const mat = await prisma.rawMaterial.findFirst({
        where: { id: itemId, organizationId: req.organizationId! },
      });
      if (!mat) return res.status(404).json({ message: 'Raw material not found' });
      itemName = mat.name;
      newBalance = transactionType === 'STOCK_IN' ? mat.currentStock + qty : mat.currentStock - qty;
      if (newBalance < 0) return res.status(400).json({ message: 'Insufficient stock' });

      await prisma.rawMaterial.update({
        where: { id: mat.id },
        data: { currentStock: newBalance },
      });
    } else {
      const prod = await prisma.product.findFirst({
        where: { id: itemId, organizationId: req.organizationId! },
      });
      if (!prod) return res.status(404).json({ message: 'Product not found' });
      itemName = prod.name;
      newBalance = transactionType === 'STOCK_IN' ? prod.currentStock + qty : prod.currentStock - qty;
      if (newBalance < 0) return res.status(400).json({ message: 'Insufficient stock' });

      await prisma.product.update({
        where: { id: prod.id },
        data: { currentStock: newBalance },
      });
    }

    const ledgerEntry = await prisma.stockLedgerEntry.create({
      data: {
        organizationId: req.organizationId!,
        warehouseId,
        itemType,
        itemId,
        itemName,
        transactionType,
        quantity: qty,
        balanceAfter: newBalance,
        referenceNumber: referenceNumber || (transactionType === 'STOCK_IN' ? `GRN-${Date.now().toString().slice(-4)}` : `ISS-${Date.now().toString().slice(-4)}`),
        notes,
        createdByName: `${req.user!.firstName} ${req.user!.lastName}`,
      },
      include: { warehouse: true },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: transactionType,
      entity: 'Inventory',
      entityId: itemId,
      details: `${transactionType} of ${qty} units for ${itemName}. New balance: ${newBalance}`,
    });

    return res.status(201).json(ledgerEntry);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// BATCHES
// ==========================================
router.get('/batches', requirePermission(['inventory.view', 'stock.view']), async (req: Request, res: Response) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(batches);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
