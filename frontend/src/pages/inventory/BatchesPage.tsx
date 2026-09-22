import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';

export function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBatches()
      .then(setBatches)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'batchNumber',
      header: 'Batch / Heat #',
      sortable: true,
      accessor: (b) => <span className="font-mono font-bold text-slate-900">{b.batchNumber}</span>,
    },
    {
      key: 'itemName',
      header: 'Material / Product',
      accessor: (b) => (
        <div>
          <p className="font-semibold text-slate-800">{b.itemName}</p>
          <p className="text-[10px] text-slate-400 font-mono">{b.itemType.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Remaining / Initial',
      accessor: (b) => (
        <span className="font-bold text-slate-900">
          {b.quantity} / {b.initialQuantity}
        </span>
      ),
    },
    {
      key: 'manufacturingDate',
      header: 'Mfg Date',
      accessor: (b) => <span className="text-slate-600">{b.manufacturingDate}</span>,
    },
    {
      key: 'status',
      header: 'QC Release Status',
      accessor: (b) => <StatusBadge status={b.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Batches & Lots' }]} />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Batches, Lots & Heat Numbers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Full material traceability from mill heat certificate to final valve serial numbers.
        </p>
      </div>

      <DataTable
        data={batches}
        columns={columns}
        searchPlaceholder="Search batch number or item..."
        searchKey={(b) => `${b.batchNumber} ${b.itemName} ${b.status}`}
        isLoading={loading}
      />
    </div>
  );
}
