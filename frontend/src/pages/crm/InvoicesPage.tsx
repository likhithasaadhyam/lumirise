import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatCard } from '../../components/ui/StatCard';
import { FileText, Plus, DollarSign, CheckCircle2, CreditCard } from 'lucide-react';
import { useDataSync } from '../../utils/dataSync';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    subtotal: 75000,
    tax: 6000,
    total: 81000,
    notes: 'Net 30 days payment terms via wire transfer',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'WIRE',
    reference: '',
    notes: 'Wire remittance confirmed',
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invList, custList] = await Promise.all([
        api.getInvoices(),
        api.getCustomers().catch(() => []),
      ]);
      setInvoices(invList);
      setCustomers(custList);
      if (custList.length > 0 && !invoiceForm.customerId) {
        setInvoiceForm((prev) => ({ ...prev, customerId: custList[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useDataSync(['INVOICE', 'PAYMENT', 'SALES_ORDER'], fetchInvoices);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice(invoiceForm);
      setIsInvoiceModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      alert('Failed to generate invoice: ' + err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.recordPayment({
        invoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customerId,
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert('Failed to record payment: ' + err.message);
    }
  };

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    const balanceRemaining = Math.max(0, inv.total - (inv.amountPaid || 0));
    setPaymentForm({
      amount: balanceRemaining,
      method: 'WIRE',
      reference: `WIRE-${Date.now().toString().slice(-6)}`,
      notes: `Settlement for invoice ${inv.invoiceNumber}`,
    });
    setIsPaymentModalOpen(true);
  };

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  const columns: Column<any>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      accessor: (i) => <span className="font-mono font-bold text-slate-900">{i.invoiceNumber}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (i) => (
        <div>
          <p className="font-semibold text-slate-900">{i.customer?.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{i.customer?.code}</p>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Issued Date',
      sortable: true,
      accessor: (i) => <span className="text-slate-600">{i.invoiceDate}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      accessor: (i) => <span className="font-medium text-slate-700">{i.dueDate}</span>,
    },
    {
      key: 'total',
      header: 'Invoice Total',
      sortable: true,
      accessor: (i) => <span className="font-mono font-bold text-slate-900">${i.total.toLocaleString()}</span>,
    },
    {
      key: 'paid',
      header: 'Amount Paid',
      accessor: (i) => (
        <span className="font-mono font-semibold text-emerald-600">
          ${(i.amountPaid || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      accessor: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (i) =>
        i.status !== 'PAID' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPaymentModal(i)}
            leftIcon={<CreditCard className="w-3.5 h-3.5 text-brand-600" />}
          >
            Record Payment
          </Button>
        ) : (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Business' }, { label: 'Invoices & Billing' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoices & Receivables</h1>
            <p className="text-xs text-slate-500 mt-1">
              Billing schedules, commercial contract invoices, payment remittances, and ledger settlement.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Generate Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cash Collected"
          value={`$${totalPaid.toLocaleString()}`}
          subtitle="Settled treasury remittances"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Outstanding Receivables"
          value={`$${totalOutstanding.toLocaleString()}`}
          subtitle="Open invoices due within Net 30"
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Total Invoiced"
          value={`$${totalInvoiced.toLocaleString()}`}
          subtitle="Current fiscal cycle billing"
          icon={<FileText className="w-5 h-5" />}
          color="brand"
        />
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoice # or customer..."
        searchKey={(i) => `${i.invoiceNumber} ${i.customer?.name} ${i.status}`}
        isLoading={loading}
      />

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate Commercial Invoice"
        description="Issue official billing statement to customer account"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="Client Account"
            value={invoiceForm.customerId}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>

          <Input
            label="Payment Due Date"
            type="date"
            required
            value={invoiceForm.dueDate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Subtotal ($)"
              type="number"
              required
              value={invoiceForm.subtotal}
              onChange={(e) => {
                const sub = Number(e.target.value);
                const tax = Math.round(sub * 0.08);
                setInvoiceForm({ ...invoiceForm, subtotal: sub, tax, total: sub + tax });
              }}
            />
            <Input
              label="Tax ($)"
              type="number"
              value={invoiceForm.tax}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: Number(e.target.value), total: invoiceForm.subtotal + Number(e.target.value) })}
            />
            <Input
              label="Grand Total ($)"
              type="number"
              value={invoiceForm.total}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, total: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Invoice Remarks / Wire Instructions"
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Settlement Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment Remittance: ${selectedInvoice?.invoiceNumber}`}
        description={`Customer: ${selectedInvoice?.customer?.name}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs">
            <p className="text-slate-500">
              <span className="font-semibold text-slate-800">Invoice Total:</span> ${selectedInvoice?.total.toLocaleString()}
            </p>
            <p className="text-slate-500">
              <span className="font-semibold text-slate-800">Current Balance Due:</span> $
              {(selectedInvoice?.total - (selectedInvoice?.amountPaid || 0)).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Amount ($)"
              type="number"
              step="0.01"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            />

            <Select
              label="Payment Channel"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="WIRE">Wire Transfer (Fedwire / SWIFT)</option>
              <option value="ACH">ACH Direct Deposit</option>
              <option value="CHEQUE">Commercial Bank Cheque</option>
              <option value="CREDIT_CARD">Credit Card / Gateway</option>
            </Select>
          </div>

          <Input
            label="Bank Transaction / Wire Ref #"
            required
            placeholder="e.g. FEDWIRE-CHASE-0091823"
            value={paymentForm.reference}
            onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Payment Remittance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
