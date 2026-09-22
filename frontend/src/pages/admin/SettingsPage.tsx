import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Building, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';

export function SettingsPage() {
  const { organization, refreshProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    country: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD',
  });

  useEffect(() => {
    Promise.all([api.getOrgSettings(), api.getUsers()])
      .then(([org, userList]) => {
        if (org) {
          setFormData({
            name: org.name || '',
            industry: org.industry || '',
            size: org.size || '',
            country: org.country || '',
            email: org.email || '',
            phone: org.phone || '',
            address: org.address || '',
            currency: org.currency || 'USD',
          });
        }
        setUsers(userList);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateOrgSettings(formData);
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to update settings: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Breadcrumbs items={[{ label: 'Administration' }, { label: 'Company Settings' }]} />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization & Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Company profile, tenant isolation parameters, and authorized user accounts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Company settings updated successfully!</span>
        </div>
      )}

      {/* Organization Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-600" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>Primary operating details and legal entity identity</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Industry Domain"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Company Size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <Input
                label="Default Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Official Business Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="HQ Contact Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <Input
              label="Physical Facility Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </CardContent>
          <CardFooter>
            <span className="text-[11px] text-slate-400">Workspace Code: {organization?.code}</span>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Multi-Tenant Security Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle>Multi-Tenant Isolation Architecture</CardTitle>
          </div>
          <CardDescription>Zero data leakage guarantee enforced at the backend database query layer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Tenant Scoping Mode:</span>
              <span className="font-semibold text-emerald-600">Strict (Org ID Scoped)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">RBAC Matrix Enforcement:</span>
              <span className="font-semibold text-emerald-600">Active (Express Middleware)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Audit Trail Logging:</span>
              <span className="font-semibold text-emerald-600">Active (Synchronous DB Writes)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Users & Roles Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <CardTitle>Authorized Organization Users</CardTitle>
          </div>
          <CardDescription>Configured system logins mapped to roles and employee profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 text-xs">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{u.firstName} {u.lastName}</p>
                  <p className="text-[11px] text-slate-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px]">
                    {u.role?.name?.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
