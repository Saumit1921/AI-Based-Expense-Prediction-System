import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, BarChart2, PieChart as PieIcon, Activity } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

export const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [preset, setPreset] = useState<string>('month');

  // Chart data states
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  const fetchAnalyticsData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/summary?filter_preset=${preset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        
        // Formulate Weekly data
        setWeeklyTrend(
          (data.weekly_trend || []).map((w: any) => ({
            name: `Week ${w.week.slice(-2)}`,
            amount: w.amount,
          }))
        );

        // Formulate Category data
        setCategoryBreakdown(
          (data.category_distribution || []).map((c: any) => ({
            name: c.category_name,
            amount: c.total_amount,
            color: c.color,
          }))
        );

        // Formulate Payment methods data
        const COLORS = ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B'];
        setPaymentBreakdown(
          (data.payment_distribution || []).map((p: any, idx: number) => ({
            name: p.method,
            value: p.amount,
            color: COLORS[idx % COLORS.length],
          }))
        );

        // Formulate Radar chart comparing limit vs actual
        setRadarData(
          (data.category_distribution || []).map((c: any) => ({
            subject: c.category_name,
            Actual: c.total_amount,
            Budget: c.budget_limit || Math.round(c.total_amount * 0.9), // fallback simulation
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [token, preset]);

  return (
    <div className="flex flex-col gap-6 text-slate-800 dark:text-slate-100">
      
      {/* Settings bar */}
      <div className="p-6 rounded-3xl glass-card flex justify-between items-center">
        <div>
          <h4 className="font-bold text-base">Fintech Visual Analytics</h4>
          <p className="text-slate-400 text-xs font-medium">Contrasting expenditures, payment systems, and ceilings</p>
        </div>
        
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Trend Area chart */}
          <div className="p-6 rounded-3xl glass-card flex flex-col justify-between">
            <h5 className="font-bold text-sm mb-4 flex items-center gap-1.5"><Activity className="h-4 w-4 text-brand-blue" /> Spend Curve</h5>
            <div className="h-64 w-full">
              {weeklyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No records available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={3} fill="rgba(37, 99, 235, 0.05)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Bar chart */}
          <div className="p-6 rounded-3xl glass-card flex flex-col justify-between">
            <h5 className="font-bold text-sm mb-4 flex items-center gap-1.5"><BarChart2 className="h-4 w-4 text-brand-emerald" /> Category Outlays</h5>
            <div className="h-64 w-full">
              {categoryBreakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No records available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Payment Method pie chart */}
          <div className="p-6 rounded-3xl glass-card flex flex-col justify-between">
            <h5 className="font-bold text-sm mb-4 flex items-center gap-1.5"><PieIcon className="h-4 w-4 text-purple-500" /> Payment Methods</h5>
            <div className="h-60 w-full relative flex items-center justify-center">
              {paymentBreakdown.length === 0 ? (
                <div className="text-slate-400 text-xs">No records available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Legend labels */}
            <div className="flex flex-wrap gap-3 justify-center text-xs mt-2">
              {paymentBreakdown.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                  <span className="text-slate-500 dark:text-slate-450">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Radar budget ceiling comparison */}
          <div className="p-6 rounded-3xl glass-card flex flex-col justify-between">
            <h5 className="font-bold text-sm mb-4 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-indigo-500" /> Budget vs Actual Map</h5>
            <div className="h-64 w-full flex items-center justify-center">
              {radarData.length === 0 ? (
                <div className="text-slate-400 text-xs">No enough comparison mappings.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(148, 163, 184, 0.1)" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                    <PolarRadiusAxis stroke="#94a3b8" fontSize={9} />
                    <Radar name="Spent" dataKey="Actual" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                    <Radar name="Budget Ceiling" dataKey="Budget" stroke="#EC4899" fill="#EC4899" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
export default Analytics;
