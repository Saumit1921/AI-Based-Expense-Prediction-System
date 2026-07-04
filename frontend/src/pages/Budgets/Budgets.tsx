import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Wallet, Edit, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface Budget {
  budget_id: string;
  monthly_limit: number;
  actual_spent: number;
  utilization: number;
  category_id: string;
  category: {
    category_id: string;
    category_name: string;
    color: string;
    icon: string;
  };
}

interface Category {
  category_id: string;
  category_name: string;
  color: string;
  icon: string;
}

export const Budgets: React.FC = () => {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modal states
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Form states
  const [categoryId, setCategoryId] = useState<string>('');
  const [limit, setLimit] = useState<string>('');

  const fetchBudgets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].category_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBudgets();
      fetchCategories();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(parseFloat(limit)) || parseFloat(limit) <= 0) {
      setError('Please enter a valid budget limit amount.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: categoryId,
          monthly_limit: parseFloat(limit),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error updating budget limit.');
      }

      setSuccess('Budget threshold configured successfully!');
      setLimit('');
      fetchBudgets();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess('');
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Remove this budget threshold constraint?')) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBudgets(prev => prev.filter(b => b.budget_id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setCategoryId(budget.category_id);
    setLimit(budget.monthly_limit.toString());
    setIsOpen(true);
  };

  const totalLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.actual_spent, 0);
  const totalUtilization = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="h-40 w-40" />
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Combined Limit</span>
          <h3 className="text-3xl font-extrabold">₹{totalLimit.toLocaleString()}</h3>
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Actual Spent (This Month)</span>
          <h3 className="text-3xl font-extrabold">₹{totalSpent.toLocaleString()}</h3>
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-medium">Global Limit Utilization</span>
          <h3 className="text-3xl font-extrabold text-brand-emerald">{Math.round(totalUtilization)}%</h3>
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h4 className="font-bold text-base">Category Spend Caps</h4>
          <p className="text-slate-400 text-xs">Manage individual category monthly spending limitations</p>
        </div>
        <button
          onClick={() => {
            setLimit('');
            setIsOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-colors"
        >
          <Plus className="h-4.5 w-4.5" /> Create Category Budget
        </button>
      </div>

      {/* Budget limits list */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="py-20 rounded-3xl border border-slate-200/50 dark:border-slate-850 p-6 text-center text-slate-400 text-xs">
          No budget limits have been set. Create your first cap above to avoid overspending alerts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {

            return (
              <div key={budget.budget_id} className="p-6 rounded-3xl glass-card flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: budget.category.color }}
                      >
                        <span className="font-bold">{budget.category.category_name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none">{budget.category.category_name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Spend Limit Cap</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-1.5 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit limit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.budget_id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Remove limit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Limits and actual values */}
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Spent</p>
                      <p className="font-extrabold text-sm">₹{budget.actual_spent.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Limit</p>
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">₹{budget.monthly_limit.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        budget.utilization >= 100 ? 'bg-red-500' : budget.utilization >= 90 ? 'bg-amber-500' : 'bg-brand-emerald'
                      }`}
                      style={{ width: `${Math.min(100, budget.utilization)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className={`${
                    budget.utilization >= 90 ? 'text-red-500 animate-pulse' : 'text-slate-400'
                  }`}>
                    {budget.utilization}% Utilized
                  </span>
                  <span className="text-slate-400">
                    Remaining: ₹{Math.max(0, budget.monthly_limit - budget.actual_spent).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT BUDGET MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-850">
              <h3 className="font-bold text-base">Configure Budget Limit</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-brand-emerald rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Spending Cap (INR)</label>
                <input
                  type="number"
                  step="1"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
                  placeholder="15000"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-slate-200/60 dark:border-slate-850 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/15 transition-colors"
                >
                  Save Limit
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
export default Budgets;
