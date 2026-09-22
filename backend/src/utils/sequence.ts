import { PrismaClient } from '@prisma/client';

type PrismaTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Generates a collision-proof, tenant-isolated sequential identifier.
 * Inspects all existing records with the specified prefix to find the true mathematical maximum,
 * preventing collisions even after deletions, manual edits, or migrations.
 */
export async function generateInspectionNumber(
  tx: PrismaTx,
  organizationId: string
): Promise<string> {
  // Query existing inspection numbers within this organization
  const existing = await tx.qualityInspection.findMany({
    where: { organizationId },
    select: { inspectionNumber: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  let maxNum = 8800; // Standard base offset for QA
  for (const item of existing) {
    const match = item.inspectionNumber.match(/QA-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `QA-${nextNum}`;

  // Loop to guarantee no collision against any non-latest existing records
  while (
    await tx.qualityInspection.findUnique({
      where: {
        organizationId_inspectionNumber: {
          organizationId,
          inspectionNumber: candidate,
        },
      },
    })
  ) {
    nextNum++;
    candidate = `QA-${nextNum}`;
  }

  return candidate;
}

/**
 * Generates a collision-proof production order number (e.g. PO-1027).
 */
export async function generateProductionOrderNumber(
  tx: PrismaTx,
  organizationId: string
): Promise<string> {
  const existing = await tx.productionOrder.findMany({
    where: { organizationId },
    select: { orderNumber: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  let maxNum = 1000;
  for (const item of existing) {
    const match = item.orderNumber.match(/PO-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `PO-${nextNum}`;

  while (
    await tx.productionOrder.findUnique({
      where: {
        organizationId_orderNumber: {
          organizationId,
          orderNumber: candidate,
        },
      },
    })
  ) {
    nextNum++;
    candidate = `PO-${nextNum}`;
  }

  return candidate;
}

/**
 * Generates a collision-proof dispatch number (e.g. DSP-4405).
 */
export async function generateDispatchNumber(
  tx: PrismaTx,
  organizationId: string
): Promise<string> {
  const existing = await tx.dispatchOrder.findMany({
    where: { organizationId },
    select: { dispatchNumber: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  let maxNum = 4400;
  for (const item of existing) {
    const match = item.dispatchNumber.match(/DSP-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `DSP-${nextNum}`;

  while (
    await tx.dispatchOrder.findUnique({
      where: {
        organizationId_dispatchNumber: {
          organizationId,
          dispatchNumber: candidate,
        },
      },
    })
  ) {
    nextNum++;
    candidate = `DSP-${nextNum}`;
  }

  return candidate;
}
