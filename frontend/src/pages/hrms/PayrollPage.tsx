import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { DollarSign, CheckCircle2, FileText } from 'lucide-react';

export function PayrollPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayroll()
      .then(setPeriods)
      .finally(() => setLoading(false));
  }, []);

  const activePeriod = periods[0];
  const slips = activePeriod?.slips || [];

  const columns: Column<any>[] = [
    {
      key: 'employee',
      header: 'Employee / Designation',
      accessor: (s) => (
        <div>
          <p className="font-semibold text-slate-900">
            {s.employee?.firstName} {s.employee?.lastName}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {s.employee?.employeeCode} • {s.employee?.department?.name}
          </p>
        </div>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      accessor: (s) => <span className="font-mono text-slate-700">${s.basicSalary.toLocaleString()}</span>,
    },
    {
      key: 'allowances',
      header: 'Allowances',
      accessor: (s) => <span className="font-mono text-emerald-600">+${s.allowances.toLocaleString()}</span>,
    },
    {
      key: 'overtime',
      header: 'Overtime',
      accessor: (s) => <span className="font-mono text-brand-600">+${(s.overtime || 0).toLocaleString()}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions (Tax/Benefit)',
      accessor: (s) => <span className="font-mono text-rose-600">-${s.deductions.toLocaleString()}</span>,
    },
    {
      key: 'netSalary',
      header: 'Net Pay',
      sortable: true,
      accessor: (s) => <span className="font-mono font-bold text-slate-900">${s.netSalary.toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />,
    },
  ];

  const totalPayroll = slips.reduce((acc: number, s: any) => acc + s.netSalary, 0);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'People' }, { label: 'Payroll & Slips' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Processing & Pay Slips</h1>
            <p className="text-xs text-slate-500 mt-1">
              Monthly pay run calculations, statutory deductions, shift overtime, and approved payslips.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Current Run: {activePeriod?.name || 'September 2026'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Net Pay Run"
          value={`$${totalPayroll.toLocaleString()}`}
          subtitle="Committed disbursement for period"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Processed Slips"
          value={`${slips.length} Staff`}
          subtitle="Full-time & technical operators"
          icon={<FileText className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Payroll Status"
          value={activePeriod?.status || 'APPROVED'}
          subtitle="Ready for treasury disbursement"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={slips}
        columns={columns}
        searchPlaceholder="Search employee name or code..."
        searchKey={(s) => `${s.employee?.firstName} ${s.employee?.lastName} ${s.employee?.employeeCode}`}
        isLoading={loading}
      />
    </div>
  );
}
