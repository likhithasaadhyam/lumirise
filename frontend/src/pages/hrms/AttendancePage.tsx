import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Clock, CheckCircle2, UserCheck, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const { user } = useAuth();

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.getAttendance(selectedDate);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handlePunch = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      setPunchLoading(true);
      await api.punchAttendance({ type, employeeId: user?.employeeId || undefined });
      fetchAttendance();
    } catch (err: any) {
      alert('Punch failed: ' + err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

  const columns: Column<any>[] = [
    {
      key: 'employeeCode',
      header: 'EMP ID',
      accessor: (r) => <span className="font-mono font-bold text-slate-900">{r.employee?.employeeCode}</span>,
    },
    {
      key: 'name',
      header: 'Employee Name',
      accessor: (r) => (
        <div>
          <p className="font-semibold text-slate-900">
            {r.employee?.firstName} {r.employee?.lastName}
          </p>
          <p className="text-[10px] text-slate-400">{r.employee?.designation}</p>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      accessor: (r) => <span className="text-slate-600">{r.shift?.name || r.employee?.shift?.name || 'General Shift'}</span>,
    },
    {
      key: 'checkIn',
      header: 'Punch In',
      accessor: (r) => (
        <span className="font-mono font-medium text-slate-700">{r.checkIn || '—'}</span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Punch Out',
      accessor: (r) => (
        <span className="font-mono font-medium text-slate-700">{r.checkOut || 'Active on shift'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'notes',
      header: 'Notes',
      accessor: (r) => <span className="text-slate-500 italic">{r.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'People' }, { label: 'Attendance & Shifts' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shift Attendance & Time Tracking</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time shopfloor punch logs, shift allocations, overtime tracking, and biometric timestamps.
            </p>
          </div>

          {/* Punch Simulation Buttons for terminal / user */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePunch('CHECK_IN')}
              isLoading={punchLoading}
              leftIcon={<LogIn className="w-4 h-4 text-emerald-600" />}
            >
              Punch In (Check In)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePunch('CHECK_OUT')}
              isLoading={punchLoading}
              leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
            >
              Punch Out (Check Out)
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Present on Duty"
          value={presentCount}
          subtitle="Checked in for scheduled shift"
          icon={<UserCheck className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Late Check-ins"
          value={lateCount}
          subtitle="Arrived past grace threshold"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Unexcused Absence"
          value={absentCount}
          subtitle="No leave request on file"
          icon={<AlertCircle className="w-5 h-5" />}
          color="rose"
        />
      </div>

      <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-semibold text-slate-700">Filter Shift Date:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <DataTable
        data={records}
        columns={columns}
        searchPlaceholder="Search employee name or code..."
        searchKey={(r) => `${r.employee?.employeeCode} ${r.employee?.firstName} ${r.employee?.lastName}`}
        isLoading={loading}
      />
    </div>
  );
}
