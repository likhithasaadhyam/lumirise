import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedPage } from '../../pages/error/AccessDeniedPage';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission?: string | string[];
  matchMode?: 'any' | 'all';
  moduleName?: string;
}

export function PermissionRoute({
  children,
  requiredPermission,
  matchMode = 'any',
  moduleName,
}: PermissionRouteProps) {
  const { user } = useAuth();

  if (!user) return null;

  // Super Admin has unrestricted access to everything
  if (user.roleName === 'ADMIN') {
    return <>{children}</>;
  }

  if (!requiredPermission) {
    return <>{children}</>;
  }

  const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  const userPerms = new Set(user.permissions || []);

  const hasAccess =
    matchMode === 'all'
      ? perms.every((p) => userPerms.has(p))
      : perms.some((p) => userPerms.has(p));

  if (!hasAccess) {
    return (
      <AccessDeniedPage
        requiredPermission={perms.join(', ')}
        moduleName={moduleName}
      />
    );
  }

  return <>{children}</>;
}
