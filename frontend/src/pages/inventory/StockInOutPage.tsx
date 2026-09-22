import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { PackagePlus, PackageMinus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function StockInOutPage() {
  const { user } = useAuth();
  const canManage =
    user?.roleName === 'ADMIN' ||
    user?.permissions?.includes('stock.manage') ||
    user?.permissions?.includes('inventory.manage');

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    transactionType: 'STOCK_IN', // 'STOCK_IN' or 'STOCK_OUT'
    warehouseId: '',
    itemType: 'RAW_MATERIAL', // 'RAW_MATERIAL' or 'PRODUCT'
    itemId: '',
    quantity: 50,
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([api.getWarehouses(), api.getRawMaterials(), api.getProducts()])
      .then(([whs, mats, prods]) => {
        setWarehouses(whs);
        setRawMaterials(mats);
        setProducts(prods);
        if (whs.length > 0) setFormData((prev) => ({ ...prev, warehouseId: whs[0].id }));
        if (mats.length > 0) setFormData((prev) => ({ ...prev, itemId: mats[0].id }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleItemTypeChange = (type: string) => {
    const defaultId = type === 'RAW_MATERIAL' ? rawMaterials[0]?.id : products[0]?.id;
    setFormData((prev) => ({ ...prev, itemType: type, itemId: defaultId || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await api.recordStockTransaction(formData);
      setSuccessMsg(`Successfully recorded ${formData.transactionType.replace(/_/g, ' ')} of ${formData.quantity} units!`);
      setTimeout(() => {
        navigate('/inventory/ledger');
      }, 1200);
    } catch (err: any) {
      alert('Transaction failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Stock In / Stock Out' }]} />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Post Inventory Movement</h1>
        <p className="text-xs text-slate-500 mt-1">
          Direct physical receipt, warehouse replenishment, or scrap removal with real-time stock balance recalculation.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Movement Parameters</CardTitle>
          <CardDescription>Select transaction type, depot location, and verified count</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type Selector Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transactionType: 'STOCK_IN' })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  formData.transactionType === 'STOCK_IN'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PackagePlus className="w-4 h-4 text-emerald-600" />
                <span>STOCK IN (Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, transactionType: 'STOCK_OUT' })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  formData.transactionType === 'STOCK_OUT'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PackageMinus className="w-4 h-4 text-rose-600" />
                <span>STOCK OUT (Issue / Disposal)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Warehouse Depot"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </Select>

              <Select
                label="Item Category"
                value={formData.itemType}
                onChange={(e) => handleItemTypeChange(e.target.value)}
              >
                <option value="RAW_MATERIAL">Raw Material Feedstock</option>
                <option value="PRODUCT">Manufactured Finished Product</option>
              </Select>
            </div>

            <Select
              label="Select Item"
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
            >
              {formData.itemType === 'RAW_MATERIAL'
                ? rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) — Current: {m.currentStock} {m.unit}
                    </option>
                  ))
                : products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.currentStock} {p.unit}
                    </option>
                  ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity to Move"
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />

              <Input
                label="Reference Document #"
                placeholder="e.g. GRN-9902 or DISP-104"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>

            <Input
              label="Transaction Reason / Remarks"
              placeholder="Supplier invoice reference, physical recount adjustment, or line return"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            {!canManage && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Posting stock ledger movements requires Warehouse Management authorization.</span>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/inventory/ledger')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={loading} disabled={!canManage}>
                Post Inventory Movement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
