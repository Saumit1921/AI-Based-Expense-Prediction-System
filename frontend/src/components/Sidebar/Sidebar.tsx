import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BrainCircuit, 
  FileBarChart, 
  ShieldAlert, 
  LogOut,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'AI Prediction', path: '/predictions', icon: BrainCircuit },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  ];

  if (user?.role === 'ADMIN') {
    links.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  const activeStyle = "flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-blue text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-300";
  const inactiveStyle = "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200";

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="p-2.5 bg-gradient-to-tr from-brand-blue to-cyan-500 rounded-xl text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg leading-none block bg-gradient-to-r from-brand-blue to-brand-emerald bg-clip-text text-transparent">Expenix</span>
              <span className="text-[9px] text-slate-400 font-semibold leading-normal block">Your Personal Expense Predictor</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                {user?.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate w-32">
                <p className="font-semibold text-sm truncate dark:text-white">{user?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
