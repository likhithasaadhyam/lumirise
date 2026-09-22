import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedPageProps {
  requiredPermission?: string;
  moduleName?: string;
}

// Human-friendly mapping of permission codes to business capability labels
const PERMISSION_CAPABILITY_LABELS: Record<string, string> = {
  'stock.view': 'Inventory / Stock View',
  'stock.manage': 'Inventory / Stock Operations',
  'inventory.view': 'Inventory / Raw Materials & Products View',
  'inventory.manage': 'Inventory / Catalog Management',
  'warehouse.view': 'Inventory / Depot & Warehouse View',
  'warehouse.manage': 'Inventory / Warehouse Management',
  'supplier.view': 'Inventory / Suppliers & Vendors View',
  'supplier.manage': 'Inventory / Suppliers Management',
  'production.view': 'Operations / Production Planning & Orders',
  'production.manage': 'Operations / Production Order Management',
  'production.create': 'Operations / Production Order Creation',
  'quality.view': 'Operations / Quality Control Inspections',
  'quality.manage': 'Operations / Quality Control Approvals',
  'finished_goods.view': 'Operations / Finished Goods Inventory',
  'dispatch.view': 'Operations / Dispatch & Shipping View',
  'dispatch.manage': 'Operations / Dispatch Fulfillment',
  'employees.view': 'People / Employee Directory View',
  'employees.manage': 'People / Employee Administration',
  'attendance.view': 'People / Company Attendance View',
  'attendance.manage': 'People / Attendance Management',
  'leave.view': 'People / Leave Requests & Approvals',
  'leave.manage': 'People / Leave Approval Administration',
  'recruitment.view': 'People / Talent Acquisition & Hiring',
  'recruitment.manage': 'People / Candidate Pipeline Management',
  'payroll.view': 'People / Company Payroll & Compensation',
  'payroll.manage': 'People / Payroll Calculation & Disbursement',
  'leads.view': 'Business / Leads & Sales Pipeline',
  'leads.manage': 'Business / Lead Management',
  'customers.view': 'Business / Customer Accounts View',
  'customers.manage': 'Business / Customer Management',
  'sales_orders.view': 'Business / Sales Orders View',
  'sales_orders.manage': 'Business / Sales Order Processing',
  'invoices.view': 'Business / Invoices & Billing View',
  'invoices.manage': 'Business / Invoice Generation',
  'payments.view': 'Business / Customer Payments View',
  'payments.manage': 'Business / Payment Reconciliation',
  'reports.view': 'Governance / Operational Reports',
  'reports.financial': 'Governance / Financial Reports',
  'reports.production': 'Governance / Production Reports',
  'reports.inventory': 'Governance / Inventory Analytics',
  'reports.hr': 'Governance / Human Resources Reports',
  'audit.view': 'Governance / System Audit Logs',
  'roles.manage': 'Governance / Roles & Permissions Matrix',
  'settings.view': 'Governance / Company Settings',
  'my_tasks.view': 'Self-Service / My Assigned Tasks',
  'my_orders.view': 'Self-Service / My Production Orders',
  'my_attendance.view': 'Self-Service / Personal Attendance',
  'my_leave.view': 'Self-Service / Personal Leave Requests',
  'my_payslips.view': 'Self-Service / Personal Payslips',
  'my_profile.view': 'Self-Service / Personal Profile',
};

function formatRequiredAccess(rawPerms?: string): string {
  if (!rawPerms) return 'Authorized Security Clearance';

  const parts = rawPerms.split(',').map((p) => p.trim());
  const mapped = parts.map((p) => PERMISSION_CAPABILITY_LABELS[p] || p.replace(/\./g, ' / '));
  return mapped.join(' OR ');
}

export function AccessDeniedPage({ requiredPermission, moduleName }: AccessDeniedPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const accessLabel = formatRequiredAccess(requiredPermission);
  const targetModule = moduleName || 'this module';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-100 p-8 text-center">
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto mb-5 text-amber-600 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>HTTP 403 Forbidden</span>
        </div>

        {/* Clean Header */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Access Restricted
        </h1>

        {/* Explanatory message as required */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          You don't have permission to access <span className="font-semibold text-slate-900">{targetModule}</span>.
        </p>

        {/* Required Access Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left mb-6">
          <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wider mb-1">
            Required access:
          </span>
          <span className="text-brand-700 font-semibold text-sm">
            {accessLabel}
          </span>
          {user?.roleName && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Current Role:</span>
              <span className="font-medium text-slate-700 font-mono">{user.roleName}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all hover:border-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to="/"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to My Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
