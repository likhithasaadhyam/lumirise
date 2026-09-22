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
import { ShieldCheck, Plus, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function QualityPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    stage: 'FINISHED_PRODUCT',
    referenceType: 'ProductionOrder',
    referenceNumber: 'PO-1025',
    itemName: 'Cryogenic Control Valve Assembly 4-Inch',
    sampleSize: 10,
    defectsCount: 0,
    status: 'PASS',
    notes: '',
  });

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await api.getQualityInspections();
      setInspections(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  useDataSync(['QUALITY_INSPECTION', 'PRODUCTION_ORDER'], fetchInspections);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQualityInspection(formData);
      setIsModalOpen(false);
      fetchInspections();
    } catch (err: any) {
      alert('Failed to record inspection: ' + err.message);
    }
  };

  const passCount = inspections.filter((i) => i.status === 'PASS').length;
  const holdCount = inspections.filter((i) => i.status === 'HOLD').length;
  const failCount = inspections.filter((i) => i.status === 'FAIL').length;

  const columns: Column<any>[] = [
    {
      key: 'inspectionNumber',
      header: 'QC #',
      sortable: true,
      accessor: (i) => <span className="font-mono font-bold text-slate-900">{i.inspectionNumber}</span>,
    },
    {
      key: 'itemName',
      header: 'Item Inspected',
      accessor: (i) => (
        <div>
          <p className="font-semibold text-slate-800">{i.itemName}</p>
          <p className="text-[10px] text-slate-400">Ref: {i.referenceNumber}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Inspection Stage',
      accessor: (i) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-semibold text-slate-600">
          {i.stage.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'samples',
      header: 'Sample / Defects',
      accessor: (i) => (
        <div className="text-slate-700">
          <span>{i.sampleSize} tested</span>
          {i.defectsCount > 0 && (
            <span className="ml-2 font-semibold text-rose-600">({i.defectsCount} defects)</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Verdict',
      accessor: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'inspectorName',
      header: 'Inspector',
      accessor: (i) => <span className="text-slate-600">{i.inspectorName}</span>,
    },
    {
      key: 'notes',
      header: 'Observations',
      accessor: (i) => <span className="text-slate-500 italic max-w-xs truncate block">{i.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Operations' }, { label: 'Quality Control' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quality Control & Metrology</h1>
            <p className="text-xs text-slate-500 mt-1">
              Inspection logs, hydrostatic leak tests, dimensional tolerance verifications, and compliance sign-offs.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Inspection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Passed Inspections"
          value={passCount}
          subtitle="Meets all aerospace & ASTM criteria"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="On Quarantine / Hold"
          value={holdCount}
          subtitle="Pending engineering disposition"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Failed / Rejection"
          value={failCount}
          subtitle="Dispositioned for rework or scrap"
          icon={<XCircle className="w-5 h-5" />}
          color="rose"
        />
      </div>

      <DataTable
        data={inspections}
        columns={columns}
        searchPlaceholder="Search inspection number or item..."
        searchKey={(i) => `${i.inspectionNumber} ${i.itemName} ${i.referenceNumber}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Quality Inspection"
        description="Log metrology verification, surface finish check, or defect analysis"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Item Description"
            required
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Inspection Stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            >
              <option value="MATERIAL_RECEIVED">Incoming Raw Material</option>
              <option value="IN_PROCESS">In-Process Shopfloor</option>
              <option value="FINISHED_PRODUCT">Finished Product Final QC</option>
            </Select>

            <Input
              label="Reference Number"
              placeholder="e.g. PO-1025 or GRN-904"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Sample Size"
              type="number"
              min="1"
              value={formData.sampleSize}
              onChange={(e) => setFormData({ ...formData, sampleSize: Number(e.target.value) })}
            />

            <Input
              label="Defects Count"
              type="number"
              min="0"
              value={formData.defectsCount}
              onChange={(e) => setFormData({ ...formData, defectsCount: Number(e.target.value) })}
            />

            <Select
              label="Verdict"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="PASS">PASS</option>
              <option value="HOLD">HOLD</option>
              <option value="FAIL">FAIL</option>
              <option value="REWORK">REWORK</option>
            </Select>
          </div>

          <Input
            label="Inspector Observations"
            placeholder="Dimensional tolerances, CMM report reference, surface finish Ra value"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Inspection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
