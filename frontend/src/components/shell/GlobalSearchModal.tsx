import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Cog, Package, Building, FileText, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ employees: [], orders: [], products: [], customers: [], invoices: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ employees: [], orders: [], products: [], customers: [], invoices: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  const hasResults =
    results.employees.length > 0 ||
    results.orders.length > 0 ||
    results.products.length > 0 ||
    results.customers.length > 0 ||
    results.invoices.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center pt-20 px-4">
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Employee (EMP-1025), Order (PO-1025), Customer, Product, Invoice..."
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="py-6 text-center text-xs text-slate-400">Searching enterprise records...</div>
            )}

            {!loading && !query && (
              <div className="py-8 text-center text-xs text-slate-400">
                Type keywords like <span className="font-semibold text-slate-600">"Ravi"</span>,{' '}
                <span className="font-semibold text-slate-600">"PO-1025"</span>,{' '}
                <span className="font-semibold text-slate-600">"Boeing"</span>, or{' '}
                <span className="font-semibold text-slate-600">"Valve"</span>
              </div>
            )}

            {!loading && query && !hasResults && (
              <div className="py-8 text-center text-xs text-slate-500">
                No enterprise records matching <span className="font-semibold">"{query}"</span>
              </div>
            )}

            {/* Production Orders */}
            {results.orders.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cog className="w-3.5 h-3.5 text-brand-500" />
                  <span>Production Orders</span>
                </div>
                <div className="space-y-1">
                  {results.orders.map((po: any) => (
                    <div
                      key={po.id}
                      onClick={() => handleSelect('/operations/production')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-xs text-slate-900">{po.orderNumber}</span>
                        <span className="text-xs text-slate-500">{po.product?.name}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-brand-600 flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employees */}
            {results.employees.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Employees & Workforce</span>
                </div>
                <div className="space-y-1">
                  {results.employees.map((emp: any) => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelect(`/people/employees/${emp.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-xs text-slate-900">{emp.employeeCode}</span>
                        <span className="text-xs text-slate-700">{emp.firstName} {emp.lastName}</span>
                        <span className="text-[11px] text-slate-400">• {emp.designation}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-brand-600 flex items-center gap-1">
                        View Profile <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {results.products.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Finished Products</span>
                </div>
                <div className="space-y-1">
                  {results.products.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect('/inventory/products')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-xs text-slate-900">{p.sku}</span>
                        <span className="text-xs text-slate-700">{p.name}</span>
                        <span className="text-[11px] text-emerald-600 font-medium">Stock: {p.currentStock} {p.unit}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-brand-600 flex items-center gap-1">
                        View Inventory <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-500" />
                  <span>Customers</span>
                </div>
                <div className="space-y-1">
                  {results.customers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect('/business/customers')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-xs text-slate-900">{c.code}</span>
                        <span className="text-xs text-slate-700">{c.name}</span>
                        <span className="text-[11px] text-slate-400">({c.company})</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-brand-600 flex items-center gap-1">
                        View Customer <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {results.invoices.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Invoices</span>
                </div>
                <div className="space-y-1">
                  {results.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      onClick={() => handleSelect('/business/invoices')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-xs text-slate-900">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-700">{inv.customer?.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">${inv.total.toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-brand-600 flex items-center gap-1">
                        View Invoice <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
