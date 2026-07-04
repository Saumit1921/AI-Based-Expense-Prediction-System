import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BrainCircuit, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-brand-emerald selection:text-slate-900 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-20%] w-[800px] h-[800px] rounded-full bg-blue-500 blur-[150px]"></div>
        <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500 blur-[150px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-gradient-to-tr from-brand-blue to-cyan-500 rounded-xl text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl leading-none bg-gradient-to-r from-brand-blue to-brand-emerald bg-clip-text text-transparent">Expenix</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">Your Personal Expense Predictor</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold hover:text-brand-emerald transition-colors">Sign In</Link>
          <Link to="/signup" className="text-sm font-semibold bg-white text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-white/5">Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs font-semibold text-brand-emerald mb-6 backdrop-blur-md">
          <BrainCircuit className="h-4 w-4" /> Powered by Predictive ML Models
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Predict your spending before it <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">actually happens.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          SmartExpense analyzes your historical ledger patterns to project future outlays, warn you of budget overrides, and provide smart financial recommendations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-blue-500/25 transition-all group">
            Create Free Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login" className="flex items-center justify-center bg-slate-800 hover:bg-slate-750 border border-slate-700/50 text-white font-bold px-8 py-4 rounded-xl transition-colors">
            Demo Platform Login
          </Link>
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-20 w-full max-w-5xl rounded-3xl border border-slate-700/40 bg-slate-850 p-4 shadow-2xl shadow-blue-500/5 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none z-10"></div>
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[16/9] flex items-center justify-center">
            {/* Visual representation of a dark mode dashboard */}
            <div className="text-center p-8">
              <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-blue">
                <BrainCircuit className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="font-bold text-lg mb-1">Interactive Financial Forecaster</h3>
              <p className="text-slate-500 text-xs max-w-sm">
                Linear Regression & Random Forest algorithms map multi-month cycles to generate confidence ratings and future quarterly predictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 bg-slate-950 border-t border-slate-800/80 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Intelligent Expense Management Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to regain command of your finances, assisted by lightweight statistical intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mb-6">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Predictions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Train Linear Regression & Random Forest models on your own ledger records to forecast next month's, next quarter's, and yearly spending.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-6">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Budgets</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Set monthly constraints globally or per category. Get real-time notifications on utilization alerts when pacing too high.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Security & Auditing</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform is secured with robust SHA password hashing, JWT session tags, and full administrator monitoring views.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-sm">
        <p>&copy; 2026 SmartExpense AI prediction Platform. All rights reserved.</p>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
