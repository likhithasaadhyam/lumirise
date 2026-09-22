import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Plus,
  UserCheck,
  Calendar,
  DollarSign,
  Clock,
  Award,
  AlertCircle,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  Mail,
  UserX,
} from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'new');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals for Employee detail actions
  const [isEnableLoginModalOpen, setIsEnableLoginModalOpen] = useState(false);
  const [enableLoginForm, setEnableLoginForm] = useState({
    loginEmail: '',
    roleId: '',
    password: 'Password123!',
  });
  const [enableLoginError, setEnableLoginError] = useState<string | null>(null);

  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('Password123!');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: '',
    shiftId: '',
    workLocation: 'Plant 1 - Cleveland',
    basicSalary: 5500,
    allowances: 800,
    deductions: 300,
    // Account access
    enableLogin: true,
    loginEmail: '',
    roleId: '',
    password: 'Password123!',
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empList, deptList, shiftList, roleList] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
        api.getShifts(),
        api.getRoles().catch(() => []),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
      setShifts(shiftList);
      setRoles(roleList);

      if (deptList.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptList[0].id }));
      }
      if (shiftList.length > 0 && !formData.shiftId) {
        setFormData((prev) => ({ ...prev, shiftId: shiftList[0].id }));
      }
      if (roleList.length > 0 && !formData.roleId) {
        const empRole = roleList.find((r: any) => r.name === 'EMPLOYEE') || roleList[0];
        setFormData((prev) => ({ ...prev, roleId: empRole.id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useDataSync(['EMPLOYEE'], fetchEmployees);

  const handleRowClick = async (emp: any) => {
    try {
      const fullDetail = await api.getEmployee(emp.id);
      setSelectedEmployee(fullDetail);
      setActiveTab('overview');
      setActionSuccessMessage(null);
    } catch {
      setSelectedEmployee(emp);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const emailTrimmed = formData.email.trim().toLowerCase();
    if (!emailTrimmed) {
      setCreateError('Please enter a valid work email address.');
      return;
    }

    // Client-side instant pre-check against loaded workforce
    const emailConflict = employees.find(
      (emp) => emp.email?.toLowerCase() === emailTrimmed
    );
    if (emailConflict) {
      setCreateError(
        `Email "${emailTrimmed}" is already registered to ${emailConflict.firstName} ${emailConflict.lastName} (${emailConflict.employeeCode}). Please enter a unique email address.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createEmployee({
        ...formData,
        email: emailTrimmed,
        loginEmail: formData.loginEmail.trim() || emailTrimmed,
      });
      setIsCreateOpen(false);
      setSearchParams({});
      setFormData(initialFormState);
      fetchEmployees();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to add employee record. Please verify your entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actions for existing employee drawer
  const openEnableLoginModal = () => {
    if (!selectedEmployee) return;
    const defaultRole = roles.find((r) => r.name === 'EMPLOYEE') || roles[0];
    setEnableLoginForm({
      loginEmail: selectedEmployee.email || '',
      roleId: selectedEmployee.roleId || defaultRole?.id || '',
      password: 'Password123!',
    });
    setEnableLoginError(null);
    setIsEnableLoginModalOpen(true);
  };

  const handleEnableLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setIsActionLoading(true);
      setEnableLoginError(null);
      await api.enableEmployeeLogin(selectedEmployee.id, enableLoginForm);
      setIsEnableLoginModalOpen(false);
      setActionSuccessMessage('Lumirise user account successfully enabled and linked!');
      // Refresh detail and list
      const refreshed = await api.getEmployee(selectedEmployee.id);
      setSelectedEmployee(refreshed);
      fetchEmployees();
    } catch (err: any) {
      setEnableLoginError(err.message || 'Failed to enable login account.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisableLogin = async () => {
    if (!selectedEmployee) return;
    const confirmed = window.confirm(
      `Are you sure you want to disable Lumirise system login for ${selectedEmployee.firstName} ${selectedEmployee.lastName}? They will no longer be able to log in.`
    );
    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      await api.disableEmployeeLogin(selectedEmployee.id);
      setActionSuccessMessage('System login has been disabled for this employee.');
      const refreshed = await api.getEmployee(selectedEmployee.id);
      setSelectedEmployee(refreshed);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to disable employee login.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      setResetPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsActionLoading(true);
      setResetPasswordError(null);
      await api.resetEmployeePassword(selectedEmployee.id, resetPasswordValue);
      setIsResetPasswordModalOpen(false);
      setActionSuccessMessage('Employee password successfully updated.');
      const refreshed = await api.getEmployee(selectedEmployee.id);
      setSelectedEmployee(refreshed);
      fetchEmployees();
    } catch (err: any) {
      setResetPasswordError(err.message || 'Failed to reset password.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;

  const columns: Column<any>[] = [
    {
      key: 'employeeCode',
      header: 'EMP ID',
      sortable: true,
      accessor: (e) => <span className="font-mono font-bold text-slate-900">{e.employeeCode}</span>,
    },
    {
      key: 'name',
      header: 'Full Name',
      accessor: (e) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
            {e.firstName?.[0] || 'E'}
            {e.lastName?.[0] || ''}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{e.firstName} {e.lastName}</p>
            <p className="text-[10px] text-slate-400">{e.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: (e) => <span className="text-slate-700 font-medium">{e.department?.name || '—'}</span>,
    },
    {
      key: 'designation',
      header: 'Designation / Role',
      accessor: (e) => (
        <div>
          <p className="text-slate-800 font-medium">{e.designation}</p>
          <p className="text-[10px] text-slate-400">{e.role?.name?.replace(/_/g, ' ') || 'Staff'}</p>
        </div>
      ),
    },
    {
      key: 'accountAccess',
      header: 'Account Access',
      accessor: (e) => {
        if (!e.user) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              NO LOGIN
            </span>
          );
        }
        if (e.user.status === 'ACTIVE') {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                LOGIN ACTIVE
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                {e.user.email}
              </span>
            </div>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              LOGIN DISABLED
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
              {e.user.email}
            </span>
          </div>
        );
      },
    },
    {
      key: 'shift',
      header: 'Assigned Shift',
      accessor: (e) => <span className="text-slate-600">{e.shift?.name || 'General'}</span>,
    },
    {
      key: 'status',
      header: 'HR Status',
      accessor: (e) => <StatusBadge status={e.status} />,
    },
  ];

  const detailTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance', badge: selectedEmployee?.attendanceRecords?.length },
    { id: 'leave', label: 'Leaves', badge: selectedEmployee?.leaveRequests?.length },
    { id: 'payroll', label: 'Payroll & Salary' },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'People' }, { label: 'Employees' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Engineering technicians, CNC machinists, quality metrologists, and executive operations staff.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateError(null);
              setFormData(initialFormState);
              setIsCreateOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Workforce"
          value={employees.length}
          subtitle="Registered company employees"
          icon={<Users className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Active HR Status"
          value={activeCount}
          subtitle="Currently active & on-duty"
          icon={<UserCheck className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="System Login Enabled"
          value={employees.filter((e) => e.user && e.user.status === 'ACTIVE').length}
          subtitle="Employees with active portal access"
          icon={<Shield className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={employees}
        columns={columns}
        searchPlaceholder="Search by name, ID (EMP-1025), designation, or email..."
        searchKey={(e) => `${e.employeeCode} ${e.firstName} ${e.lastName} ${e.designation} ${e.email} ${e.user?.email || ''}`}
        onRowClick={handleRowClick}
        isLoading={loading}
      />

      {/* Add Employee Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSearchParams({});
        }}
        title="Onboard New Workforce Member"
        description="Register employee HR profile, department allocation, and configure system portal credentials"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Unable to Save Employee</p>
                <p className="mt-0.5 text-rose-600">{createError}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              Personal & Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                placeholder="e.g. Daniel"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                required
                placeholder="e.g. Martinez"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Work Email"
                type="email"
                required
                placeholder="d.martinez@company.com"
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    email: val,
                    loginEmail: prev.loginEmail === prev.email || !prev.loginEmail ? val : prev.loginEmail,
                  }));
                }}
              />
              <Input
                label="Contact Phone"
                placeholder="+1 (555) 019-2834"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              Employment & Placement
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Department"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </Select>

              <Input
                label="Designation / Title"
                required
                placeholder="e.g. Tooling & Fixture Engineer"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Assigned Shift"
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </Select>

              <Input
                label="Work Location"
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
              />
            </div>
          </div>

          {/* System Login & Credentials Configuration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold text-slate-900">Lumirise System Access</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.enableLogin}
                  onChange={(e) => setFormData({ ...formData, enableLogin: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                <span className="ml-2 text-xs font-medium text-slate-700">
                  {formData.enableLogin ? 'Login Enabled' : 'No Login'}
                </span>
              </label>
            </div>

            {formData.enableLogin ? (
              <div className="space-y-3 pt-2 border-t border-slate-200/60">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Login Email"
                    type="email"
                    required={formData.enableLogin}
                    placeholder="user@lumirise.com"
                    value={formData.loginEmail || formData.email}
                    onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                    helperText="Credentials will be linked to this email address"
                  />
                  <Select
                    label="System Role"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name.replace(/_/g, ' ')} ({r.description || 'System Role'})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Input
                    label="Initial Password"
                    type="password"
                    required={formData.enableLogin}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    helperText="Stored securely with bcrypt encryption (min. 6 characters)"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                This employee will only have an HR/profile record without system login credentials. You can enable login anytime.
              </p>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              Compensation Structure
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Basic Salary ($)"
                type="number"
                required
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              />
              <Input
                label="Allowances ($)"
                type="number"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              />
              <Input
                label="Deductions ($)"
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setSearchParams({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Employee Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail Drawer with Tabs */}
      <Drawer
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={`${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
        subtitle={`${selectedEmployee?.employeeCode} • ${selectedEmployee?.designation}`}
        width="2xl"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {actionSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                {/* Account Access & System Credentials Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-600" />
                      <h4 className="font-bold text-slate-900 text-xs">Lumirise Authentication & User Account</h4>
                    </div>
                    {selectedEmployee.user ? (
                      selectedEmployee.user.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          LOGIN ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                          LOGIN DISABLED
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                        NO ACCOUNT LINKED
                      </span>
                    )}
                  </div>

                  {selectedEmployee.user ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-400 font-medium">Login Email</p>
                          <p className="font-semibold text-slate-900 font-mono text-xs mt-0.5">
                            {selectedEmployee.user.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Assigned System Role</p>
                          <p className="font-semibold text-slate-900 text-xs mt-0.5">
                            {selectedEmployee.user.role?.name?.replace(/_/g, ' ') ||
                              selectedEmployee.role?.name?.replace(/_/g, ' ') ||
                              'EMPLOYEE'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Last Login</p>
                          <p className="font-medium text-slate-700 text-xs mt-0.5">
                            {selectedEmployee.user.lastLoginAt
                              ? new Date(selectedEmployee.user.lastLoginAt).toLocaleString()
                              : 'Never logged in'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Account Created</p>
                          <p className="font-medium text-slate-700 text-xs mt-0.5">
                            {new Date(selectedEmployee.user.createdAt || selectedEmployee.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                        {selectedEmployee.user.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisableLogin}
                            isLoading={isActionLoading}
                            className="text-rose-600 hover:bg-rose-50 border-rose-200"
                            leftIcon={<UserX className="w-3.5 h-3.5" />}
                          >
                            Disable Login Access
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={openEnableLoginModal}
                            isLoading={isActionLoading}
                            leftIcon={<Unlock className="w-3.5 h-3.5" />}
                          >
                            Enable Login Access
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetPasswordError(null);
                            setResetPasswordValue('Password123!');
                            setIsResetPasswordModalOpen(true);
                          }}
                          leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <p className="text-slate-600 text-xs">
                        This workforce member does not currently have a Lumirise user account. They are registered as an HR profile only and cannot sign into the system.
                      </p>
                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={openEnableLoginModal}
                          leftIcon={<Shield className="w-3.5 h-3.5" />}
                        >
                          Enable Lumirise Login
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="text-slate-400 font-medium">Department</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {selectedEmployee.department?.name || '—'}
                    </p>
                    <p className="text-slate-500">{selectedEmployee.department?.code || ''}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="text-slate-400 font-medium">Shift Schedule</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {selectedEmployee.shift?.name || 'General Shift'}
                    </p>
                    <p className="text-slate-500 font-mono">
                      {selectedEmployee.shift?.startTime} - {selectedEmployee.shift?.endTime}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    Contact & Location
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400">Work Email:</span>{' '}
                      <span className="font-medium">{selectedEmployee.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>{' '}
                      <span className="font-medium">{selectedEmployee.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Facility:</span>{' '}
                      <span className="font-medium">{selectedEmployee.workLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Joining Date:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedEmployee.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  Recent Attendance Logs
                </h4>
                {selectedEmployee.attendanceRecords?.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No attendance records logged</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedEmployee.attendanceRecords?.map((att: any) => (
                      <div key={att.id} className="p-3 flex items-center justify-between bg-white">
                        <div>
                          <p className="font-semibold text-slate-900">{att.date}</p>
                          <p className="text-[10px] text-slate-400">
                            Check-in: {att.checkIn || '—'} | Check-out: {att.checkOut || '—'}
                          </p>
                        </div>
                        <StatusBadge status={att.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: LEAVE */}
            {activeTab === 'leave' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  Leave History & Requests
                </h4>
                {selectedEmployee.leaveRequests?.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No leave requests on record</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedEmployee.leaveRequests?.map((lv: any) => (
                      <div key={lv.id} className="p-3 bg-white space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {lv.leaveType?.name} ({lv.days} days)
                          </span>
                          <StatusBadge status={lv.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {lv.startDate} to {lv.endDate}
                        </p>
                        <p className="text-slate-600 italic">"{lv.reason}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PAYROLL */}
            {activeTab === 'payroll' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    Salary Structure
                  </h4>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <p className="text-slate-400">Basic Salary</p>
                      <p className="font-bold text-slate-900 text-sm">
                        ${selectedEmployee.basicSalary?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Allowances</p>
                      <p className="font-bold text-emerald-600 text-sm">
                        +${selectedEmployee.allowances?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Deductions</p>
                      <p className="font-bold text-rose-600 text-sm">
                        -${selectedEmployee.deductions?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedEmployee.payrollSlips?.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] mb-2">
                      Recent Pay Slips
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {selectedEmployee.payrollSlips.map((slip: any) => (
                        <div key={slip.id} className="p-3 bg-white flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {slip.payrollPeriod?.name || 'Pay Period'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Net Pay: ${slip.netSalary?.toLocaleString()}
                            </p>
                          </div>
                          <StatusBadge status={slip.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PERFORMANCE */}
            {activeTab === 'performance' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900">Operational Excellence Rating</h4>
                  </div>
                  <p className="text-emerald-800 text-base font-bold">4.9 / 5.0</p>
                  <p className="text-[11px] text-emerald-700">
                    High precision milling throughput, zero safety citations, 98.7% first-pass yield.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Enable Login Modal */}
      <Modal
        isOpen={isEnableLoginModalOpen}
        onClose={() => setIsEnableLoginModalOpen(false)}
        title="Enable Portal Login Access"
        description={`Create or link authentication user credentials for ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
      >
        <form onSubmit={handleEnableLoginSubmit} className="space-y-4">
          {enableLoginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Failed to Enable Login</p>
                <p className="mt-0.5 text-rose-600">{enableLoginError}</p>
              </div>
            </div>
          )}

          <Input
            label="Login Email"
            type="email"
            required
            value={enableLoginForm.loginEmail}
            onChange={(e) => setEnableLoginForm({ ...enableLoginForm, loginEmail: e.target.value })}
            helperText="Employee will use this email address to sign into Lumirise"
          />

          <Select
            label="System Role"
            value={enableLoginForm.roleId}
            onChange={(e) => setEnableLoginForm({ ...enableLoginForm, roleId: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name.replace(/_/g, ' ')} ({r.description || 'System Role'})
              </option>
            ))}
          </Select>

          <Input
            label="Account Password"
            type="password"
            required
            value={enableLoginForm.password}
            onChange={(e) => setEnableLoginForm({ ...enableLoginForm, password: e.target.value })}
            helperText="Password stored using bcrypt hashing (minimum 6 characters)"
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEnableLoginModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isActionLoading}>
              Enable & Link Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Employee Password"
        description={`Set a new portal password for ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} (${selectedEmployee?.user?.email || selectedEmployee?.email})`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          {resetPasswordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password Reset Failed</p>
                <p className="mt-0.5 text-rose-600">{resetPasswordError}</p>
              </div>
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            required
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            helperText="Will be hashed with bcrypt immediately. Never stored in plaintext."
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResetPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isActionLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
