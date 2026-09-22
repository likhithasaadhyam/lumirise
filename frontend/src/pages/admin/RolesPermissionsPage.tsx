import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Key,
  ShieldCheck,
  Save,
  CheckSquare,
  Square,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/client';

interface PermissionGroup {
  category: string;
  permissions: { code: string; label: string; description: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Operations & Shopfloor',
    permissions: [
      { code: 'production.view', label: 'View Production Orders', description: 'Access production schedules and work orders' },
      { code: 'production.create', label: 'Create Production Orders', description: 'Schedule new jobs and assign line shifts' },
      { code: 'production.manage', label: 'Manage & Execute Production', description: 'Update status, report output, log scrap' },
      { code: 'quality.view', label: 'View Quality Inspections', description: 'Inspect QA metrics, hold batches, log defects' },
      { code: 'quality.manage', label: 'Sign Off QA Inspections', description: 'Pass or reject critical aerospace lot inspections' },
      { code: 'finished_goods.view', label: 'View Finished Goods', description: 'Audit inspected items ready for dispatch' },
      { code: 'dispatch.view', label: 'View Dispatch Schedule', description: 'Inspect logistics and carrier movements' },
      { code: 'dispatch.manage', label: 'Manage Shipments & Dispatch', description: 'Generate carrier tracking and release packages' },
    ],
  },
  {
    category: 'Inventory & Depots',
    permissions: [
      { code: 'inventory.view', label: 'View Raw Materials & Products', description: 'Inspect catalog stock, reorder levels, valuations' },
      { code: 'inventory.manage', label: 'Manage Inventory Records', description: 'Create and edit material specifications' },
      { code: 'warehouse.view', label: 'View Depots & Warehouses', description: 'Monitor occupancy, bins, and depot locations' },
      { code: 'warehouse.manage', label: 'Manage Depots', description: 'Create and configure physical storage facilities' },
      { code: 'stock.view', label: 'View Stock Ledger', description: 'Audit movements, receipts, and allocations' },
      { code: 'stock.manage', label: 'Post Stock In / Stock Out', description: 'Execute receiving slips and material dispatches' },
      { code: 'supplier.view', label: 'View Suppliers', description: 'Browse approved vendor directories' },
      { code: 'supplier.manage', label: 'Manage Suppliers', description: 'Onboard and update vendor contracts' },
    ],
  },
  {
    category: 'People & HRMS',
    permissions: [
      { code: 'employees.view', label: 'View Employee Directory', description: 'Browse company headcount and assignments' },
      { code: 'employees.manage', label: 'Manage Employees', description: 'Hire, edit, and offboard personnel' },
      { code: 'attendance.view', label: 'View Attendance Records', description: 'Inspect company-wide shifts and clock-ins' },
      { code: 'attendance.manage', label: 'Manage Attendance & Shifts', description: 'Override logs, approve adjustments' },
      { code: 'leave.view', label: 'View Leave Calendar', description: 'Monitor departmental PTO schedules' },
      { code: 'leave.manage', label: 'Approve / Reject Leaves', description: 'Sign off on vacation, sick, and personal PTO' },
      { code: 'recruitment.view', label: 'View Recruitment', description: 'Review applicant pipelines and job openings' },
      { code: 'recruitment.manage', label: 'Manage Hiring Pipeline', description: 'Post openings, advance candidate stages' },
      { code: 'payroll.view', label: 'View Payroll Disbursals', description: 'Access organization-wide payroll records' },
      { code: 'payroll.manage', label: 'Process Payroll Cycles', description: 'Calculate gross, net, taxes, and run payroll' },
    ],
  },
  {
    category: 'Business, CRM & Billing',
    permissions: [
      { code: 'customers.view', label: 'View Customers', description: 'Inspect client profiles and commercial terms' },
      { code: 'customers.manage', label: 'Manage Customers', description: 'Create and update customer contracts' },
      { code: 'leads.view', label: 'View Leads & Pipeline', description: 'Access incoming opportunities and funnel' },
      { code: 'leads.manage', label: 'Manage Leads', description: 'Convert leads, advance stages, set values' },
      { code: 'sales_orders.view', label: 'View Sales Orders', description: 'Browse customer purchase contracts' },
      { code: 'sales_orders.manage', label: 'Create & Manage Orders', description: 'Draft, confirm, and fulfill sales orders' },
      { code: 'invoices.view', label: 'View Invoices', description: 'Access billing ledger and accounts receivable' },
      { code: 'invoices.manage', label: 'Generate & Issue Invoices', description: 'Draft commercial invoices and billing stubs' },
      { code: 'payments.manage', label: 'Record Payments', description: 'Post customer wire receipts and settle invoices' },
    ],
  },
  {
    category: 'Reports & Governance',
    permissions: [
      { code: 'dashboard.view', label: 'Access Executive Dashboard', description: 'View executive KPI telemetry widgets' },
      { code: 'reports.view', label: 'View Operational Reports', description: 'Access reporting overview' },
      { code: 'reports.production', label: 'Production Yield Reports', description: 'Download output and scrap analytics' },
      { code: 'reports.inventory', label: 'Inventory Valuation Reports', description: 'Export asset valuation and dead stock metrics' },
      { code: 'reports.hr', label: 'Workforce Reports', description: 'Export headcount and overtime telemetry' },
      { code: 'reports.financial', label: 'Financial & Billing Reports', description: 'Export revenue, collections, and AR metrics' },
      { code: 'audit.view', label: 'View Audit Logs', description: 'Track all security-critical system mutations' },
      { code: 'roles.manage', label: 'Manage Roles & Permissions', description: 'Administer access control matrix' },
      { code: 'settings.view', label: 'Manage Company Settings', description: 'Update organization profile and parameters' },
    ],
  },
  {
    category: 'Employee Self-Service',
    permissions: [
      { code: 'my_profile.view', label: 'My Profile', description: 'View personal employment records and shift info' },
      { code: 'my_tasks.view', label: 'My Assigned Tasks', description: 'Execute personal work orders and job station tasks' },
      { code: 'my_orders.view', label: 'My Work Orders', description: 'Update progress on assigned production items' },
      { code: 'my_attendance.view', label: 'My Clock & Attendance', description: 'Log clock in/out and view own timesheet' },
      { code: 'my_leave.view', label: 'My Leave Requests', description: 'Submit and track personal PTO applications' },
      { code: 'my_payslips.view', label: 'My Pay Statements', description: 'Download personal monthly compensation slips' },
    ],
  },
];

