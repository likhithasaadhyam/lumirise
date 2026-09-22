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
import { ShoppingCart, Plus, DollarSign, Clock } from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function SalesOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');

  const [formData, setFormData] = useState({
    customerId: '',
    deliveryDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    subtotal: 92500,
    tax: 7400,
    total: 99900,
    notes: 'Requires certified inspection reports with shipment',
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordList, custList] = await Promise.all([
        api.getSalesOrders(),
        api.getCustomers().catch(() => []),
      ]);
      setOrders(ordList);
      setCustomers(custList);
      if (custList.length > 0 && !formData.customerId) {
        setFormData((prev) => ({ ...prev, customerId: custList[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useDataSync(['SALES_ORDER', 'PRODUCT', 'STOCK_MOVEMENT', 'INVOICE'], fetchOrders);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSalesOrder(formData);
      setIsModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      alert('Failed to create sales order: ' + err.message);
    }
  };

  const totalContractValue = orders.reduce((acc, o) => acc + o.total, 0);

  const columns: Column<any>[] = [
    {
      key: 'orderNumber',
      header: 'Sales Order #',
      sortable: true,
      accessor: (o) => <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.customer?.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{o.customer?.code}</p>
        </div>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      sortable: true,
      accessor: (o) => <span className="text-slate-600">{o.orderDate}</span>,
    },
    {
      key: 'deliveryDate',
      header: 'Target Delivery',
      sortable: true,
      accessor: (o) => <span className="font-medium text-slate-800">{o.deliveryDate}</span>,
    },
    {
      key: 'total',
      header: 'Order Total',
      sortable: true,
      accessor: (o) => <span className="font-mono font-bold text-emerald-600">${o.total.toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Fulfillment Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Business' }, { label: 'Sales Orders' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Commercial Sales Orders</h1>
            <p className="text-xs text-slate-500 mt-1">
              Customer purchase contracts, scheduled line deliveries, and production triggers.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Sales Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Contract Bookings"
          value={`$${totalContractValue.toLocaleString()}`}
          subtitle="Confirmed customer commitments"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Confirmed Orders"
          value={orders.length}
          subtitle="Linked to manufacturing queues"
          icon={<ShoppingCart className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="On-Time Delivery Target"
          value="99.2%"
          subtitle="Aerospace SLA performance"
          icon={<Clock className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={orders}
        columns={columns}
        searchPlaceholder="Search order number or customer..."
        searchKey={(o) => `${o.orderNumber} ${o.customer?.name} ${o.status}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSearchParams({});
        }}
        title="Generate Sales Order Contract"
        description="Book confirmed client contract and assign fulfillment dates"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Client Account"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>

          <Input
            label="Committed Delivery Date"
            type="date"
            required
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Subtotal ($)"
              type="number"
              required
              value={formData.subtotal}
              onChange={(e) => {
                const sub = Number(e.target.value);
                const tax = Math.round(sub * 0.08);
                setFormData({ ...formData, subtotal: sub, tax, total: sub + tax });
              }}
            />
            <Input
              label="Estimated Tax ($)"
              type="number"
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value), total: formData.subtotal + Number(e.target.value) })}
            />
            <Input
              label="Grand Total ($)"
              type="number"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Special Contract Clauses / Packing Instructions"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                setSearchParams({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Sales Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
