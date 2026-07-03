import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, token } = useAuth();
  
  // States for password reset
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Incorrect password.');
      }

      setSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-850 dark:text-slate-100">
      
      {/* Account Info details */}
      <div className="p-6 rounded-3xl glass-card flex flex-col items-center text-center">
        <div className="h-20 w-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center font-bold text-2xl mb-4 border border-brand-blue/20">
          {user?.full_name.charAt(0).toUpperCase()}
        </div>
        
        <h4 className="font-extrabold text-base leading-none mb-1.5">{user?.full_name}</h4>
        <p className="text-slate-400 text-xs">{user?.email}</p>
        
        <div className="w-full border-t border-slate-200/50 dark:border-slate-800/50 mt-6 pt-6 flex flex-col gap-3 text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Account Access Role</span>
            <span className="font-bold uppercase tracking-wider text-brand-emerald">{user?.role}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Identity Tag ID</span>
            <span className="font-mono text-[10px] text-slate-500 truncate w-32 text-right">{user?.user_id}</span>
          </div>
        </div>
      </div>

      {/* Password reset panel */}
      <div className="lg:col-span-2 p-6 rounded-3xl glass-card">
        <h4 className="font-bold text-base mb-6 flex items-center gap-1.5"><KeyRound className="h-5 w-5 text-brand-blue" /> Access Authorization Management</h4>
        
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-md">
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
            <label className="block text-xs font-semibold text-slate-400 mb-1">Current Account Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">New Password Requirement</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-brand-blue outline-none text-sm transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-fit py-3 px-6 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-colors mt-2 text-xs"
          >
            {submitting ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
};
export default Profile;
