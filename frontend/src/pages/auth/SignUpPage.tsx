import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Sparkles, Building, ArrowRight, User } from 'lucide-react';

export function SignUpPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Precision Engineering & Aerospace',
    companySize: '50-100',
    country: 'United States',
    businessEmail: '',
    fullName: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData);
      navigate('/?setup=true');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/30 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create Company Workspace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Setup your multi-tenant Lumirise manufacturing instance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Company Info */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs mb-3">
                <Building className="w-4 h-4 text-brand-600" />
                <span>1. Company Profile</span>
              </div>

              <div className="space-y-3">
                <Input
                  label="Company Name"
                  required
                  placeholder="e.g. Acme Precision Components Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="Precision Engineering & Aerospace">Aerospace & Defense</option>
                    <option value="Automotive & Transportation">Automotive Parts</option>
                    <option value="Industrial Machinery">Industrial Equipment</option>
                    <option value="Electronics & High-Tech">Electronics Fabrication</option>
                    <option value="Chemicals & Polymers">Chemicals & Materials</option>
                  </Select>

                  <Select
                    label="Company Size"
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  >
                    <option value="10-50">10-50 employees</option>
                    <option value="50-100">50-100 employees</option>
                    <option value="100-500">100-500 employees</option>
                    <option value="500+">500+ enterprise</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Administrator Account */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs mb-3">
                <User className="w-4 h-4 text-brand-600" />
                <span>2. Administrator Account</span>
              </div>

              <div className="space-y-3">
                <Input
                  label="Administrator Full Name"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />

                <Input
                  label="Business Email"
                  type="email"
                  required
                  placeholder="admin@yourcompany.com"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Workspace
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have a workspace?{' '}
            <Link to="/sign-in" className="font-semibold text-brand-600 hover:text-brand-500">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
