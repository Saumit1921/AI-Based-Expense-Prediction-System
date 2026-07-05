import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Table, Calendar, ArrowDownToLine, Sparkles, AlertCircle } from 'lucide-react';

interface ReportSummary {
  period: string;
  start_date: string;
  end_date: string;
  total_spent: number;
  growth_rate: number;
  expense_count: number;
  category_distribution: Array<{
    category_id: string;
    category_name: string;
    total_amount: number;
    percentage: number;
    budget_limit: number;
    budget_utilization: number;
  }>;
}

export const ReportsShare: React.FC = () => {
  const query = new URLSearchParams(useLocation().search);
  const preset = query.get('preset') || 'month';
  const token = query.get('token');

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSharedReport = async () => {
      if (!token) {
        setError('Missing validation credential token.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/reports/summary?filter_preset=${preset}&token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        } else {
          const errData = await res.json();
          setError(errData.message || 'Failed to authenticate shared report.');
        }
      } catch (err) {
        console.error(err);
        setError('Error establishing connection to Expenix audit servers.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [preset, token]);

  const handleDownloadCsv = () => {
    if (!token) return;
    const url = `/api/reports/export/csv?filter_preset=${preset}&token=${token}`;
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Shared_Expense_Report_${preset}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-300">
      
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-72 h-72 rounded-full bg-blue-500/10 blur-[100px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-3xl z-10 flex flex-col gap-6">
        
        {/* Logo/Brand Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Expenix</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Shared Ledger Audit</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider">
            Verified Secure Link
          </span>
        </div>

        {loading ? (
          <div className="p-12 rounded-3xl glass-card flex flex-col items-center justify-center gap-4 text-center">
            <div className="h-10 w-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
            <span className="text-xs text-slate-400 animate-pulse font-semibold">Decrypting financial ledger summary...</span>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/25 text-center flex flex-col items-center gap-3">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="font-extrabold text-base text-white">Verification Failed</h3>
            <p className="text-xs text-red-400 max-w-sm leading-relaxed">{error}</p>
          </div>
        ) : !summary ? (
          <div className="p-12 rounded-3xl glass-card text-center text-slate-400 text-xs">
            No report summaries mapped.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Header info */}
            <div className="p-6 rounded-3xl glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Reporting Window ({summary.period})</span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {new Date(summary.start_date).toLocaleDateString()} to {new Date(summary.end_date).toLocaleDateString()}
                </h2>
              </div>
              
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-colors cursor-pointer w-full md:w-auto justify-center"
              >
                <ArrowDownToLine className="h-4 w-4" /> Download CSV Ledger
              </button>
            </div>

            {/* Aggregates Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl glass-card">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Aggregate spent</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">₹{summary.total_spent.toLocaleString()}</h3>
              </div>
              
              <div className="p-4 rounded-2xl glass-card">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Growth rate</span>
                <h3 className={`text-xl font-extrabold mt-1 ${
                  summary.growth_rate > 0 ? 'text-red-500' : 'text-emerald-400'
                }`}>
                  {summary.growth_rate > 0 ? `+${summary.growth_rate}%` : `${summary.growth_rate}%`}
                </h3>
              </div>

              <div className="p-4 rounded-2xl glass-card">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Record count</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">{summary.expense_count} rows</h3>
              </div>
            </div>

            {/* Category details table */}
            <div className="p-6 rounded-3xl glass-card">
              <h4 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
                <Table className="h-4 w-4 text-blue-400" />
                <span>Category Outlays & Thresholds</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-right">Outgo Amount</th>
                      <th className="pb-3 text-right">Proportion</th>
                      <th className="pb-3 text-right">Budget Limit</th>
                      <th className="pb-3 text-right">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                    {summary.category_distribution.map((cat) => (
                      <tr key={cat.category_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3.5 font-bold flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                          <span>{cat.category_name}</span>
                        </td>
                        <td className="py-3.5 font-black text-right text-white">₹{cat.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 font-semibold text-slate-400 text-right">{cat.percentage}%</td>
                        <td className="py-3.5 font-bold text-slate-400 text-right">
                          {cat.budget_limit > 0 ? `₹${cat.budget_limit.toLocaleString()}` : '--'}
                        </td>
                        <td className={`py-3.5 font-bold text-right ${
                          cat.budget_utilization >= 100 ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {cat.budget_limit > 0 ? `${cat.budget_utilization}%` : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer notice */}
            <div className="text-center py-4">
              <p className="text-[10px] text-slate-500 leading-normal">
                This is a secure shareable read-only financial audit generated by Expenix.<br />
                Credentials remain encrypted. Ensure you scan and access from trusted terminals.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
export default ReportsShare;
