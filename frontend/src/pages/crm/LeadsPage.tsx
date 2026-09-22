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
import { Target, Plus, DollarSign, Building } from 'lucide-react';

export function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'TRADE_SHOW',
    estimatedValue: 120000,
    assignedToName: 'Arthur Vance',
    notes: '',
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();
      setLeads(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(formData);
      setIsModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      alert('Failed to add lead: ' + err.message);
    }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      await api.updateLeadStage(leadId, newStage);
      fetchLeads();
    } catch (err: any) {
      alert('Failed to update stage: ' + err.message);
    }
  };

  const pipelineValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Prospect & Company',
      accessor: (l) => (
        <div>
          <p className="font-semibold text-slate-900">{l.name}</p>
          <p className="text-[10px] font-medium text-slate-500">{l.company}</p>
        </div>
      ),
    },
    {
      key: 'estimatedValue',
      header: 'Est. Deal Value',
      sortable: true,
      accessor: (l) => <span className="font-mono font-bold text-emerald-600">${l.estimatedValue.toLocaleString()}</span>,
    },
    {
      key: 'source',
      header: 'Acquisition Channel',
      accessor: (l) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
          {l.source.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Account Owner',
      accessor: (l) => <span className="text-slate-700">{l.assignedToName || 'Commercial Team'}</span>,
    },
    {
      key: 'status',
      header: 'Pipeline Stage',
      accessor: (l) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={l.status} />
          <select
            value={l.status}
            onChange={(e) => handleStageChange(l.id, e.target.value)}
            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600 hover:border-slate-300"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Deal Brief',
      accessor: (l) => <span className="text-slate-500 italic max-w-xs truncate block">{l.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Business' }, { label: 'Leads & Pipeline' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Leads & Opportunities</h1>
            <p className="text-xs text-slate-500 mt-1">
              Aerospace bids, commercial turbine RFQs, stage conversions, and estimated contract pipeline.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Lead Opportunity
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Active Pipeline"
          value={`$${pipelineValue.toLocaleString()}`}
          subtitle="Cumulative unweighted opportunity"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Active Prospects"
          value={leads.length}
          subtitle="Aerospace & defense defense contractors"
          icon={<Target className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Top Source"
          value="Trade Shows"
          subtitle="Aviation Expo & Defense Summit"
          icon={<Building className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={leads}
        columns={columns}
        searchPlaceholder="Search prospect or company name..."
        searchKey={(l) => `${l.name} ${l.company} ${l.email}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Sales Opportunity"
        description="Register new commercial prospect and estimated contract value"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Representative"
              required
              placeholder="e.g. Marcus Wright"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Company Name"
              required
              placeholder="e.g. Pratt & Whitney Turbines"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+1 (555) 302-9901"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Lead Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              <option value="TRADE_SHOW">Aerospace Trade Show</option>
              <option value="WEBSITE">Direct Website Inbound</option>
              <option value="REFERRAL">Client Partner Referral</option>
              <option value="COLD_CALL">Outbound Account Sourcing</option>
            </Select>

            <Input
              label="Estimated Deal Value ($)"
              type="number"
              required
              value={formData.estimatedValue}
              onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Opportunity Brief / Specs Requested"
            placeholder="e.g. RFQ for cryogenic valve assemblies for rocket engine test stand"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Opportunity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
