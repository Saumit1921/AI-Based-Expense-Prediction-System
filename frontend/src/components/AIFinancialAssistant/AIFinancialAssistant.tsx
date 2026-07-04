import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, 
  ArrowRight, ShieldCheck, Calendar, Activity, Zap, Sparkles, Award
} from 'lucide-react';

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

interface Budget {
  budget_id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  category: {
    category_id: string;
    category_name: string;
  };
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
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

interface AIFinancialAssistantProps {
  token: string | null;
  kpis: KPIState;
  categoryData: CategoryData[];
  budgets: Budget[];
  recentExpenses: Expense[];
}

export const AIFinancialAssistant: React.FC<AIFinancialAssistantProps> = ({
  token,
  kpis,
  categoryData,
  budgets,
  recentExpenses
}) => {
  // Local state for all expenses of the current month
  const [allMonthlyExpenses, setAllMonthlyExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulator state: reduction percentages (0 - 100%)
  const [reductions, setReductions] = useState<{ [categoryName: string]: number }>({});

  // Fetch all monthly expenses for advanced calculations
  const fetchMonthlyExpenses = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/expenses?filter_preset=month&limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllMonthlyExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching monthly expenses for AI assistant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMonthlyExpenses();
    }
  }, [token, recentExpenses]); // refresh when user adds/deletes expenses

  // --- 1. FINANCIAL HEALTH SCORE ALGORITHM ---
  const calculateHealthScore = (simulatedReductions: { [key: string]: number } = {}) => {
    let score = 100;
    const reasons: string[] = [];

    // Calculate simulated savings
    let simulatedSavings = 0;
    categoryData.forEach(cat => {
      const reduction = simulatedReductions[cat.name] || 0;
      if (reduction > 0) {
        simulatedSavings += cat.value * (reduction / 100);
      }
    });

    const activeSpent = Math.max(0, kpis.total_spent - simulatedSavings);
    const limit = kpis.monthly_limit;

    // Over budget limit check
    if (limit > 0) {
      const utilization = (activeSpent / limit) * 100;
      if (utilization > 100) {
        score -= 30;
        reasons.push(`Total monthly budget exceeded by ${(utilization - 100).toFixed(0)}%.`);
      } else if (utilization > 85) {
        score -= 15;
        reasons.push(`Total budget utilization is high (${utilization.toFixed(0)}%).`);
      }
    }

    // Category specific budget check
    budgets.forEach(b => {
      const catName = b.category.category_name;
      const catLimit = b.monthly_limit;
      const catSpentRaw = categoryData.find(c => c.name === catName)?.value || 0;
      const reductionPercent = simulatedReductions[catName] || 0;
      const catSpent = Math.max(0, catSpentRaw * (1 - reductionPercent / 100));

      if (catLimit > 0 && catSpent > catLimit) {
        score -= 8;
        reasons.push(`Category budget exceeded: ${catName} (Spent: ₹${catSpent.toFixed(0)} / Limit: ₹${catLimit.toFixed(0)}).`);
      }
    });

    // Savings rate check
    // If savings rate is low (mock calculation relative to average base income)
    const projectedSavingsRate = Math.round((Math.max(0, 80000 - activeSpent) / 80000) * 100);
    if (projectedSavingsRate < 10) {
      score -= 15;
      reasons.push(`Projected savings rate is critical (${projectedSavingsRate}%). Try saving more.`);
    } else if (projectedSavingsRate < 20) {
      score -= 5;
      reasons.push(`Projected savings rate is fair (${projectedSavingsRate}%). Target is 20%+`);
    }

    // Pacing / Growth check
    if (kpis.growth_rate > 5) {
      const growthPenalty = Math.min(15, Math.round(kpis.growth_rate));
      score -= growthPenalty;
      reasons.push(`Spending velocity has paced up by ${kpis.growth_rate.toFixed(0)}% compared to last month.`);
    }

    const finalScore = Math.max(0, Math.min(100, score));
    
    let rating = 'Critical';
    let ratingColor = 'text-red-500';
    let ringColor = '#EF4444';
    if (finalScore >= 80) {
      rating = 'Excellent';
      ratingColor = 'text-emerald-500';
      ringColor = '#10B981';
    } else if (finalScore >= 60) {
      rating = 'Fair';
      ratingColor = 'text-amber-500';
      ringColor = '#F59E0B';
    }

    return {
      score: finalScore,
      rating,
      ratingColor,
      ringColor,
      reasons: reasons.length > 0 ? reasons : ['Your financial outlays are fully optimized! Keep it up.']
    };
  };

  const health = calculateHealthScore(reductions);
  const currentHealth = calculateHealthScore({}); // base health score without simulator

  // --- 2. DAILY SAFE SPENDING LIMIT ---
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, lastDay - today.getDate());
  const dailySafeLimit = Math.max(0, kpis.remaining_budget / remainingDays);
  const dailyLimitUtilization = dailySafeLimit > 0 ? Math.min(100, (kpis.today_spent / dailySafeLimit) * 100) : 100;

  // --- 3. WEEKLY SAVINGS CHALLENGE ---
  // We'll target the category with the highest spend (excluding "Rent" or "Salary")
  const getChallengeCategory = () => {
    const sorted = [...categoryData]
      .filter(c => c.name !== 'Rent' && c.name !== 'Salary' && c.value > 0)
      .sort((a, b) => b.value - a.value);
    return sorted.length > 0 ? sorted[0].name : 'Food';
  };

  const challengeCategory = getChallengeCategory();
  // Get start of the current week (Monday)
  const getMondayOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const startOfWeek = getMondayOfCurrentWeek();
  const weeklySpendInChallengeCategory = allMonthlyExpenses
    .filter(e => e.category.category_name === challengeCategory && new Date(e.expense_date) >= startOfWeek)
    .reduce((sum, e) => sum + e.amount, 0);

  // Challenge limit: 80% of average weekly limit or set custom weekly target
  const catBudgetLimit = budgets.find(b => b.category.category_name === challengeCategory)?.monthly_limit || 10000;
  const weeklyChallengeTarget = Math.round((catBudgetLimit / 4) * 0.85); // 85% of standard weekly budget share
  const challengeProgress = weeklyChallengeTarget > 0 ? Math.min(100, (weeklySpendInChallengeCategory / weeklyChallengeTarget) * 100) : 0;
  const isChallengeFailed = weeklySpendInChallengeCategory > weeklyChallengeTarget;

  // --- 4. UPCOMING BILL REMINDERS ---
  const checkBillStatus = (billName: string, keywords: string[]) => {
    const found = allMonthlyExpenses.some(e => {
      const desc = (e.description || '').toLowerCase();
      const cat = e.category.category_name.toLowerCase();
      return keywords.some(k => desc.includes(k) || cat.includes(k));
    });
    return found;
  };

  const billsList = [
    { name: 'Rent', due: '1st of month', amount: 16000, keywords: ['rent', 'room rent', 'house rent'], paid: checkBillStatus('Rent', ['rent']) },
    { name: 'Electricity Bill', due: '10th of month', amount: 2800, keywords: ['electric', 'electricity', 'power bill', 'energy'], paid: checkBillStatus('Electricity', ['electric', 'power']) },
    { name: 'Internet / Wifi', due: '15th of month', amount: 999, keywords: ['internet', 'wifi', 'broadband', 'act fibernet', 'jiofiber'], paid: checkBillStatus('Internet', ['wifi', 'internet', 'broadband', 'fibernet']) }
  ];

  // --- 5. SMART ADVISORY INSIGHTS ---
  const generateInsights = () => {
    const insights: string[] = [];

    // Credit Card vs UPI
    const creditCardSpent = allMonthlyExpenses
      .filter(e => e.payment_method === 'Credit Card')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalSpent = kpis.total_spent;
    if (totalSpent > 0 && (creditCardSpent / totalSpent) > 0.5) {
      insights.push('Credit Card purchases constitute over 50% of your total outlays. Studies suggest credit limits lead to impulse buying. Try switching to UPI/Debit cards to curb expenditures.');
    }

    // Remaining days pacing
    if (kpis.monthly_limit > 0) {
      const dailyAverageLimit = kpis.monthly_limit / 30;
      const daysPassed = Math.max(1, today.getDate());
      const expectedSpent = dailyAverageLimit * daysPassed;
      if (kpis.total_spent > expectedSpent * 1.15) {
        insights.push(`Your spending is running ${Math.round((kpis.total_spent / expectedSpent - 1) * 100)}% ahead of the standard monthly pace. Consider locking custom category thresholds for the next 10 days.`);
      }
    }

    // High single category
    const sortedCats = [...categoryData].sort((a, b) => b.value - a.value);
    if (sortedCats.length > 0 && totalSpent > 0) {
      const topCat = sortedCats[0];
      const ratio = (topCat.value / totalSpent) * 100;
      if (ratio > 40 && topCat.name !== 'Rent') {
        insights.push(`Outlays in the "${topCat.name}" category are high, making up ${ratio.toFixed(0)}% of your total spend. Adjust the simulator below to project potential savings by trimming this area.`);
      }
    }

    if (insights.length === 0) {
      insights.push('Your daily expenses are in line with budget boundaries. Smart Copilot recommends maintaining this velocity to save approximately ₹12,000 this quarter.');
    }

    return insights;
  };

  const insights = generateInsights();

  // --- 6. SIMULATOR CALCULATIONS ---
  const handleSliderChange = (catName: string, value: number) => {
    setReductions(prev => ({
      ...prev,
      [catName]: value
    }));
  };

  // Compute overall savings in simulator
  let totalSimulatedMonthlySavings = 0;
  categoryData.forEach(cat => {
    const reduction = reductions[cat.name] || 0;
    totalSimulatedMonthlySavings += cat.value * (reduction / 100);
  });

  return (
    <div className="w-full flex flex-col gap-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300">
      
      {/* Copilot Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-brand-blue">
            <BrainCircuit className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Expenix AI Financial Copilot</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-bold text-brand-blue uppercase tracking-wider">Active</span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Real-time analytical audits and simulated saving estimators.</p>
          </div>
        </div>
        
        {/* Daily safe limit quick metrics */}
        <div className="flex items-center gap-6 bg-slate-950/40 border border-slate-850 p-3 rounded-2xl">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Daily Safe Limit</span>
            <span className="text-sm font-extrabold text-white mt-1 block">₹{Math.round(dailySafeLimit).toLocaleString()}</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Spent Today</span>
            <span className={`text-sm font-extrabold mt-1 block ${kpis.today_spent > dailySafeLimit ? 'text-red-500' : 'text-emerald-500'}`}>
              ₹{kpis.today_spent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: FINANCIAL HEALTH SCORE & DAILY SAFE LIMIT */}
        <div className="flex flex-col gap-6">
          
          {/* Health Score Circular Dial */}
          <div className="p-5 rounded-2xl bg-slate-950/20 border border-slate-850 flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-xs font-bold text-slate-400">Financial Health Score</span>
              <Activity className="h-4 w-4 text-brand-blue" />
            </div>
            
            {/* SVG Ring */}
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="absolute transform -rotate-90" width="128" height="128">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="rgba(30, 41, 59, 0.5)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke={health.ringColor}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - health.score / 100)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-black text-white">{health.score}</span>
                <span className={`text-[10px] font-bold block uppercase tracking-wider mt-0.5 ${health.ratingColor}`}>
                  {health.rating}
                </span>
              </div>
            </div>
            
            {/* Health indicators */}
            <div className="w-full text-left mt-5 border-t border-slate-900 pt-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Health Impact Factors:</span>
              <div className="flex flex-col gap-2 max-h-24 overflow-y-auto pr-1">
                {currentHealth.reasons.map((reason, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-[11px] text-slate-400 leading-snug">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700 mt-1.5 flex-shrink-0"></span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Limit Utilization Meter */}
          <div className="p-5 rounded-2xl bg-slate-950/20 border border-slate-850">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-400">Daily Spending Status</span>
              <Zap className={`h-4 w-4 ${kpis.today_spent > dailySafeLimit ? 'text-red-500 animate-bounce' : 'text-emerald-400'}`} />
            </div>
            <div className="flex justify-between items-end text-xs mb-1">
              <span className="text-slate-500 font-semibold">Today's Pacing</span>
              <span className="text-slate-300 font-bold">{Math.round(dailyLimitUtilization)}% Utilized</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyLimitUtilization > 100 ? 'bg-red-500' : dailyLimitUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${dailyLimitUtilization}%` }}
              ></div>
            </div>
            
            {kpis.today_spent > dailySafeLimit ? (
              <p className="text-[10px] text-red-400 leading-relaxed font-semibold mt-1">
                ⚠️ Safe limit exceeded by ₹{(kpis.today_spent - dailySafeLimit).toFixed(0)}. Lock discretionary outlays for today.
              </p>
            ) : (
              <p className="text-[10px] text-emerald-400 leading-relaxed font-semibold mt-1">
                ✔ Safe limit active. You can spend up to ₹{(dailySafeLimit - kpis.today_spent).toFixed(0)} more today.
              </p>
            )}
          </div>
        </div>

        {/* COLUMN 2: WHAT-IF SAVINGS SIMULATOR */}
        <div className="p-5 rounded-2xl bg-slate-950/20 border border-slate-850 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
              <span className="text-xs font-bold text-slate-400">What-If Savings Simulator</span>
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal mb-4">
              Drag sliders to project monthly and yearly savings by cutting expenses in selected categories. See your projected health score adapt live.
            </p>

            {/* Sliders Container */}
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {categoryData.filter(c => c.name !== 'Salary' && c.name !== 'Rent' && c.value > 0).map(cat => {
                const percent = reductions[cat.name] || 0;
                return (
                  <div key={cat.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>{cat.name}</span>
                      <span className="text-emerald-400">-₹{Math.round(cat.value * (percent / 100)).toLocaleString()} ({percent}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={percent}
                      onChange={(e) => handleSliderChange(cat.name, parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                );
              })}
              {categoryData.filter(c => c.name !== 'Salary' && c.name !== 'Rent' && c.value > 0).length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">Log non-rent expenses to enable simulation.</div>
              )}
            </div>
          </div>

          {/* Simulator Calculations Output */}
          <div className="mt-4 border-t border-slate-900 pt-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850 text-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Monthly Savings</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">₹{Math.round(totalSimulatedMonthlySavings).toLocaleString()}</span>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850 text-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Yearly Savings</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">₹{Math.round(totalSimulatedMonthlySavings * 12).toLocaleString()}</span>
              </div>
            </div>
            {totalSimulatedMonthlySavings > 0 && (
              <div className="text-[10px] text-center font-bold text-brand-blue flex items-center justify-center gap-1.5 mt-2 bg-blue-500/5 py-1.5 rounded-lg border border-blue-500/10">
                <Award className="h-3.5 w-3.5" />
                <span>Simulating Projecting Score: {currentHealth.score} → {health.score} (+{health.score - currentHealth.score})</span>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: WEEKLY CHALLENGE & BILL REMINDERS */}
        <div className="flex flex-col gap-6">
          
          {/* Weekly Savings Challenge */}
          <div className="p-5 rounded-2xl bg-slate-950/20 border border-slate-850">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-400">Weekly Savings Challenge</span>
              <Award className="h-4 w-4 text-brand-blue animate-pulse" />
            </div>
            
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-2">
              <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest block">Active Challenge</span>
              <p className="text-xs text-slate-200 font-bold">
                Keep weekly <span className="text-brand-emerald">{challengeCategory}</span> spend below ₹{weeklyChallengeTarget.toLocaleString()}
              </p>
              
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Spent: ₹{Math.round(weeklySpendInChallengeCategory).toLocaleString()}</span>
                <span>Limit: ₹{weeklyChallengeTarget.toLocaleString()}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isChallengeFailed ? 'bg-red-500' : challengeProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${challengeProgress}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  isChallengeFailed ? 'text-red-500' : 'text-emerald-500'
                }`}>
                  {isChallengeFailed ? 'Challenge Failed' : challengeProgress > 80 ? 'Approaching Limit' : 'On Track'}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold">Ends Sunday</span>
              </div>
            </div>
          </div>

          {/* Upcoming Bill Reminders */}
          <div className="p-5 rounded-2xl bg-slate-950/20 border border-slate-850 flex-grow">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-400">Upcoming Bill Reminders</span>
              <Calendar className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex flex-col gap-3">
              {billsList.map((bill, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div className="flex gap-2.5 items-center">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      bill.paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{bill.name}</span>
                      <span className="text-[9px] text-slate-500 block">Due: {bill.due}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-300 block">₹{bill.amount.toLocaleString()}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                      bill.paid ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {bill.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM ROW: PERSONALIZED INSIGHTS & AI SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-800/80 pt-6">
        
        {/* Personalized insights */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Smart Financial Insights</span>
          <div className="flex flex-col gap-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3 text-xs leading-relaxed text-slate-300">
                <BrainCircuit className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI summary executive brief */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Executive Brief</span>
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs leading-relaxed text-slate-300">
            <span className="text-[10px] font-black text-brand-emerald uppercase tracking-widest block mb-2">Monthly Status Summary</span>
            <p>
              Expenix Copilot has audited ₹{kpis.total_spent.toLocaleString()} of total outlays against ₹{kpis.monthly_limit.toLocaleString()} in ceilings. 
              Based on spending velocity, your projected savings rate is {Math.round((Math.max(0, 80000 - kpis.total_spent) / 80000) * 100)}%. 
              We forecast your end-of-month spent at ₹{Math.round(kpis.predicted_next_month).toLocaleString()}. 
              Adjust the <b>Savings Simulator</b> to optimize targets and secure higher health indexes.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
export default AIFinancialAssistant;
