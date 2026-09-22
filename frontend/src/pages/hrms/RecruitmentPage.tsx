import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Briefcase, Plus, Users, Star } from 'lucide-react';

export function RecruitmentPage() {
  const [openings, setOpenings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    openings: 1,
    experience: '3-5 years precision manufacturing',
    salaryRange: '$70,000 - $85,000',
    location: 'Plant 1 - Cleveland',
    description: '',
  });

  const fetchRecruitment = async () => {
    try {
      setLoading(true);
      const [jobs, depts] = await Promise.all([
        api.getRecruitment(),
        api.getDepartments(),
      ]);
      setOpenings(jobs);
      setDepartments(depts);
      if (depts.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: depts[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitment();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createJobOpening(formData);
      setIsModalOpen(false);
      fetchRecruitment();
    } catch (err: any) {
      alert('Failed to create opening: ' + err.message);
    }
  };

  const totalCandidates = openings.reduce((acc, job) => acc + (job.candidates?.length || 0), 0);

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Role Title',
      sortable: true,
      accessor: (j) => (
        <div>
          <p className="font-semibold text-slate-900">{j.title}</p>
          <p className="text-[10px] text-slate-400">{j.department?.name}</p>
        </div>
      ),
    },
    {
      key: 'openings',
      header: 'Openings',
      accessor: (j) => <span className="font-semibold text-slate-700">{j.openings} positions</span>,
    },
    {
      key: 'experience',
      header: 'Experience Profile',
      accessor: (j) => <span className="text-slate-600">{j.experience || 'Industry standard'}</span>,
    },
    {
      key: 'salaryRange',
      header: 'Comp Band',
      accessor: (j) => <span className="font-mono text-slate-700 font-medium">{j.salaryRange || 'Competitive'}</span>,
    },
    {
      key: 'candidates',
      header: 'Active Applicants',
      accessor: (j) => (
        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-xs">
          {j.candidates?.length || 0} candidates
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (j) => <StatusBadge status={j.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'People' }, { label: 'Recruitment & Hiring' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recruitment & Talent Pipeline</h1>
            <p className="text-xs text-slate-500 mt-1">
              Aerospace machinist requisitions, metrology specialists, candidate interviews, and offers.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Job Opening
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Open Requisitions"
          value={openings.length}
          subtitle="Actively hiring technical positions"
          icon={<Briefcase className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Active Applicants"
          value={totalCandidates}
          subtitle="Screening, interview & offer stages"
          icon={<Users className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Average Candidate Score"
          value="4.6 / 5.0"
          subtitle="Aerospace technical assessments"
          icon={<Star className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      <DataTable
        data={openings}
        columns={columns}
        searchPlaceholder="Search job title or department..."
        searchKey={(j) => `${j.title} ${j.department?.name}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post New Requisition"
        description="Specify job description, required experience, and compensation band"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Position Title"
            required
            placeholder="e.g. Lead Metrologist & CMM Programmer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Input
              label="Number of Openings"
              type="number"
              min="1"
              required
              value={formData.openings}
              onChange={(e) => setFormData({ ...formData, openings: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Experience Required"
              placeholder="e.g. 5+ years aerospace machining"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            />

            <Input
              label="Salary Band Range"
              placeholder="e.g. $75,000 - $90,000"
              value={formData.salaryRange}
              onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
            />
          </div>

          <Input
            label="Position Summary"
            placeholder="Brief overview of key technical duties and required controller certifications"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Post Job Opening
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
