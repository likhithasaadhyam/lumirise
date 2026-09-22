import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Plus } from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function StockLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLedger = () => {
    setLoading(true);
    api.getStockLedger()
      .then(setEntries)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  useDataSync(['STOCK_MOVEMENT', 'RAW_MATERIAL', 'PRODUCT'], fetchLedger);

  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      accessor: (e) => (
        <span className="font-mono text-slate-500">
          {new Date(e.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'itemName',
      header: 'Item',
      accessor: (e) => (
        <div>
          <p className="font-semibold text-slate-900">{e.itemName}</p>
          <p className="text-[10px] text-slate-400 font-mono">{e.itemType.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'transactionType',
      header: 'Type',
      accessor: (e) => {
        const isIn = e.transactionType.includes('IN') || e.transactionType.includes('RECEIPT');
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {e.transactionType.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (e) => {
        const isIn = e.transactionType.includes('IN') || e.transactionType.includes('RECEIPT');
        return (
          <span className={`font-mono font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isIn ? '+' : '-'}{e.quantity}
          </span>
        );
      },
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      accessor: (e) => <span className="font-mono font-bold text-slate-900">{e.balanceAfter}</span>,
    },
    {
      key: 'warehouse',
      header: 'Depot',
      accessor: (e) => <span className="text-slate-600">{e.warehouse?.name}</span>,
    },
    {
      key: 'referenceNumber',
      header: 'Doc Ref',
      accessor: (e) => <span className="font-mono text-slate-500">{e.referenceNumber || '—'}</span>,
    },
    {
      key: 'createdByName',
      header: 'Authorized By',
      accessor: (e) => <span className="text-slate-600">{e.createdByName}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Stock Ledger' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Traceable Stock Ledger</h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable chronological record of every receipt, production issue, scrap write-off, and warehouse transfer.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/inventory/stock-in-out')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Post Movement
          </Button>
        </div>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        searchPlaceholder="Search item name, ref, or warehouse..."
        searchKey={(e) => `${e.itemName} ${e.referenceNumber} ${e.warehouse?.name} ${e.createdByName}`}
        isLoading={loading}
      />
    </div>
  );
}
