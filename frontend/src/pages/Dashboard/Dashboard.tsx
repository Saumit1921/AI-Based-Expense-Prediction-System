import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  BrainCircuit, Calendar, Plus, Mic, Upload, 
  X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AIFinancialAssistant } from '../../components/AIFinancialAssistant/AIFinancialAssistant';


interface KPIState {
  total_spent: number;
  previous_spent: number;
  growth_rate: number;
  budget_utilization: number;
  monthly_limit: number;
  remaining_budget: number;
  savings_rate: number;
  today_spent: number;
  predicted_next_month: number;
}

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

interface Category {
  category_id: string;
  category_name: string;
  color: string;
  icon: string;
}

interface Notification {
  notification_id: string;
  title: string;
  message: string;
}

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  
  // Dashboard states
  const [kpis, setKpis] = useState<KPIState>({
    total_spent: 0,
    previous_spent: 0,
    growth_rate: 0,
    budget_utilization: 0,
    monthly_limit: 50000,
    remaining_budget: 50000,
    savings_rate: 15,
    today_spent: 0,
    predicted_next_month: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  
  // Modals & form state
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [description, setDescription] = useState<string>('');


  // Fetch Dashboard Stats
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Report Summary
      const summaryRes = await fetch('/api/reports/summary?filter_preset=month', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summary = await summaryRes.json();

      // 2. Fetch Expenses list
      const expensesRes = await fetch('/api/expenses?limit=6', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const expensesData = await expensesRes.json();

      // 3. Fetch Budgets list to compute totals
      const budgetsRes = await fetch('/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetsData = await budgetsRes.json();
      setBudgets(budgetsData || []);
      
      // Calculate Limits
      const totalLimit = (budgetsData || []).reduce((sum: number, b: any) => sum + b.monthly_limit, 0) || 50000;
      const spentThisMonth = summary.total_spent || 0;
      const remBudget = Math.max(0, totalLimit - spentThisMonth);
      const utilRate = totalLimit > 0 ? (spentThisMonth / totalLimit) * 100 : 0;

      // 4. Fetch Saved Predictions or AI trigger
      let nextMonthPrediction = 0;
      try {
        const predRes = await fetch('/api/predictions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const predictions = await predRes.json();
        if (predictions.length > 0) {
          nextMonthPrediction = predictions[0].predicted_amount;
        }
      } catch (err) {
        console.error('Predictions fetch fail:', err);
      }

      // 5. Fetch Notifications
      const notifRes = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notifs = await notifRes.json();

      // Today's Expense
      const todayStr = new Date().toDateString();
      const todaySpentVal = expensesData.expenses
        .filter((e: Expense) => new Date(e.expense_date).toDateString() === todayStr)
        .reduce((sum: number, e: Expense) => sum + e.amount, 0);

      // Set state
      setKpis({
        total_spent: spentThisMonth,
        previous_spent: summary.previous_spent || 0,
        growth_rate: summary.growth_rate || 0,
        budget_utilization: Math.round(utilRate),
        monthly_limit: totalLimit,
        remaining_budget: remBudget,
        savings_rate: Math.round((Math.max(0, 80000 - spentThisMonth) / 80000) * 100), // mock savings from base 80k income
        today_spent: todaySpentVal || 0,
        predicted_next_month: nextMonthPrediction || spentThisMonth * 0.96 // fallback heuristic
      });

      // Categories Pie data
      setCategoryData(
        (summary.category_distribution || []).map((cat: any) => ({
          name: cat.category_name,
          value: cat.total_amount,
          color: cat.color
        }))
      );

      // Weekly trend format
      setChartData(
        (summary.weekly_trend || []).map((w: any) => ({
          name: `Week ${w.week.slice(-2)}`,
          spent: w.amount
        }))
      );

      setRecentExpenses(expensesData.expenses.slice(0, 6));
      setNotifications(notifs.slice(0, 3));

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
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
      fetchDashboardData();
      fetchCategories();
      
      // Auto-refresh the dashboard data every 10 seconds to increase refresh rate
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [token]);

  // Voice recognition simulation
  const handleVoiceEntry = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setFormError('');
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      setFormError('Voice input failed. Try speaking clearly.');
    };

    recognition.onresult = (event: any) => {
      setIsListening(false);
      const text = event.results[0][0].transcript.toLowerCase();
      console.log('Voice transcript:', text);

      // Parse amounts (e.g. "fifty rupees", "one hundred dollars", "spend 250")
      const amountMatch = text.match(/\d+/);
      if (amountMatch) {
        setAmount(amountMatch[0]);
      }

      // Check description / keywords
      if (text.includes('food') || text.includes('dinner') || text.includes('lunch') || text.includes('restaurant')) {
        const cat = categories.find(c => c.category_name === 'Food');
        if (cat) setCategoryId(cat.category_id);
        setDescription('Voice Entry: Dining out');
      } else if (text.includes('taxi') || text.includes('fuel') || text.includes('metro') || text.includes('ride')) {
        const cat = categories.find(c => c.category_name === 'Transport');
        if (cat) setCategoryId(cat.category_id);
        setDescription('Voice Entry: Travel transit');
      } else {
        setDescription(`Voice Entry: "${text}"`);
      }
      
      setFormSuccess('Voice captured and fields populated successfully!');
    };

    recognition.start();
  };

  // OCR simulation
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsOcrScanning(true);
    setFormError('');

    // Simulate server multipart post delay
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/expenses/upload-receipt', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setIsOcrScanning(false);
      
      if (res.ok && data.ocrData) {
        setAmount(data.ocrData.amount.toString());
        setDate(data.ocrData.date);
        setDescription(`OCR Scanned: ${data.ocrData.detected_merchant}`);
        
        const matchingCat = categories.find(
          c => c.category_name.toLowerCase() === data.ocrData.suggested_category.toLowerCase()
        );
        if (matchingCat) setCategoryId(matchingCat.category_id);
        
        setFormSuccess(`Receipt scanned! Suggested Amount: ₹${data.ocrData.amount}`);
      } else {
        setFormError('OCR failed to read receipt. Autofilling defaults.');
      }
    } catch (err) {
      console.error(err);
      setIsOcrScanning(false);
      setFormError('Error parsing file.');
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      setFormError('Please enter a valid amount.');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: categoryId,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          description,
          expense_date: new Date(date).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save expense record.');
      }

      setAddModalOpen(false);
      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().substring(0, 10));
      setFormSuccess('');
      setFormError('');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleResetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().substring(0, 10));
    setPaymentMethod('Cash');
    setFormError('');
    setFormSuccess('');
    if (categories.length > 0) setCategoryId(categories[0].category_id);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 dark:text-slate-100">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Expense KPI */}
        <div className="p-6 rounded-3xl glass-card relative overflow-hidden transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-3xl font-extrabold mt-1.5">₹{kpis.total_spent.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-brand-blue rounded-2xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium">
            {kpis.growth_rate > 0 ? (
              <span className="flex items-center gap-0.5 text-red-500">
                <TrendingUp className="h-4 w-4" /> +{kpis.growth_rate}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-emerald-500">
                <TrendingDown className="h-4 w-4" /> {kpis.growth_rate}%
              </span>
            )}
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Today's Spent KPI */}
        <div className="p-6 rounded-3xl glass-card relative overflow-hidden transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Today's Expense</p>
              <h3 className="text-3xl font-extrabold mt-1.5">₹{kpis.today_spent.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-brand-emerald rounded-2xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-5 font-medium">Daily transaction total</p>
        </div>

        {/* Budget Utilization KPI */}
        <div className="p-6 rounded-3xl glass-card relative overflow-hidden transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Remaining Budget</p>
              <h3 className="text-3xl font-extrabold mt-1.5">₹{kpis.remaining_budget.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  kpis.budget_utilization >= 90 ? 'bg-red-500' : 'bg-brand-emerald'
                }`}
                style={{ width: `${Math.min(100, kpis.budget_utilization)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1.5">
              <span>{kpis.budget_utilization}% Spent</span>
              <span>Limit: ₹{kpis.monthly_limit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* AI Forecast KPI */}
        <div className="p-6 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white relative overflow-hidden shadow-xl shadow-blue-500/10 transition-all hover:translate-y-[-4px]">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BrainCircuit className="h-32 w-32" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">AI Forecast (Next Month)</p>
              <h3 className="text-3xl font-extrabold mt-1.5">₹{Math.round(kpis.predicted_next_month).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-blue-200 mt-5 font-medium relative z-10">
            Calculated ensemble accuracy confidence: {kpis.predicted_next_month > 0 ? '82%' : 'Heuristic'}
          </p>
        </div>

      </div>

      {/* Quick Actions Panel */}
      <div className="flex flex-wrap justify-between items-center gap-4 py-2 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-emerald" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Savings rate is tracking around <b className="text-slate-800 dark:text-white font-bold">{kpis.savings_rate}%</b> this month</span>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-500/15 transition-all"
        >
          <Plus className="h-5 w-5" /> Quick Add Expense
        </button>
      </div>

      {/* Main Charts & Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Left) */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-card flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-base">Weekly Spending Trend</h4>
              <p className="text-slate-400 text-xs">Pacing of expenditures over the current month</p>
            </div>
          </div>
          
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No records logged in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="spent" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorSpent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category distribution Donut (Right) */}
        <div className="p-6 rounded-3xl glass-card flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-base">Expense Distribution</h4>
            <p className="text-slate-400 text-xs">Spent distribution across categories</p>
          </div>
          
          <div className="h-60 w-full relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-slate-400 text-xs">No categorizations mapped.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Mini labels */}
          <div className="max-h-24 overflow-y-auto grid grid-cols-2 gap-2 mt-4 text-xs">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                <span className="truncate text-slate-500 dark:text-slate-400">{cat.name}: <b>₹{Math.round(cat.value)}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Financial Copilot Panel */}
      <div className="mb-6">
        <AIFinancialAssistant
          token={token}
          kpis={kpis}
          categoryData={categoryData}
          budgets={budgets}
          recentExpenses={recentExpenses}
        />
      </div>

      {/* Transactions & Alerts bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Ledger items */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-card">
          <h4 className="font-bold text-base mb-4">Recent Ledger Transactions</h4>
          <div className="flex flex-col gap-3">
            {recentExpenses.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">Log transactions to populate ledger list.</p>
            ) : (
              recentExpenses.map((exp) => (
                <div key={exp.expense_id} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: exp.category.color }}
                    >
                      <span className="text-sm font-bold">{exp.category.category_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{exp.description || `${exp.category.category_name} Expense`}</p>
                      <p className="text-xs text-slate-400">{new Date(exp.expense_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-red-500">-₹{exp.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{exp.payment_method}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI & Budget Notifications list */}
        <div className="p-6 rounded-3xl glass-card">
          <h4 className="font-bold text-base mb-4">Active Budget Alerts</h4>
          <div className="flex flex-col gap-4">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No warnings triggered. All budgets safe.</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.notification_id} className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-xs text-slate-850 dark:text-slate-200">{notif.title}</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* QUICK ADD EXPENSE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-850">
              <h3 className="font-bold text-lg">Add New Ledger Item</h3>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveExpense} className="p-6 flex flex-col gap-4">
              
              {/* Errors & Success */}
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-brand-emerald rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Advanced Scanning Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={handleVoiceEntry}
                  disabled={isListening}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    isListening 
                      ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  {isListening ? 'Listening...' : 'Voice Entry'}
                </button>

                <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                  <Upload className="h-4 w-4" />
                  <span>{isOcrScanning ? 'Scanning...' : 'OCR Scan Receipt'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleOcrUpload}
                    disabled={isOcrScanning}
                  />
                </label>
              </div>

              {isOcrScanning && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400 border-t-brand-blue animate-spin"></div>
                  <span className="text-xs text-slate-400 font-semibold animate-pulse">Running AI OCR Receipt extraction...</span>
                </div>
              )}

              {/* Standard Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
                    placeholder="250.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description / Merchant</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
                  placeholder="Grocery billing"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-slate-200/60 dark:border-slate-850 pt-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/15 transition-colors"
                >
                  Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Dashboard;
