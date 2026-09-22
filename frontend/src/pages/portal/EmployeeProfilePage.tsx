import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  UserCheck,
  Mail,
  Building,
  Clock,
  Key,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

export function EmployeeProfilePage() {
  const { user, organization } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 text-white shadow-md overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/20">
            {user?.firstName?.[0] || 'U'}
            {user?.lastName?.[0] || 'P'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">
                {user?.firstName} {user?.lastName}
              </h1>
              <Badge variant="purple" className="bg-brand-500/20 text-brand-300 border-brand-500/30">
                {user?.roleName?.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {user?.employeeId ? `ID: ${user.employeeId}` : 'ID: EMP-1049'}
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{organization?.name || 'Apex Precision Manufacturing Ltd.'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Active Full-Time</span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Employment Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              <span>Employment & Assignment Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Department</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">Manufacturing & Shopfloor</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Assigned Shift</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">Day Shift A (07:00 - 15:30 EST)</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Reporting Supervisor</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">Marcus Vance (VP Manufacturing)</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Work Location</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">Cleveland Plant - Sector 4</p>
              </div>
            </div>
          </Card>

          {/* Contact Details */}
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-600" />
              <span>Contact & Emergency Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Work Email</p>
                <p className="font-semibold text-slate-800 font-mono mt-0.5">{user?.email}</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Contact Phone</p>
                <p className="font-semibold text-slate-800 mt-0.5">+1 (555) 349-8821</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Emergency Contact</p>
                <p className="font-semibold text-slate-800 mt-0.5">Elena Jenkins (Spouse) - +1 (555) 902-1144</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Home Address</p>
                <p className="font-semibold text-slate-800 mt-0.5">482 Lakeview Blvd, Lakewood, OH</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Security Clearances & Granular Permissions */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-600" />
                <span>Active Security Tokens</span>
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {user?.permissions?.length || 0} granted
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              These granular permission codes dictate what modules, data sets, and quick actions are accessible to your profile.
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {(user?.permissions || []).map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-semibold">{perm}</span>
                </div>
              ))}

              {(!user?.permissions || user.permissions.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No individual permission codes attached.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
