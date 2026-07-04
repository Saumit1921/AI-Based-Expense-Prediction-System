import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid email or password.');
    }
  };

  const handleDemoFill = (role: 'user' | 'admin') => {
    if (role === 'user') {
      setEmail('demo@example.com');
      setPassword('demo123');
    } else {
      setEmail('admin@example.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6 relative overflow-hidden text-white font-sans">
      {/* Glow elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-gradient-to-tr from-brand-blue to-cyan-500 rounded-xl text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="font-extrabold text-2xl bg-gradient-to-r from-brand-blue to-brand-emerald bg-clip-text text-transparent">Expenix</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">Your Personal Expense Predictor</span>
          </Link>
          <h2 className="text-xl font-bold">Welcome back</h2>
          <p className="text-slate-400 text-xs mt-1">Please enter your credentials to access your ledger.</p>
        </div>

        {/* Card wrapper */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-850 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none text-sm transition-all"
                  placeholder="name@example.com"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-400">Password</label>
                <Link to="/forgot-password" style={{ display: 'none' }} className="text-[11px] font-semibold text-brand-blue hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-850 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none text-sm transition-all"
                  placeholder="••••••••"
                  required
                />
                <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
              {!submitting && <ArrowRight className="h-4.5 w-4.5" />}
            </button>
          </form>

          {/* Quick Demo Autofill section */}
          <div className="mt-8 border-t border-slate-900 pt-6">
            <p className="text-slate-500 text-[10px] font-semibold tracking-wider uppercase text-center mb-3">Quick Demo Access</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDemoFill('user')}
                className="flex-1 py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800/80 transition-colors text-slate-300 font-medium"
              >
                Autofill User (Demo)
              </button>
              <button
                onClick={() => handleDemoFill('admin')}
                className="flex-1 py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800/80 transition-colors text-slate-300 font-medium"
              >
                Autofill Admin
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-blue font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
