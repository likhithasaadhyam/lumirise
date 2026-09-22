import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Layers, Plus, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDataSync } from '../../utils/dataSync';

export function RawMaterialsPage() {
  const { user } = useAuth();
  const canManage =
    user?.roleName === 'ADMIN' ||
    user?.permissions?.includes('inventory.manage') ||
    user?.permissions?.includes('raw_material.manage');

  const [materials, setMaterials] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Metals & Alloys',
    unit: 'kg',
    unitCost: 50,
    minStockLevel: 200,
    initialStock: 500,
    supplierId: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generateNextCode = (currentList = materials) => {
    let num = currentList.length + 1;
    let candidate = `RM-${String(num).padStart(2, '0')}`;
    const existingCodes = new Set(currentList.map((m) => m.code?.toUpperCase()));
    while (existingCodes.has(candidate)) {
      num++;
      candidate = `RM-${String(num).padStart(2, '0')}`;
    }
    return candidate;
  };

  const openCreateModal = () => {
    setFormError(null);
    const nextCode = generateNextCode();
    setFormData({
      name: '',
      code: nextCode,
      category: 'Metals & Alloys',
      unit: 'kg',
      unitCost: 50,
      minStockLevel: 200,
      initialStock: 500,
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
    });
    setIsModalOpen(true);
  };

  const isCodeDuplicate = Boolean(
    formData.code &&
      materials.some(
        (m) => m.code?.trim().toUpperCase() === formData.code.trim().toUpperCase()
      )
  );

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const [matList, supList] = await Promise.all([
        api.getRawMaterials().catch((err) => {
          console.error('Failed to get raw materials:', err);
          return [];
        }),
        api.getSuppliers().catch(() => []),
      ]);
      setMaterials(matList);
      setSuppliers(supList);
      if (supList.length > 0 && !formData.supplierId) {
        setFormData((prev) => ({ ...prev, supplierId: supList[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Automatically refresh when raw materials or stock ledger entries are updated elsewhere
  useDataSync(['RAW_MATERIAL', 'STOCK_MOVEMENT'], fetchMaterials);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isCodeDuplicate) {
      setFormError(`Material code "${formData.code}" is already in use. Please enter a unique code.`);
      return;
    }

    try {
      setSubmitting(true);
      await api.createRawMaterial({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
      });
      setIsModalOpen(false);
      fetchMaterials();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add raw material.');
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockItems = materials.filter((m) => m.currentStock <= m.minStockLevel);
  const totalValuation = materials.reduce((acc, m) => acc + m.currentStock * m.unitCost, 0);

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      accessor: (m) => <span className="font-mono font-bold text-slate-900">{m.code}</span>,
    },
    {
      key: 'name',
      header: 'Material Name',
      accessor: (m) => (
        <div>
          <p className="font-semibold text-slate-900">{m.name}</p>
          <p className="text-[10px] text-slate-400">{m.category}</p>
        </div>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      sortable: true,
      accessor: (m) => {
        const isLow = m.currentStock <= m.minStockLevel;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
              {m.currentStock.toLocaleString()} {m.unit}
            </span>
            {isLow && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                LOW STOCK
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'minStockLevel',
      header: 'Safety Min.',
      accessor: (m) => <span className="text-slate-500">{m.minStockLevel} {m.unit}</span>,
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      accessor: (m) => <span className="text-slate-700 font-mono">${m.unitCost.toFixed(2)}</span>,
    },
    {
      key: 'supplier',
      header: 'Primary Supplier',
      accessor: (m) => (
        <span className="text-slate-600">{m.supplier?.name || 'Standard Vendor'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Inventory' }, { label: 'Raw Materials' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Raw Materials Inventory</h1>
            <p className="text-xs text-slate-500 mt-1">
              Titanium alloys, stainless rods, high-temp elastomers, and aerospace manufacturing feeds.
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Raw Material
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Stock Valuation"
          value={`$${totalValuation.toLocaleString()}`}
          subtitle="Total raw inventory on-hand"
          icon={<DollarSign className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Low Stock Warnings"
          value={lowStockItems.length}
          subtitle="Below safety threshold levels"
          icon={<AlertTriangle className="w-5 h-5" />}
          color={lowStockItems.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Registered Feedstocks"
          value={materials.length}
          subtitle="Certified aerospace material codes"
          icon={<Layers className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={materials}
        columns={columns}
        searchPlaceholder="Search material name, code, or category..."
        searchKey={(m) => `${m.code} ${m.name} ${m.category} ${m.supplier?.name}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Raw Material"
        description="Add aerospace feedstock with minimum safety thresholds"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Unable to Save Material</p>
                <p className="mt-0.5 text-rose-700">{formError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Material Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, code: generateNextCode() })}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Generate Code
                </button>
              </div>
              <Input
                required
                placeholder="e.g. RM-TI-05"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  if (formError) setFormError(null);
                }}
                className={isCodeDuplicate ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
              />
              {isCodeDuplicate && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  Code "{formData.code}" already exists in inventory.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Material Name <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Inconel 718 Round Bar"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formError) setFormError(null);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Metals & Alloys">Metals & Alloys</option>
              <option value="Polymers & Seals">Polymers & Seals</option>
              <option value="Fasteners & Hardware">Fasteners & Hardware</option>
              <option value="Coatings & Chemicals">Coatings & Chemicals</option>
            </Select>

            <Input
              label="Unit of Measure"
              placeholder="kg, pcs, meters"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Unit Cost ($)"
              type="number"
              step="0.01"
              required
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
            />

            <Input
              label="Safety Min. Stock"
              type="number"
              required
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
            />

            <Input
              label="Initial Stock"
              type="number"
              required
              value={formData.initialStock}
              onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
            />
          </div>

          <Select
            label="Designated Supplier"
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              disabled={isCodeDuplicate || submitting || !formData.name.trim() || !formData.code.trim()}
            >
              Save Raw Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
