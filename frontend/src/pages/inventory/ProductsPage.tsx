import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Package, Plus, DollarSign, Layers, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDataSync } from '../../utils/dataSync';

export function ProductsPage() {
  const { user } = useAuth();
  const canManage =
    user?.roleName === 'ADMIN' ||
    user?.permissions?.includes('inventory.manage') ||
    user?.permissions?.includes('product.manage');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Precision Valves',
    description: '',
    unit: 'pcs',
    unitPrice: 1500,
    costPrice: 800,
    minStockLevel: 15,
    initialStock: 25,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generateNextSku = (currentList = products) => {
    let num = currentList.length + 1;
    let candidate = `PRD-HA-${String(num).padStart(3, '0')}`;
    const existingSkus = new Set(currentList.map((p) => p.sku?.toUpperCase()));
    while (existingSkus.has(candidate)) {
      num++;
      candidate = `PRD-HA-${String(num).padStart(3, '0')}`;
    }
    return candidate;
  };

  const openCreateModal = () => {
    setFormError(null);
    const nextSku = generateNextSku();
    setFormData({
      sku: nextSku,
      name: '',
      category: 'Precision Valves',
      description: '',
      unit: 'pcs',
      unitPrice: 1500,
      costPrice: 800,
      minStockLevel: 15,
      initialStock: 25,
    });
    setIsModalOpen(true);
  };

  const isSkuDuplicate = Boolean(
    formData.sku &&
      products.some(
        (p) => p.sku?.trim().toUpperCase() === formData.sku.trim().toUpperCase()
      )
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Automatically refresh when products, production orders, or stock transactions update
  useDataSync(['PRODUCT', 'STOCK_MOVEMENT', 'PRODUCTION_ORDER'], fetchProducts);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isSkuDuplicate) {
      setFormError(`Product SKU "${formData.sku}" is already in use. Please enter a unique SKU.`);
      return;
    }

    try {
      setSubmitting(true);
      await api.createProduct({
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
      });
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalFinishedStock = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);

  const columns: Column<any>[] = [
    {
      key: 'sku',
      header: 'SKU / Part #',
      sortable: true,
      accessor: (p) => <span className="font-mono font-bold text-slate-900">{p.sku}</span>,
    },
    {
      key: 'name',
      header: 'Product Name',
      accessor: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          <p className="text-[10px] text-slate-400">{p.category}</p>
        </div>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      sortable: true,
      accessor: (p) => (
        <span className="font-bold text-sm text-slate-900">
          {p.currentStock} {p.unit}
        </span>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Selling Price',
      sortable: true,
      accessor: (p) => <span className="font-mono font-semibold text-emerald-600">${p.unitPrice.toLocaleString()}</span>,
    },
    {
      key: 'costPrice',
      header: 'COGS (Cost)',
      sortable: true,
      accessor: (p) => <span className="font-mono text-slate-600">${p.costPrice.toLocaleString()}</span>,
    },
    {
      key: 'margin',
      header: 'Gross Margin',
      accessor: (p) => {
        const margin = p.unitPrice > 0 ? (((p.unitPrice - p.costPrice) / p.unitPrice) * 100).toFixed(0) : 0;
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700">
            {margin}% Margin
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Products' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manufactured Products & SKUs</h1>
            <p className="text-xs text-slate-500 mt-1">
              Finished assemblies, cryogenic regulators, hydraulic actuators, and catalog pricing.
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Product SKU
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Finished Goods Valuation"
          value={`$${totalValuation.toLocaleString()}`}
          subtitle="At manufacturing standard cost"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Total Units in Depots"
          value={`${totalFinishedStock} pcs`}
          subtitle="Available for immediate sales dispatch"
          icon={<Package className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Catalog SKUs"
          value={products.length}
          subtitle="Active engineered product lines"
          icon={<Layers className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search product SKU or title..."
        searchKey={(p) => `${p.sku} ${p.name} ${p.category}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Product SKU to Catalog"
        description="Specify engineering specifications, standard cost, and retail pricing"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Unable to Save Product</p>
                <p className="mt-0.5 text-rose-700">{formError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  SKU / Part Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sku: generateNextSku() })}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Generate SKU
                </button>
              </div>
              <Input
                required
                placeholder="e.g. PRD-HA-500"
                value={formData.sku}
                onChange={(e) => {
                  setFormData({ ...formData, sku: e.target.value });
                  if (formError) setFormError(null);
                }}
                className={isSkuDuplicate ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
              />
              {isSkuDuplicate && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  SKU "{formData.sku}" already exists in catalog.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Titanium High-Pressure Flow Regulator"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formError) setFormError(null);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <Input
              label="Unit (e.g. pcs, sets)"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Selling Price ($)"
              type="number"
              step="0.01"
              required
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
            />
            <Input
              label="Manufacturing Cost Price ($)"
              type="number"
              step="0.01"
              required
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Engineering Description"
            placeholder="Key capabilities, pressure ratings, and operating envelope"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              disabled={isSkuDuplicate || submitting || !formData.name.trim() || !formData.sku.trim()}
            >
              Save Product SKU
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
