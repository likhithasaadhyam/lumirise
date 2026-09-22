import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Calendar, Plus, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isApplyOpen, setIsApplyOpen] = useState(searchParams.get('action') === 'new');
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    days: 2,
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const [leaveList, empList] = await Promise.all([
        api.getLeaves(),
        api.getEmployees(),
      ]);
      setLeaves(leaveList);
      setEmployees(empList);
      if (empList.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: user?.employeeId || empList[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLeave({
        ...formData,
        leaveTypeId: leaves[0]?.leaveTypeId || 'default',
      });
      setIsApplyOpen(false);
      fetchLeaves();
    } catch (err: any) {
      alert('Failed to submit leave request: ' + err.message);
    }
  };

  const handleApproveReject = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedLeave) return;
    try {
      await api.updateLeaveStatus(selectedLeave.id, status, reviewComments);
      setIsReviewOpen(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err: any) {
      alert('Action failed: ' + err.message);
    }
  };

  const openReview = (leave: any) => {
    setSelectedLeave(leave);
    setReviewComments(leave.comments || '');
    setIsReviewOpen(true);
  };

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;

  const columns: Column<any>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (l) => (
        <div>
          <p className="font-semibold text-slate-900">
            {l.employee?.firstName} {l.employee?.lastName}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{l.employee?.employeeCode}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      accessor: (l) => <span className="font-medium text-slate-800">{l.leaveType?.name || 'Annual Leave'}</span>,
    },
    {
      key: 'duration',
      header: 'Duration & Dates',
      accessor: (l) => (
        <div>
          <p className="font-semibold text-slate-900">{l.days} Day(s)</p>
          <p className="text-[10px] text-slate-500">
            {l.startDate} to {l.endDate}
          </p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Purpose',
      accessor: (l) => <span className="text-slate-600 italic max-w-xs truncate block">{l.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'actions',
      header: 'Review',
      accessor: (l) =>
        l.status === 'PENDING' ? (
          <Button variant="outline" size="sm" onClick={() => openReview(l)}>
            Review Request
          </Button>
        ) : (
          <span className="text-[11px] text-slate-400">Decided</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'People' }, { label: 'Leave Requests' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Paid time off policies, medical leaves, manager approvals, and workforce availability calendar.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsApplyOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          subtitle="Awaiting supervisor approval"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Approved This Month"
          value={approvedCount}
          subtitle="Deducted from PTO balance"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Standard Policy Balance"
          value="18 Days"
          subtitle="Annual paid PTO allocation"
          icon={<Calendar className="w-5 h-5" />}
          color="brand"
        />
      </div>

      <DataTable
        data={leaves}
        columns={columns}
        searchPlaceholder="Search employee name or reason..."
        searchKey={(l) => `${l.employee?.firstName} ${l.employee?.lastName} ${l.reason}`}
        isLoading={loading}
      />

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => {
          setIsApplyOpen(false);
          setSearchParams({});
        }}
        title="Submit Leave Request"
        description="Request time-off with planned coverage"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <Select
            label="Employee"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeCode})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
            <Input
              label="Days"
              type="number"
              min="1"
              required
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Reason / Remarks"
            required
            placeholder="Personal emergency, annual vacation, medical recovery"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsApplyOpen(false);
                setSearchParams({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Manager Review: Leave Request"
        description={`Decision for ${selectedLeave?.employee?.firstName} ${selectedLeave?.employee?.lastName}`}
      >
        {selectedLeave && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="text-slate-500">
                <span className="font-semibold text-slate-800">Duration:</span> {selectedLeave.days} Days ({selectedLeave.startDate} to {selectedLeave.endDate})
              </p>
              <p className="text-slate-500">
                <span className="font-semibold text-slate-800">Reason:</span> "{selectedLeave.reason}"
              </p>
            </div>

            <Input
              label="Manager Remarks / Coverage Notes"
              placeholder="e.g. Approved. Shopfloor supervisor notified."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleApproveReject('REJECTED')}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproveReject('APPROVED')}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Approve Leave
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
