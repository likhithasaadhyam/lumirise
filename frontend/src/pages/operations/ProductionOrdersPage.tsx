import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Cog, Plus, CheckCircle2, Play, AlertCircle } from 'lucide-react';

import { useDataSync } from '../../utils/dataSync';

export function ProductionOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'new');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    productId: '',
    targetQuantity: 100,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    shiftId: '',
    notes: '',
  });

  const [statusFormData, setStatusFormData] = useState({
    status: '',
    completedQuantity: 0,
    rejectedQuantity: 0,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [orderList, prodList, shiftList] = await Promise.all([
        api.getProductionOrders(),
        api.getProducts(),
        api.getShifts(),
      ]);
      setOrders(orderList);
      setProducts(prodList);
      setShifts(shiftList);
      if (prodList.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: prodList[0].id }));
      }
      if (shiftList.length > 0 && !formData.shiftId) {
        setFormData((prev) => ({ ...prev, shiftId: shiftList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useDataSync(['PRODUCTION_ORDER', 'PRODUCT', 'STOCK_MOVEMENT', 'RAW_MATERIAL'], fetchOrders);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProductionOrder(formData);
      setIsCreateOpen(false);
      fetchOrders();
    } catch (err: any) {
      alert('Failed to create order: ' + err.message);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.updateOrderStatus(selectedOrder.id, statusFormData);
      setIsUpdateStatusOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert('Failed to update order status: ' + err.message);
    }
  };

  const openStatusModal = (order: any) => {
    setSelectedOrder(order);
    setStatusFormData({
      status: order.status,
      completedQuantity: order.completedQuantity || 0,
      rejectedQuantity: order.rejectedQuantity || 0,
    });
    setIsUpdateStatusOpen(true);
  };

  // KPIs
  const totalTarget = orders.reduce((acc, o) => acc + o.targetQuantity, 0);
  const totalCompleted = orders.reduce((acc, o) => acc + o.completedQuantity, 0);
  const inProgressCount = orders.filter((o) => o.status === 'IN_PROGRESS').length;

  const columns: Column<any>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      accessor: (o) => <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>,
    },
    {
      key: 'product',
      header: 'Product / SKU',
      accessor: (o) => (
        <div>
          <p className="font-semibold text-slate-800">{o.product?.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{o.product?.sku}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Target / Output',
      accessor: (o) => {
        const pct = Math.min(100, Math.round(((o.completedQuantity || 0) / o.targetQuantity) * 100));
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-slate-700">
                {o.completedQuantity} / {o.targetQuantity}
              </span>
              <span className="text-slate-400">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'rejectedQuantity',
      header: 'Rejections',
      accessor: (o) => (
        <span className={o.rejectedQuantity > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
          {o.rejectedQuantity || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      accessor: (o) => <span className="text-slate-600">{o.dueDate}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (o) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openStatusModal(o);
          }}
        >
          Update State
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Breadcrumbs items={[{ label: 'Operations' }, { label: 'Production Orders' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Production Orders</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage work orders, shopfloor execution, batch progress, and material reconciliation.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Production Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="In Progress Orders"
          value={inProgressCount}
          subtitle="Active on machining & assembly lines"
          icon={<Play className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Units Produced"
          value={`${totalCompleted} / ${totalTarget}`}
          subtitle="Cumulative batch completion"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Total Scheduled Orders"
          value={orders.length}
          subtitle="Planned through next 30 days"
          icon={<Cog className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      {/* Main Table */}
      <DataTable
        data={orders}
        columns={columns}
        searchPlaceholder="Search order number or product..."
        searchKey={(item) => `${item.orderNumber} ${item.product?.name} ${item.product?.sku}`}
        onRowClick={(order) => setSelectedOrder(order)}
        isLoading={loading}
      />

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSearchParams({});
        }}
        title="Schedule New Production Order"
        description="Allocate work order parameters, product bill of materials, and target quantity"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Select
            label="Product"
            required
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Quantity"
              type="number"
              min="1"
              required
              value={formData.targetQuantity}
              onChange={(e) => setFormData({ ...formData, targetQuantity: Number(e.target.value) })}
            />

            <Select
              label="Shift Allocation"
              value={formData.shiftId}
              onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />

            <Input
              label="Target Due Date"
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <Input
            label="Manufacturing Notes / Instructions"
            placeholder="Special tolerances, tooling requirements, or client specific notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setSearchParams({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Production Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Order Status & Progress Modal */}
      <Modal
        isOpen={isUpdateStatusOpen}
        onClose={() => setIsUpdateStatusOpen(false)}
        title={`Update Status: ${selectedOrder?.orderNumber}`}
        description="Transition work order state and record verified output"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
            <p className="text-slate-500 font-medium">Product:</p>
            <p className="font-semibold text-slate-900">{selectedOrder?.product?.name}</p>
            <p className="text-slate-400">Target: {selectedOrder?.targetQuantity} units</p>
          </div>

          <Select
            label="Production Workflow Status"
            value={statusFormData.status}
            onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value })}
          >
            <option value="PLANNED">Planned (Pending Setup)</option>
            <option value="MATERIAL_PENDING">Material Pending</option>
            <option value="READY">Ready for Production</option>
            <option value="IN_PROGRESS">In Progress (Machining/Assembly)</option>
            <option value="QUALITY_CHECK">Quality Check / Inspection</option>
            <option value="COMPLETED">Completed (Move to Finished Goods)</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Completed Units"
              type="number"
              min="0"
              value={statusFormData.completedQuantity}
              onChange={(e) =>
                setStatusFormData({ ...statusFormData, completedQuantity: Number(e.target.value) })
              }
            />

            <Input
              label="Rejected Units"
              type="number"
              min="0"
              value={statusFormData.rejectedQuantity}
              onChange={(e) =>
                setStatusFormData({ ...statusFormData, rejectedQuantity: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUpdateStatusOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save State Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder && !isUpdateStatusOpen}
        onClose={() => setSelectedOrder(null)}
        title={`Work Order ${selectedOrder?.orderNumber}`}
        subtitle={selectedOrder?.product?.name}
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <Button size="sm" onClick={() => openStatusModal(selectedOrder)}>
                Change Status
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-400 uppercase text-[10px]">Target Quantity</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedOrder.targetQuantity} units
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-400 uppercase text-[10px]">Completed Output</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {selectedOrder.completedQuantity} units
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                Execution Timeline
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Start:</span>
                  <span className="font-semibold">{selectedOrder.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Committed Due Date:</span>
                  <span className="font-semibold">{selectedOrder.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Production Shift:</span>
                  <span className="font-semibold">
                    {selectedOrder.shift?.name || 'General Operations'}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrder.materialIssues?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  Material Allocation (BOM)
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedOrder.materialIssues.map((m: any) => (
                    <div key={m.id} className="p-3 flex justify-between items-center bg-white">
                      <div>
                        <p className="font-semibold text-slate-900">{m.rawMaterial?.name}</p>
                        <p className="text-[10px] text-slate-400">Required: {m.quantityRequired}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.notes && (
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                <p className="font-semibold text-amber-800 text-[11px] mb-1">Shopfloor Notes</p>
                <p className="text-amber-900 leading-relaxed">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
