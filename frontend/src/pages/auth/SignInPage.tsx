import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function SignInPage() {
  const [email, setEmail] = useState('admin@apex.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogins = [
    { label: 'Admin (Arthur Vance)', email: 'admin@apex.com', role: 'Executive' },
    { label: 'Production Mgr (Marcus Chen)', email: 'production@apex.com', role: 'Operations' },
    { label: 'HR Mgr (Elena Rostova)', email: 'hr@apex.com', role: 'People & HR' },
    { label: 'Operator (Ravi Kumar)', email: 'operator@apex.com', role: 'Shopfloor' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/30 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">LUMIRISE</h2>
        <p className="mt-1 text-xs text-slate-400">Enterprise Manufacturing ERP + CRM + HRMS Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Sign in to your Workspace</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enter your enterprise credentials</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <Input
              label="Business Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Lumirise
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Demo Personas (Preloaded Seed)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => {
                    setEmail(q.email);
                    setPassword('Password123!');
                  }}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 text-left transition-colors"
                >
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">{q.label}</p>
                  <p className="text-[10px] text-slate-500">{q.role}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need a new company workspace?{' '}
            <Link to="/sign-up" className="font-semibold text-brand-600 hover:text-brand-500">
              Create Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
