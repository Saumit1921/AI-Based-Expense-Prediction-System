import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, CreditCard, Trash2 } from 'lucide-react';

interface Expense {
  expense_id: string;
  amount: number;
  payment_method: string;
  description: string;
  expense_date: string;
  category: {
    category_name: string;
    color: string;
    icon: string;
  };
}

export const Expenses: React.FC = () => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filters states
  const [searchText, setSearchText] = useState<string>('');
  const [filterPreset, setFilterPreset] = useState<string>('month');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const fetchExpenses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/expenses?filter_preset=${filterPreset}`;
      
      if (searchText) url += `&search=${encodeURIComponent(searchText)}`;
      if (paymentMethod) url += `&payment_method=${paymentMethod}`;
      
      if (filterPreset === 'custom') {
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token, filterPreset, paymentMethod]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.expense_id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search and Filters panel */}
      <div className="p-6 rounded-3xl glass-card">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search description/merchant..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm focus:border-brand-blue"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            
            {/* Filter preset */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Calendar className="h-4 w-4" />
              <select
                value={filterPreset}
                onChange={(e) => setFilterPreset(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Payment Method filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <CreditCard className="h-4 w-4" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value="">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-brand-blue hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-colors"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Custom Date Ranges inputs if "custom" selected */}
        {filterPreset === 'custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-full text-slate-700 dark:text-slate-350 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-full text-slate-700 dark:text-slate-350 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table grid */}
      <div className="p-6 rounded-3xl glass-card overflow-hidden">
        <h4 className="font-bold text-base mb-4">Financial Transaction Ledger</h4>
        
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="h-8 w-8 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">No records matching your filters could be found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold text-slate-400 uppercase">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description / Merchant</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                {expenses.map((exp) => (
                  <tr key={exp.expense_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 font-medium text-slate-600 dark:text-slate-300">
                      {new Date(exp.expense_date).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-4">
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: exp.category.color }}
                      >
                        {exp.category.category_name}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-slate-850 dark:text-slate-200">
                      {exp.description || `${exp.category.category_name} expense`}
                    </td>
                    <td className="py-4 font-medium text-slate-500 dark:text-slate-400">{exp.payment_method}</td>
                    <td className="py-4 font-extrabold text-red-500 text-right">
                      -₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.expense_id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
export default Expenses;
