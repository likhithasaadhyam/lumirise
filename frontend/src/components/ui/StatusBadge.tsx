import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');

  let variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple' = 'neutral';
  let label = status.replace(/_/g, ' ');

  switch (normalized) {
    case 'COMPLETED':
    case 'PASS':
    case 'ACTIVE':
    case 'APPROVED':
    case 'RELEASED':
    case 'PAID':
    case 'PRESENT':
    case 'DELIVERED':
    case 'WON':
      variant = 'success';
      break;

    case 'IN_PROGRESS':
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'DISPATCHED':
    case 'SENT':
    case 'QUALIFIED':
      variant = 'info';
      break;

    case 'PLANNED':
    case 'READY':
    case 'DRAFT':
    case 'OPEN':
    case 'APPLIED':
    case 'NEW':
      variant = 'purple';
      break;

    case 'MATERIAL_PENDING':
    case 'QUALITY_CHECK':
    case 'PENDING':
    case 'LATE':
    case 'HOLD':
    case 'PARTIALLY_PAID':
    case 'IN_TRANSIT':
    case 'SCREENING':
    case 'INTERVIEW':
      variant = 'warning';
      break;

    case 'FAIL':
    case 'CANCELLED':
    case 'REJECTED':
    case 'OVERDUE':
    case 'ABSENT':
    case 'SUSPENDED':
    case 'TERMINATED':
    case 'LOST':
      variant = 'danger';
      break;

    default:
      variant = 'neutral';
      break;
  }

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}
