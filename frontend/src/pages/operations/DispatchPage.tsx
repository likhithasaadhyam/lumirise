import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Send, Plus, Truck, CheckCircle2, Clock } from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function DispatchPage() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    salesOrderNumber: 'SO-9011',
    customerName: 'Boeing Defense Systems',
    carrier: 'FedEx Freight Priority',
    trackingNumber: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    itemSummary: '45x Cryogenic Control Valve Assembly',
    totalItems: 45,
    destination: 'Boeing Plant 2, Seattle, WA',
    notes: 'Shock-isolated pallets with temperature loggers',
  });

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const data = await api.getDispatches();
      setDispatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  useDataSync(['DISPATCH', 'SALES_ORDER', 'STOCK_MOVEMENT'], fetchDispatches);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDispatch(formData);
      setIsModalOpen(false);
      fetchDispatches();
    } catch (err: any) {
      alert('Failed to create dispatch: ' + err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'dispatchNumber',
      header: 'Dispatch #',
      sortable: true,
      accessor: (d) => <span className="font-mono font-bold text-slate-900">{d.dispatchNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer & Order',
      accessor: (d) => (
        <div>
          <p className="font-semibold text-slate-900">{d.customerName}</p>
          <p className="text-[10px] text-slate-400">Order: {d.salesOrderNumber}</p>
        </div>
      ),
    },
    {
      key: 'carrier',
      header: 'Carrier & Tracking',
      accessor: (d) => (
        <div>
          <p className="font-medium text-slate-800">{d.carrier}</p>
          <p className="text-[10px] font-mono text-brand-600">{d.trackingNumber || 'Pending Bill'}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items Shipped',
      accessor: (d) => (
        <div>
          <p className="text-slate-800">{d.itemSummary}</p>
          <p className="text-[10px] text-slate-400">Qty: {d.totalItems} units</p>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      accessor: (d) => <span className="text-slate-600 max-w-xs truncate block">{d.destination}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (d) => <StatusBadge status={d.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Operations' }, { label: 'Dispatch & Shipping' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dispatch & Shipping</h1>
            <p className="text-xs text-slate-500 mt-1">
              Outbound logistics, commercial carrier manifests, packing lists, and delivery tracking.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Dispatch
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Shipments"
          value={dispatches.length}
          subtitle="Outbound orders in transit"
          icon={<Truck className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Delivered Rate"
          value="100%"
          subtitle="Zero in-transit damage incidents"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Average Turnaround"
          value="24h"
          subtitle="From QC pass to carrier handover"
          icon={<Clock className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={dispatches}
        columns={columns}
        searchPlaceholder="Search dispatch #, customer or tracking..."
        searchKey={(d) => `${d.dispatchNumber} ${d.customerName} ${d.trackingNumber} ${d.salesOrderNumber}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Outbound Dispatch Order"
        description="Book carrier bill of lading and link to client sales order"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sales Order #"
              required
              value={formData.salesOrderNumber}
              onChange={(e) => setFormData({ ...formData, salesOrderNumber: e.target.value })}
            />
            <Input
              label="Customer Name"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Logistics Carrier"
              required
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
            />
            <Input
              label="Carrier Tracking / Bill of Lading #"
              placeholder="e.g. FX-99018274"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Item Manifest Summary"
                required
                value={formData.itemSummary}
                onChange={(e) => setFormData({ ...formData, itemSummary: e.target.value })}
              />
            </div>
            <Input
              label="Total Units"
              type="number"
              min="1"
              required
              value={formData.totalItems}
              onChange={(e) => setFormData({ ...formData, totalItems: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Delivery Destination Address"
            required
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Dispatch Shipment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
