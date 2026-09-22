import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import {
  Cog,
  PackagePlus,
  UserPlus,
  CalendarCheck,
  ShieldCheck,
  ShoppingCart,
  Send,
  Building,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickActionItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  requiredPermissions: string[];
}

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userPerms = new Set(user?.permissions || []);
  const isAdmin = user?.roleName === 'ADMIN';

  const allActions: QuickActionItem[] = [
    {
      title: 'New Production Order',
      description: 'Schedule a work order, line allocation & batch targets',
      icon: <Cog className="w-5 h-5 text-brand-600" />,
      color: 'bg-brand-50 border-brand-100 hover:border-brand-300',
      action: () => navigate('/operations/production?action=new'),
      requiredPermissions: ['production.create', 'production.manage'],
    },
    {
      title: 'Stock In / Stock Out',
      description: 'Post raw material receipt or inventory ledger movement',
      icon: <PackagePlus className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300',
      action: () => navigate('/inventory/stock-in-out'),
      requiredPermissions: ['stock.manage'],
    },
    {
      title: 'Record Quality Check',
      description: 'Log metrology inspection, hydrostatic test, or sample QA',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 border-amber-100 hover:border-amber-300',
      action: () => navigate('/operations/quality?action=new'),
      requiredPermissions: ['quality.manage'],
    },
    {
      title: 'Add Employee',
      description: 'Onboard new technician, engineer, or supervisor',
      icon: <UserPlus className="w-5 h-5 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300',
      action: () => navigate('/people/employees?action=new'),
      requiredPermissions: ['employees.manage'],
    },
    {
      title: 'Create Sales Order',
      description: 'Generate commercial contract from customer PO',
      icon: <ShoppingCart className="w-5 h-5 text-sky-600" />,
      color: 'bg-sky-50 border-sky-100 hover:border-sky-300',
      action: () => navigate('/business/orders?action=new'),
      requiredPermissions: ['sales_orders.manage'],
    },
    {
      title: 'Generate Invoice',
      description: 'Issue commercial invoice against order or account',
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-100 hover:border-purple-300',
      action: () => navigate('/business/invoices?action=new'),
      requiredPermissions: ['invoices.manage'],
    },
    {
      title: 'Apply / Request Leave',
      description: 'Submit time-off request for manager review',
      icon: <CalendarCheck className="w-5 h-5 text-rose-600" />,
      color: 'bg-rose-50 border-rose-100 hover:border-rose-300',
      action: () => navigate('/people/leave?action=new'),
      requiredPermissions: ['my_leave.view', 'leave.view'],
    },
    {
      title: 'Log Work Shift / Clock',
      description: 'Record timestamp, assigned station or line check-in',
      icon: <Clock className="w-5 h-5 text-teal-600" />,
      color: 'bg-teal-50 border-teal-100 hover:border-teal-300',
      action: () => navigate('/people/attendance'),
      requiredPermissions: ['my_attendance.view', 'attendance.view'],
    },
    {
      title: 'Create Dispatch Order',
      description: 'Prepare shipment, carrier booking, and tracking bill',
      icon: <Send className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
      action: () => navigate('/operations/dispatch?action=new'),
      requiredPermissions: ['dispatch.manage'],
    },
    {
      title: 'Add Customer',
      description: 'Register client profile, terms, and billing contacts',
      icon: <Building className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 border-amber-100 hover:border-amber-300',
      action: () => navigate('/business/customers?action=new'),
      requiredPermissions: ['customers.manage'],
    },
  ];

  const visibleActions = allActions.filter((item) => {
    if (isAdmin) return true;
    return item.requiredPermissions.some((perm) => userPerms.has(perm));
  });

  const handleSelect = (act: () => void) => {
    act();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Actions"
      description={`Fast-track operations tailored to your role (${user?.roleName?.replace(/_/g, ' ') || 'User'})`}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleActions.map((item, idx) => (
          <div
            key={idx}
            onClick={() => handleSelect(item.action)}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-start gap-3.5 group hover:shadow-sm ${item.color}`}
          >
            <div className="p-2 rounded-lg bg-white shadow-subtle shrink-0">
              {item.icon}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1">
                {item.description}
              </p>
            </div>
          </div>
        ))}

        {visibleActions.length === 0 && (
          <div className="col-span-2 py-8 text-center text-slate-500 text-xs">
            No quick actions permitted for your active clearance level.
          </div>
        )}
      </div>
    </Modal>
  );
}