interface RoleData {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: { code: string }[];
  _count?: { users: number };
}

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [activePermCodes, setActivePermCodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const data: any = await api.getRoles();
      const rolesList: RoleData[] = Array.isArray(data) ? data : (data?.data || []);
      setRoles(rolesList);
      if (rolesList.length > 0) {
        const initialRole = rolesList.find((r: RoleData) => r.name === 'PRODUCTION_MANAGER') || rolesList[0];
        setSelectedRoleId(initialRole.id);
        setActivePermCodes(new Set((initialRole.permissions || []).map((p: any) => p.code)));
      }
    } catch (err) {
      console.error('Failed to load roles', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = (role: RoleData) => {
    setSelectedRoleId(role.id);
    setActivePermCodes(new Set(role.permissions.map((p: any) => p.code)));
    setSaveSuccess(false);
  };

  const togglePermission = (code: string) => {
    setActivePermCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
    setSaveSuccess(false);
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupCodes = group.permissions.map((p) => p.code);
    const allSelected = groupCodes.every((c) => activePermCodes.has(c));

    setActivePermCodes((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupCodes.forEach((c) => next.delete(c));
      } else {
        groupCodes.forEach((c) => next.add(c));
      }
      return next;
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const permsArray = Array.from(activePermCodes);
      await api.updateRolePermissions(selectedRoleId, permsArray);

      // Update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRoleId
            ? { ...r, permissions: permsArray.map((code) => ({ code })) }
            : r
        )
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise Roles & Permission Matrix
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
              RBAC Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure granular access control permissions across navigation, routes, widgets, and backend APIs
          </p>
        </div>

        {selectedRole && (
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Permissions Updated Live!
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Permissions ({activePermCodes.size})
            </Button>
          </div>
        )}
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {roles.map((r) => {
          const isSelected = r.id === selectedRoleId;
          return (
            <button
              key={r.id}
              onClick={() => handleSelectRole(r)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-brand-500/50'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-brand-300' : 'text-slate-400'}`}>
                  Role
                </span>
                <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {r.permissions.length} perms
                </span>
              </div>
              <p className="text-xs font-bold truncate tracking-tight">
                {r.name.replace(/_/g, ' ')}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Role Meta */}
      {selectedRole && (
        <Card className="p-4 bg-slate-50/75 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-2xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Editing: {selectedRole.name.replace(/_/g, ' ')}
                </h2>
                {selectedRole.isSystem && (
                  <Badge variant="neutral" className="text-[10px] uppercase">
                    System Core Role
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedRole.description || 'Enterprise role permission set'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-700">
              {activePermCodes.size} Active Clearances
            </span>
          </div>
        </Card>
      )}

      {/* Permission Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PERMISSION_GROUPS.map((group) => {
          const groupCodes = group.permissions.map((p) => p.code);
          const allSelected = groupCodes.every((c) => activePermCodes.has(c));
          const someSelected = groupCodes.some((c) => activePermCodes.has(c));

          return (
            <Card key={group.category} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {group.category}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {group.permissions.filter((p) => activePermCodes.has(p.code)).length} of{' '}
                      {group.permissions.length} granted
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleGroup(group)}
                    leftIcon={allSelected ? <CheckSquare className="w-3.5 h-3.5 text-brand-600" /> : <Square className="w-3.5 h-3.5" />}
                  >
                    {allSelected ? 'Revoke All' : 'Grant All'}
                  </Button>
                </div>

                <div className="space-y-3">
                  {group.permissions.map((perm) => {
                    const isChecked = activePermCodes.has(perm.code);
                    return (
                      <div
                        key={perm.code}
                        onClick={() => togglePermission(perm.code)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-brand-50/50 border-brand-200'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${isChecked ? 'text-brand-900' : 'text-slate-800'}`}>
                              {perm.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                              {perm.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
