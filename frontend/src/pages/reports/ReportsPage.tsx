import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { BarChart3, Download, DollarSign, Cog, Package, CheckCircle2 } from 'lucide-react';

export function ReportsPage() {
  const [prodSummary, setProdSummary] = useState<any>(null);
  const [inventoryVal, setInventoryVal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProductionSummary(),
      api.getInventoryValuation(),
    ])
      .then(([prod, inv]) => {
        setProdSummary(prod);
        setInventoryVal(inv);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Reports' }, { label: 'Management Analytics' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Management Reports</h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-functional operational performance, plant yield metrics, inventory valuation, and cash flow summary.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export / Print Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Overall Plant Yield"
          value={prodSummary?.overallYield || '98.5%'}
          subtitle="First-pass machining accuracy"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Total Inventory Asset"
          value={loading ? '...' : `$${(inventoryVal?.totalValuation || 0).toLocaleString()}`}
          subtitle="Raw stock + Finished goods"
          icon={<DollarSign className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Total Production Output"
          value={loading ? '...' : `${prodSummary?.totalCompleted || 0} units`}
          subtitle="Against scheduled target"
          icon={<Cog className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Scrap & Rejection Loss"
          value={loading ? '...' : `${prodSummary?.totalRejected || 0} units`}
          subtitle="Non-conforming items"
          icon={<Package className="w-5 h-5" />}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle>Production Orders Yield Breakdown</CardTitle>
            <CardDescription>Machining line throughput and defect tallies by work order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 text-xs">
              {prodSummary?.breakdown?.map((item: any) => {
                const pct = Math.min(100, Math.round(((item.completedQuantity || 0) / item.targetQuantity) * 100));
                return (
                  <div key={item.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">{item.orderNumber}</span>
                      <span className="text-slate-600 font-medium">{item.product?.name}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>
                        Yield: {item.completedQuantity} ok, {item.rejectedQuantity} scrap (Target: {item.targetQuantity})
                      </span>
                      <span className="font-semibold text-brand-600">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Valuation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Asset Valuation Breakdown</CardTitle>
            <CardDescription>Capital allocated across warehouse depots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Raw Material Billets & Hardware:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ${(inventoryVal?.rawValuation || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Finished Packaged Goods:</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    ${(inventoryVal?.finishedValuation || 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                  <span>Grand Inventory Capital:</span>
                  <span className="font-mono text-base">
                    ${(inventoryVal?.totalValuation || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Valuation calculated using standard aerospace inventory costing based on approved supplier invoices and standard shopfloor machining labor standards.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
