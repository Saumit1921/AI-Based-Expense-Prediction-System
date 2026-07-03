import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, DollarSign, ShieldAlert, Trash2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

interface UserData {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  _count: {
    expenses: number;
    budgets: number;
  };
}

interface AdminAnalytics {
  total_users: number;
  total_expenses_count: number;
  total_expenses_sum: number;
  total_budgets_count: number;
  total_predictions_count: number;
  user_growth: Array<{ month: string; registrations: number }>;
}

export const Admin: React.FC = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [error, setError] = useState<string>('');

  const fetchAdminDetails = async () => {
    if (!token || user?.role !== 'ADMIN') return;
    setLoading(true);
    try {
      // 1. Fetch Admin analytics
      const analyticsRes = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analyticsData = await analyticsRes.json();

      // 2. Fetch Users lists
      const usersRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      if (analyticsRes.ok && usersRes.ok) {
        setAnalytics(analyticsData);
        setUsers(usersData);
      } else {
        setError('Unauthorized access or server error.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to admin APIs failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDetails();
  }, [token, user]);

  const handleChangeRole = async (id: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Switch this user's access rights to ${nextRole}?`)) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.user_id === id ? { ...u, role: nextRole } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('WARNING: Deleting this user will purge all of their budget records and expense histories. Proceed?')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.user_id !== id));
        if (analytics) {
          setAnalytics({
            ...analytics,
            total_users: analytics.total_users - 1,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 max-w-xl mx-auto mt-12 flex flex-col items-center gap-3">
        <ShieldAlert className="h-10 w-10 animate-bounce" />
        <h3 className="font-bold text-lg">Forbidden Access</h3>
        <p className="text-xs">You do not hold administrative privileges to view system controls.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800 dark:text-slate-100">
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-500 rounded-2xl text-xs flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
        </div>
      ) : !analytics ? (
        <div className="text-center text-slate-400 py-12 text-xs">Analytics data not available.</div>
      ) : (
        <>
          {/* Global platform stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-3xl glass-card">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">System Registered Users</span>
              <h3 className="text-3xl font-extrabold mt-1.5 flex items-center gap-2">
                <Users className="h-6 w-6 text-brand-blue" />
                <span>{analytics.total_users}</span>
              </h3>
            </div>

            <div className="p-6 rounded-3xl glass-card">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Global Spend Logged</span>
              <h3 className="text-3xl font-extrabold mt-1.5 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-brand-emerald" />
                <span>₹{analytics.total_expenses_sum.toLocaleString()}</span>
              </h3>
            </div>

            <div className="p-6 rounded-3xl glass-card">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Expense Entries volume</span>
              <h3 className="text-3xl font-extrabold mt-1.5">
                <span>{analytics.total_expenses_count} items</span>
              </h3>
            </div>

            <div className="p-6 rounded-3xl glass-card">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">AI predictions run</span>
              <h3 className="text-3xl font-extrabold mt-1.5 text-indigo-500">
                <span>{analytics.total_predictions_count}</span>
              </h3>
            </div>

          </div>

          {/* User registration growth Line Chart */}
          <div className="p-6 rounded-3xl glass-card">
            <h4 className="font-bold text-base mb-6">User Registration Growth</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.user_growth}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="registrations" stroke="#2563EB" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Users grid table management */}
          <div className="p-6 rounded-3xl glass-card">
            <h4 className="font-bold text-base mb-4">Manage Platform Users</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">Expenses</th>
                    <th className="pb-3 text-center">Budgets</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                  {users.map((usr) => (
                    <tr key={usr.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">{usr.full_name}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400">{usr.email}</td>
                      <td className="py-4">
                        <button
                          onClick={() => handleChangeRole(usr.user_id, usr.role)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            usr.role === 'ADMIN' 
                              ? 'bg-blue-100 text-brand-blue dark:bg-blue-950 dark:text-blue-400' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450'
                          }`}
                        >
                          {usr.role}
                        </button>
                      </td>
                      <td className="py-4 text-center font-bold">{usr._count.expenses}</td>
                      <td className="py-4 text-center font-bold">{usr._count.budgets}</td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(usr.user_id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          title="Purge user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
export default Admin;
