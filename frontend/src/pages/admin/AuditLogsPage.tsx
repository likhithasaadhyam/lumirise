import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { ShieldAlert, User } from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      accessor: (l) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {new Date(l.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'Actor / User',
      accessor: (l) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-900">{l.userName}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (l) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {l.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity Impacted',
      accessor: (l) => <span className="font-medium text-brand-700">{l.entity}</span>,
    },
    {
      key: 'details',
      header: 'Audit Trail Details',
      accessor: (l) => (
        <div>
          <p className="text-slate-800 text-xs">{l.details}</p>
          {(l.oldValue || l.newValue) && (
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Delta: {l.oldValue ? `"${l.oldValue}" → ` : ''}"{l.newValue}"
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Origin',
      accessor: (l) => <span className="font-mono text-[10px] text-slate-400">{l.ipAddress || '127.0.0.1'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Administration' }, { label: 'System Audit Logs' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable regulatory audit log of user logins, order state transitions, financial transactions, and approvals.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            Tamper-Proof Audit Logging
          </span>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search audit details, user, or entity..."
        searchKey={(l) => `${l.userName} ${l.action} ${l.entity} ${l.details}`}
        isLoading={loading}
      />
    </div>
  );
}
