import { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Building,
  UserCheck,
  LogOut,
  HelpCircle,
  User,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenQuickAction: () => void;
  onToggleMobileMenu: () => void;
  unreadCount?: number;
}

// Map database roles to official corporate titles
const ROLE_TITLE_MAP: Record<string, string> = {
  ADMIN: 'Executive Admin / Managing Director',
  PRODUCTION_MANAGER: 'Production Planning Lead',
  WAREHOUSE_MANAGER: 'Warehouse & Logistics Lead',
  HR_MANAGER: 'People & HR Manager',
  ACCOUNTANT: 'Financial Accountant & Billing',
  PRODUCTION_EMPLOYEE: 'Production Technician',
  WAREHOUSE_EMPLOYEE: 'Warehouse Operations Tech',
  EMPLOYEE: 'Operations Associate',
};

export function Topbar({
  onOpenSearch,
  onOpenNotifications,
  onOpenQuickAction,
  onToggleMobileMenu,
  unreadCount = 0,
}: TopbarProps) {
  const { user, organization, signOut, switchRole } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [devSwitcherOpen, setDevSwitcherOpen] = useState(false);

  // Development-only persona switcher flag (strictly disabled in production and by default)
  const isDevSwitcherEnabled =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_PERSONA_SWITCHER === 'true';

  const userRole = user?.roleName || 'EMPLOYEE';
  const userTitle =
    (user as any)?.employee?.designation ||
    ROLE_TITLE_MAP[userRole] ||
    userRole.replace(/_/g, ' ');

  const devRoles = [
    { role: 'ADMIN', label: 'Super Admin', email: 'admin@apex.com' },
    { role: 'PRODUCTION_MANAGER', label: 'Production Manager', email: 'production@apex.com' },
    { role: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager', email: 'warehouse@apex.com' },
    { role: 'HR_MANAGER', label: 'HR Manager', email: 'hr@apex.com' },
    { role: 'ACCOUNTANT', label: 'Accountant', email: 'accountant@apex.com' },
    { role: 'PRODUCTION_EMPLOYEE', label: 'Production Tech', email: 'prod.emp@apex.com' },
    { role: 'WAREHOUSE_EMPLOYEE', label: 'Warehouse Tech', email: 'wh.emp@apex.com' },
    { role: 'EMPLOYEE', label: 'Employee', email: 'operator@apex.com' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-subtle">
      {/* Left: Mobile Toggle & Organization Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-xs">
          <Building className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
            {organization?.name || 'Lumirise Workspace'}
          </span>
        </div>
      </div>

      {/* Center: Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs text-slate-400 hover:text-slate-600 transition-colors shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
            <span className="hidden sm:inline">Search orders, employees, products, invoices...</span>
            <span className="sm:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Actions: Quick Action, Notifications, User Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickAction}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="hidden sm:inline-flex shadow-sm"
        >
          Quick Action
        </Button>

        {/* Development-Only Role Switcher (Hidden in production and by default) */}
        {isDevSwitcherEnabled && (
          <div className="relative">
            <button
              onClick={() => {
                setDevSwitcherOpen(!devSwitcherOpen);
                setProfileOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-amber-300 bg-amber-50 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              title="Development Testing Persona Switcher"
            >
              <Sliders className="w-3 h-3 text-amber-600" />
              <span>[DEV] Switch</span>
            </button>

            {devSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 max-h-[80vh] overflow-y-auto">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Development Persona Switcher
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Feature active only via VITE_ENABLE_PERSONA_SWITCHER=true
                  </p>
                </div>
                <div className="p-1 space-y-0.5">
                  {devRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setDevSwitcherOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                        userRole === r.role ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p>{r.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.email}</p>
                      </div>
                      {userRole === r.role && <span className="w-2 h-2 rounded-full bg-amber-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* Non-Editable Identity Display & Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setDevSwitcherOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 text-left group"
            title="My Account"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-slate-100 shrink-0 group-hover:ring-brand-100 transition-all">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || 'K'}
            </div>

            {/* Non-editable Identity Info */}
            <div className="hidden md:flex flex-col text-left max-w-[170px]">
              <span className="text-xs font-semibold text-slate-900 leading-tight truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight truncate">
                {userTitle}
              </span>
            </div>
          </button>

          {/* User Account Menu (No role switching permitted) */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              {/* Account Identity Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-500 truncate mb-1.5">{user?.email}</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs">
                    <UserCheck className="w-3 h-3 text-brand-600" />
                    {userRole.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {user?.permissions?.length || 0} permissions
                  </span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    window.location.href = '/portal/profile';
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  My Profile & Employment
                </button>
                {(userRole === 'ADMIN' || user?.permissions?.includes('settings.view')) && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      window.location.href = '/administration/settings';
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Organization Settings
                  </button>
                )}
                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    setProfileOpen(false);
                    alert('Lumirise Enterprise ERP v1.0.0 — Role-Based Access Control Active');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Help & Documentation
                </a>
              </div>

              {/* Sign Out */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
