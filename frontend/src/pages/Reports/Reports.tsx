import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Download, Printer, Table, QrCode, ClipboardCopy, Check, X } from 'lucide-react';

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

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const [preset, setPreset] = useState<string>('month');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // QR & Share States
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const shareUrl = `${window.location.origin}/reports/share?preset=${preset}&token=${token}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

  const fetchSummary = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/summary?filter_preset=${preset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token, preset]);

  const handleCsvDownload = () => {
    const url = `/api/reports/export/csv?filter_preset=${preset}&token=${token}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Expense_Report_${preset}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => console.error(err));
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrCode = async () => {
    try {
      const res = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`);
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Expenix_Report_QR_${preset}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Error downloading QR code image:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 dark:text-slate-100 print:bg-white print:text-black">
      
      {/* Settings bar */}
      <div className="p-6 rounded-3xl glass-card flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h4 className="font-bold text-base">Financial Report Repository</h4>
          <p className="text-slate-400 text-xs">Generate audits and export files in multiple dimensions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold cursor-pointer"
          >
            <option value="month">Monthly Report</option>
            <option value="quarter">Quarterly Report</option>
            <option value="year">Yearly Report</option>
          </select>

          <button
            onClick={handleCsvDownload}
            className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            title="Download CSV"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          <button
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            title="Generate Shareable QR Code"
          >
            <QrCode className="h-4 w-4" /> Generate QR Code
          </button>
          
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Print PDF Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center print:hidden">
          <div className="h-8 w-8 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
        </div>
      ) : !summary ? (
        <div className="py-20 text-center text-slate-400 text-xs print:hidden">Could not retrieve summaries.</div>
      ) : (
        <div className="flex flex-col gap-6 print:gap-4 print:p-8">
          
          {/* Print specific header */}
          <div className="hidden print:flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Expenix Ledger Audit</h2>
              <p className="text-xs text-slate-500">Target Range: {new Date(summary.start_date).toLocaleDateString()} to {new Date(summary.end_date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Financial Summary Report</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Scan to download/view live</span>
              </div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(shareUrl)}`} 
                alt="Report QR Link"
                className="h-14 w-14 border rounded bg-white p-0.5"
              />
            </div>
          </div>

          {/* Aggregates row */}
          <div className="grid grid-cols-3 gap-6 print:border-y print:py-4">
            <div className="p-6 rounded-3xl glass-card print:border-none print:shadow-none print:p-0">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Aggregate spent</span>
              <h3 className="text-2xl font-extrabold mt-1">₹{summary.total_spent.toLocaleString()}</h3>
            </div>
            
            <div className="p-6 rounded-3xl glass-card print:border-none print:shadow-none print:p-0">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Growth Rate</span>
              <h3 className={`text-2xl font-extrabold mt-1 ${
                summary.growth_rate > 0 ? 'text-red-500' : 'text-brand-emerald'
              }`}>
                {summary.growth_rate > 0 ? `+${summary.growth_rate}%` : `${summary.growth_rate}%`}
              </h3>
            </div>

            <div className="p-6 rounded-3xl glass-card print:border-none print:shadow-none print:p-0">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Transaction Count</span>
              <h3 className="text-2xl font-extrabold mt-1">{summary.expense_count} records</h3>
            </div>
          </div>

          {/* Table list detail */}
          <div className="p-6 rounded-3xl glass-card print:border-none print:shadow-none print:p-0">
            <h4 className="font-bold text-base mb-4 flex items-center gap-1.5">
              <Table className="h-5 w-5 text-brand-blue print:hidden" />
              <span>Category Expenditure breakdown</span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3">Category Name</th>
                    <th className="pb-3 text-right">Total Outgo</th>
                    <th className="pb-3 text-right">Percentage Proportion</th>
                    <th className="pb-3 text-right">Spend Cap</th>
                    <th className="pb-3 text-right">Utilization Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                  {summary.category_distribution.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">{cat.category_name}</td>
                      <td className="py-3 font-extrabold text-right">₹{cat.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{cat.percentage}%</td>
                      <td className="py-3 font-bold text-slate-650 dark:text-slate-350 text-right">
                        {cat.budget_limit > 0 ? `₹${cat.budget_limit.toLocaleString()}` : '--'}
                      </td>
                      <td className={`py-3 font-bold text-right ${
                        cat.budget_utilization >= 100 ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {cat.budget_limit > 0 ? `${cat.budget_utilization}%` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {/* SHARE / QR CODE DIALOG */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300 text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-850">
              <h3 className="font-bold text-base">Share Report QR Code</h3>
              <button 
                onClick={() => setQrModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">
              <div className="bg-white p-3 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center justify-center">
                <img 
                  src={qrCodeImageUrl} 
                  alt="Report QR Code"
                  className="h-44 w-44"
                />
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Expenix Audit Share Link</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                  Anyone scanning this QR code from their mobile device can view or download this report.
                </p>
              </div>

              {/* Share url copy group */}
              <div className="flex items-center gap-2 w-full bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-150 dark:border-slate-750">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-ellipsis truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-350 hover:text-brand-blue transition-colors cursor-pointer"
                  title="Copy share link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Download actions */}
              <div className="grid grid-cols-2 gap-3 w-full border-t border-slate-100 dark:border-slate-850 pt-4">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-350 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQrCode}
                  className="px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-colors cursor-pointer"
                >
                  Download QR
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default Reports;
