import React from 'react';

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  iconName: string; // Lucide icon identifier
  requiredPermissions: string[];
  badge?: string | number;
  matchMode?: 'any' | 'all'; // default: 'any'
  subItems?: NavItemConfig[];
}

export interface NavSectionConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export const NAVIGATION_SECTIONS: NavSectionConfig[] = [
  {
    id: 'workspace',
    title: 'WORKSPACE',
    items: [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        href: '/',
        iconName: 'LayoutDashboard',
        requiredPermissions: ['dashboard.view'],
      },
    ],
  },
  {
    id: 'employee_portal',
    title: 'EMPLOYEE SELF-SERVICE',
    items: [
      {
        id: 'nav-my-tasks',
        label: 'My Tasks & Work',
        href: '/portal/tasks',
        iconName: 'CheckSquare',
        requiredPermissions: ['my_tasks.view', 'my_orders.view'],
      },
      {
        id: 'nav-my-attendance',
        label: 'My Attendance & Shifts',
        href: '/people/attendance',
        iconName: 'Clock',
        requiredPermissions: ['my_attendance.view'],
      },
      {
        id: 'nav-my-leaves',
        label: 'My Leave Requests',
        href: '/people/leave',
        iconName: 'Calendar',
        requiredPermissions: ['my_leave.view'],
      },
      {
        id: 'nav-my-payslips',
        label: 'My Payslips',
        href: '/portal/payslips',
        iconName: 'FileSpreadsheet',
        requiredPermissions: ['my_payslips.view'],
      },
      {
        id: 'nav-my-profile',
        label: 'My Profile & Org',
        href: '/portal/profile',
        iconName: 'UserCheck',
        requiredPermissions: ['my_profile.view'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'OPERATIONS',
    items: [
      {
        id: 'nav-production',
        label: 'Production Orders',
        href: '/operations/production',
        iconName: 'Cog',
        requiredPermissions: ['production.view'],
      },
      {
        id: 'nav-quality',
        label: 'Quality Control',
        href: '/operations/quality',
        iconName: 'ShieldCheck',
        requiredPermissions: ['quality.view'],
      },
      {
        id: 'nav-finished-goods',
        label: 'Finished Goods',
        href: '/operations/finished-goods',
        iconName: 'Package',
        requiredPermissions: ['finished_goods.view'],
      },
      {
        id: 'nav-dispatch',
        label: 'Dispatch & Shipping',
        href: '/operations/dispatch',
        iconName: 'Send',
        requiredPermissions: ['dispatch.view'],
      },
    ],
  },
  {
    id: 'inventory',
    title: 'INVENTORY & DEPOTS',
    items: [
      {
        id: 'nav-raw-materials',
        label: 'Raw Materials',
        href: '/inventory/raw-materials',
        iconName: 'Layers',
        requiredPermissions: ['inventory.view'],
      },
      {
        id: 'nav-products',
        label: 'Products Catalog',
        href: '/inventory/products',
        iconName: 'Package',
        requiredPermissions: ['inventory.view'],
      },
      {
        id: 'nav-warehouses',
        label: 'Depots & Warehouses',
        href: '/inventory/warehouses',
        iconName: 'Warehouse',
        requiredPermissions: ['warehouse.view'],
      },
      {
        id: 'nav-stock-ledger',
        label: 'Stock Ledger & Moves',
        href: '/inventory/ledger',
        iconName: 'FileText',
        requiredPermissions: ['stock.view'],
      },
      {
        id: 'nav-batches',
        label: 'Batches & Lots',
        href: '/inventory/batches',
        iconName: 'Boxes',
        requiredPermissions: ['stock.view'],
      },
      {
        id: 'nav-suppliers',
        label: 'Suppliers & Vendors',
        href: '/inventory/suppliers',
        iconName: 'Building',
        requiredPermissions: ['supplier.view'],
      },
    ],
  },
  {
    id: 'people',
    title: 'PEOPLE & HRMS',
    items: [
      {
        id: 'nav-employees',
        label: 'Employee Directory',
        href: '/people/employees',
        iconName: 'Users',
        requiredPermissions: ['employees.view'],
      },
      {
        id: 'nav-attendance-mgmt',
        label: 'Attendance & Shifts',
        href: '/people/attendance',
        iconName: 'Clock',
        requiredPermissions: ['attendance.view'],
      },
      {
        id: 'nav-leave-mgmt',
        label: 'Leave Approvals',
        href: '/people/leave',
        iconName: 'Calendar',
        requiredPermissions: ['leave.view'],
      },
      {
        id: 'nav-recruitment',
        label: 'Talent & Hiring',
        href: '/people/recruitment',
        iconName: 'Briefcase',
        requiredPermissions: ['recruitment.view'],
      },
      {
        id: 'nav-payroll',
        label: 'Payroll & Compensation',
        href: '/people/payroll',
        iconName: 'DollarSign',
        requiredPermissions: ['payroll.view'],
      },
    ],
  },
  {
    id: 'business',
    title: 'BUSINESS & SALES',
    items: [
      {
        id: 'nav-leads',
        label: 'Leads & Pipeline',
        href: '/business/leads',
        iconName: 'Target',
        requiredPermissions: ['leads.view'],
      },
      {
        id: 'nav-customers',
        label: 'Customer Accounts',
        href: '/business/customers',
        iconName: 'Building',
        requiredPermissions: ['customers.view'],
      },
      {
        id: 'nav-orders',
        label: 'Sales Orders',
        href: '/business/orders',
        iconName: 'ShoppingCart',
        requiredPermissions: ['sales_orders.view'],
      },
      {
        id: 'nav-invoices',
        label: 'Invoices & Billing',
        href: '/business/invoices',
        iconName: 'FileText',
        requiredPermissions: ['invoices.view'],
      },
    ],
  },
  {
    id: 'governance',
    title: 'GOVERNANCE & SYSTEM',
    items: [
      {
        id: 'nav-reports',
        label: 'Operational Reports',
        href: '/reports',
        iconName: 'BarChart3',
        requiredPermissions: ['reports.view'],
      },
      {
        id: 'nav-audit',
        label: 'System Audit Logs',
        href: '/administration/audit',
        iconName: 'ShieldAlert',
        requiredPermissions: ['audit.view'],
      },
      {
        id: 'nav-roles',
        label: 'Roles & Permissions',
        href: '/administration/roles',
        iconName: 'Key',
        requiredPermissions: ['roles.manage'],
      },
      {
        id: 'nav-settings',
        label: 'Company Settings',
        href: '/administration/settings',
        iconName: 'Settings',
        requiredPermissions: ['settings.view'],
      },
    ],
  },
];

/**
 * Filter navigation configuration based on user's granted permissions.
 * Prunes empty sections automatically.
 */
export function getVisibleNavigation(userPermissions: string[] = [], userRole?: string): NavSectionConfig[] {
  const permSet = new Set(userPermissions);
  const isAdmin = userRole === 'ADMIN' || permSet.has('*') || permSet.has('all');

  return NAVIGATION_SECTIONS.map((section) => {
    // For non-admins, if they have full management permissions (like HR_MANAGER),
    // they don't need duplicate self-service links taking up space unless they want them.
    // However, keeping employee_portal visible only if they have my_tasks or my_payslips or lack manage permissions
    const filteredItems = section.items.filter((item) => {
      if (isAdmin) {
        // Hide self-service redundant items for super admin if desired, or keep them all
        if (section.id === 'employee_portal') return false;
        return true;
      }

      if (item.requiredPermissions.length === 0) return true;

      const matchMode = item.matchMode || 'any';
      if (matchMode === 'all') {
        return item.requiredPermissions.every((p) => permSet.has(p));
      } else {
        return item.requiredPermissions.some((p) => permSet.has(p));
      }
    });

    return {
      ...section,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
}
