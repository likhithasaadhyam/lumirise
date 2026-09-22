import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { Building, Plus, DollarSign, ShieldCheck } from 'lucide-react';

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    creditLimit: 250000,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(formData);
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert('Failed to register client: ' + err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Customer ID',
      sortable: true,
      accessor: (c) => <span className="font-mono font-bold text-slate-900">{c.code}</span>,
    },
    {
      key: 'name',
      header: 'Company / Client',
      accessor: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.name}</p>
          <p className="text-[10px] text-slate-400">{c.company}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Procurement Contact',
      accessor: (c) => (
        <div>
          <p className="text-slate-700">{c.email}</p>
          <p className="text-[10px] text-slate-400">{c.phone || 'Phone on file'}</p>
        </div>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Approved Credit Limit',
      sortable: true,
      accessor: (c) => <span className="font-mono font-semibold text-slate-800">${c.creditLimit.toLocaleString()}</span>,
    },
    {
      key: 'ordersCount',
      header: 'Orders Placed',
      accessor: (c) => <span className="font-semibold text-brand-600">{c._count?.salesOrders || 0} orders</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (c) => <StatusBadge status={c.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Business' }, { label: 'Customers' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Key Customer Accounts</h1>
            <p className="text-xs text-slate-500 mt-1">
              Aerospace OEMs, turbine manufacturers, defense prime contractors, and commercial client profiles.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Accounts"
          value={customers.length}
          subtitle="Certified aerospace buyers"
          icon={<Building className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Approved Credit Facility"
          value="$1.1M"
          subtitle="Total trade receivables limit"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Compliance & NDA Status"
          value="100% Signed"
          subtitle="Defense & ITAR compliant"
          icon={<ShieldCheck className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      <DataTable
        data={customers}
        columns={columns}
        searchPlaceholder="Search customer code, name, or email..."
        searchKey={(c) => `${c.code} ${c.name} ${c.company} ${c.email}`}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSearchParams({});
        }}
        title="Register New Client Account"
        description="Add commercial customer and configure credit threshold"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Account Name"
              required
              placeholder="e.g. Lockheed Martin Space"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Corporate Entity"
              placeholder="e.g. Lockheed Martin Corporation"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Procurement Email"
              type="email"
              required
              placeholder="orders@customer.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Contact Phone"
              placeholder="+1 (555) 201-9988"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Trade Credit Limit ($)"
              type="number"
              required
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
            />
            <Input
              label="Tax ID / DUNS #"
              placeholder="e.g. US-99281726"
              value={formData.taxNumber}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
            />
          </div>

          <Input
            label="Corporate / Billing Address"
            placeholder="Street address, city, state, postal code"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              Save Customer Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
