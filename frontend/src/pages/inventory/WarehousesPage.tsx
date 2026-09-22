import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Warehouse, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function WarehousesPage() {
  const { user } = useAuth();
  const canManage = user?.roleName === 'ADMIN' || user?.permissions?.includes('warehouse.manage');

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    capacity: '',
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await api.getWarehouses();
      setWarehouses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWarehouse(formData);
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      alert('Failed to create warehouse: ' + err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      accessor: (w) => <span className="font-mono font-bold text-slate-900">{w.code}</span>,
    },
    {
      key: 'name',
      header: 'Depot Name',
      accessor: (w) => <span className="font-semibold text-slate-800">{w.name}</span>,
    },
    {
      key: 'location',
      header: 'Physical Location',
      accessor: (w) => <span className="text-slate-600">{w.location}</span>,
    },
    {
      key: 'capacity',
      header: 'Storage Capacity',
      accessor: (w) => <span className="text-slate-500 font-medium">{w.capacity || 'Flexible'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Warehouses' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Warehouse Locations & Depots</h1>
            <p className="text-xs text-slate-500 mt-1">
              Central raw material storage, climate-controlled finished goods, and cleanroom quarantine bays.
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Warehouse
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={warehouses}
        columns={columns}
        searchPlaceholder="Search warehouse name, code, or bay..."
        searchKey={(w) => `${w.code} ${w.name} ${w.location}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Warehouse Depot"
        description="Add storage bay or regional logistics facility"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Depot Code"
            required
            placeholder="e.g. WH-B2-03"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <Input
            label="Warehouse Name"
            required
            placeholder="e.g. Chemical & Solvent Storage Depot"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Facility Location"
            required
            placeholder="e.g. Building B, Racks 14-22"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <Input
            label="Capacity Specification"
            placeholder="e.g. 500 sq meters / 40 pallets"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Depot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
