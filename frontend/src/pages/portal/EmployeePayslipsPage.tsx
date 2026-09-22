import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  DollarSign,
  Download,
  Calendar,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Printer,
} from 'lucide-react';

interface PayslipItem {
  id: string;
  periodName: string;
  payDate: string;
  grossPay: number;
  baseSalary: number;
  overtimePay: number;
  allowances: number;
  deductions: number;
  taxWithheld: number;
  netPay: number;
  status: 'PAID' | 'PROCESSING';
}

export function EmployeePayslipsPage() {
  const { user, organization } = useAuth();
  const [selectedSlip, setSelectedSlip] = useState<PayslipItem | null>(null);

  const payslips: PayslipItem[] = [
    {
      id: 'slip-08-2026',
      periodName: 'August 2026 Regular Cycle',
      payDate: '2026-08-31',
      baseSalary: 4500,
      overtimePay: 420,
      allowances: 300,
      grossPay: 5220,
      deductions: 180,
      taxWithheld: 720,
      netPay: 4320,
      status: 'PAID',
    },
    {
      id: 'slip-07-2026',
      periodName: 'July 2026 Regular Cycle',
      payDate: '2026-07-31',
      baseSalary: 4500,
      overtimePay: 310,
      allowances: 300,
      grossPay: 5110,
      deductions: 180,
      taxWithheld: 705,
      netPay: 4225,
      status: 'PAID',
    },
    {
      id: 'slip-06-2026',
      periodName: 'June 2026 Regular Cycle',
      payDate: '2026-06-30',
      baseSalary: 4500,
      overtimePay: 150,
      allowances: 300,
      grossPay: 4950,
      deductions: 180,
      taxWithheld: 680,
      netPay: 4090,
      status: 'PAID',
    },
  ];

  const ytdGross = payslips.reduce((acc, s) => acc + s.grossPay, 0);
  const ytdTax = payslips.reduce((acc, s) => acc + s.taxWithheld, 0);
  const ytdNet = payslips.reduce((acc, s) => acc + s.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              My Compensation & Payslips
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              Direct Deposit Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access your salary breakdown, tax withholding, and official proof of income stubs
          </p>
        </div>
      </div>

      {/* YTD Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-brand-500">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">YTD Net Disbursed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ${ytdNet.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Deposited into primary checking account
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">YTD Gross Earnings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ${ytdGross.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Includes base wage + approved overtime
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">YTD Tax Withheld</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ${ytdTax.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Remitted to Federal & State revenue service
          </p>
        </Card>
      </div>

      {/* Payslips Table Card */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Historical Pay Statements</h2>
          <span className="text-xs text-slate-500">{payslips.length} Statements on Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Pay Period</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Gross Wages</th>
                <th className="px-4 py-3">Deductions & Tax</th>
                <th className="px-4 py-3">Net Deposited</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payslips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                      <span className="font-bold text-slate-800">{slip.periodName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{slip.payDate}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-800 font-semibold">
                    ${slip.grossPay.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-rose-600">
                    -${(slip.deductions + slip.taxWithheld).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-emerald-700 font-bold text-sm">
                    ${slip.netPay.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="success">PAID</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSlip(slip)}
                      leftIcon={<Download className="w-3 h-3" />}
                    >
                      View Stub
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Official Pay Stub Preview Modal */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Earnings Statement: ${selectedSlip.periodName}`}
          description={`Issued by ${organization?.name || 'Apex Precision Manufacturing Ltd.'}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-slate-800">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Employer</p>
                <p className="font-bold text-slate-900">{organization?.name || 'Apex Precision Manufacturing Ltd.'}</p>
                <p className="text-slate-500 text-[11px]">EIN: XX-XXXX982 | Cleveland, OH</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Employee</p>
                <p className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-slate-500 text-[11px]">Emp ID: {user?.employeeId || 'EMP-1049'} | {user?.roleName?.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-500">
                  Earnings Breakdown
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Wage:</span>
                  <span className="font-mono font-semibold">${selectedSlip.baseSalary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Overtime (1.5x):</span>
                  <span className="font-mono font-semibold">${selectedSlip.overtimePay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Site Allowances:</span>
                  <span className="font-mono font-semibold">${selectedSlip.allowances.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                  <span>Gross Pay:</span>
                  <span className="font-mono">${selectedSlip.grossPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-500">
                  Withholdings & Deductions
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-600">Federal/State Tax:</span>
                  <span className="font-mono text-rose-600">-${selectedSlip.taxWithheld.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Healthcare / Benefits:</span>
                  <span className="font-mono text-rose-600">-${selectedSlip.deductions.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                  <span>Total Withholdings:</span>
                  <span className="font-mono text-rose-600">
                    -${(selectedSlip.taxWithheld + selectedSlip.deductions).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Net Box */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800">Net Pay Distributed</p>
                <p className="text-[11px] text-emerald-600">Processed via Automated Clearing House (ACH)</p>
              </div>
              <p className="text-2xl font-black font-mono text-emerald-700">
                ${selectedSlip.netPay.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Pay Stub
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedSlip(null)}
              >
                Close Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
