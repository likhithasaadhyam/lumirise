import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Building2, Plus, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function SuppliersPage() {
  const { user } = useAuth();
  const canManage = user?.roleName === 'ADMIN' || user?.permissions?.includes('supplier.manage');

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    rating: 4.8,
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.getSuppliers();
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      alert('Failed to add vendor: ' + err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Supplier Code',
      sortable: true,
      accessor: (s) => <span className="font-mono font-bold text-slate-900">{s.code}</span>,
    },
    {
      key: 'name',
      header: 'Vendor Name',
      accessor: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.name}</p>
          <p className="text-[10px] text-slate-400">{s.address || 'Address on file'}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      accessor: (s) => (
        <div>
          <p className="font-medium text-slate-800">{s.contactPerson || 'Sales Team'}</p>
          <p className="text-[10px] text-slate-400">{s.email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Vendor Rating',
      sortable: true,
      accessor: (s) => (
        <div className="flex items-center gap-1 text-amber-500 font-semibold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{s.rating} / 5.0</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Suppliers' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Approved Vendor Directory</h1>
            <p className="text-xs text-slate-500 mt-1">
              Raw material mills, polymer molders, precision seal manufacturers, and ISO certified suppliers.
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        searchPlaceholder="Search vendor name, contact or code..."
        searchKey={(s) => `${s.code} ${s.name} ${s.contactPerson} ${s.email}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Approved Vendor"
        description="Add aerospace supplier with quality ratings"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vendor Code"
              required
              placeholder="e.g. SUP-105"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <Input
              label="Company Name"
              required
              placeholder="e.g. Nippon Steel Precision Bar Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Key Contact Representative"
              placeholder="e.g. Kenji Sato"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <Input
              label="Business Email"
              type="email"
              placeholder="orders@vendor.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Corporate / Warehouse Address"
            placeholder="City, State, Country"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
