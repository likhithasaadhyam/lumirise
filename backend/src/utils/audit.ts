import { prisma } from '../db.js';

interface LogAuditParams {
  organizationId: string;
  userId?: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        oldValue: params.oldValue,
        newValue: params.newValue,
        ipAddress: params.ipAddress || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
