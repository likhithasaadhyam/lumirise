import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Package, Warehouse, CheckCircle2 } from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function FinishedGoodsPage() {
  const [goods, setGoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoods = () => {
    setLoading(true);
    api.getFinishedGoods()
      .then(setGoods)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoods();
  }, []);

  useDataSync(['FINISHED_GOOD', 'PRODUCTION_ORDER', 'DISPATCH', 'STOCK_MOVEMENT'], fetchGoods);

  const totalUnits = goods.reduce((acc, g) => acc + g.quantity, 0);

  const columns: Column<any>[] = [
    {
      key: 'batchNumber',
      header: 'Batch / Lot #',
      sortable: true,
      accessor: (g) => <span className="font-mono font-bold text-slate-900">{g.batchNumber}</span>,
    },
    {
      key: 'product',
      header: 'Finished Product',
      accessor: (g) => (
        <div>
          <p className="font-semibold text-slate-900">{g.product?.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{g.product?.sku}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity In Stock',
      sortable: true,
      accessor: (g) => (
        <span className="font-bold text-slate-900">
          {g.quantity} {g.product?.unit || 'pcs'}
        </span>
      ),
    },
    {
      key: 'warehouse',
      header: 'Storage Location',
      accessor: (g) => (
        <div>
          <p className="font-medium text-slate-800">{g.warehouse?.name}</p>
          <p className="text-[10px] text-slate-400">{g.warehouse?.location}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (g) => <StatusBadge status={g.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date Received',
      accessor: (g) => <span className="text-slate-500">{new Date(g.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Operations' }, { label: 'Finished Goods' }]} />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Finished Goods Inventory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspected, packaged, and verified inventory stored in finished goods depots ready for dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Finished Stock"
          value={`${totalUnits} units`}
          subtitle="Packaged & warehouse-verified"
          icon={<Package className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Active Lots & Batches"
          value={goods.length}
          subtitle="Tracked with CoC certificates"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Designated Depots"
          value="1 Logistics Center"
          subtitle="Climate-controlled Bay C"
          icon={<Warehouse className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={goods}
        columns={columns}
        searchPlaceholder="Search batch or product..."
        searchKey={(g) => `${g.batchNumber} ${g.product?.name} ${g.warehouse?.name}`}
        isLoading={loading}
      />
    </div>
  );
}
