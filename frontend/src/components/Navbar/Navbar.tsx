import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Sun, Moon, Menu, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
}

interface Notification {
  notification_id: string;
  title: string;
  message: string;
  read_status: boolean;
  created_at: string;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen, title }) => {
  const { token } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);

  useEffect(() => {
    // Dark mode init
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds for a dynamic experience
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read_status).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.notification_id === id ? { ...n, read_status: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 md:hidden"
        >
          <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown menu */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                <span className="font-bold text-slate-800 dark:text-white">Alerts & Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-brand-blue font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-4">No notifications yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.notification_id} 
                      className={`p-3 rounded-xl border transition-colors ${
                        notif.read_status 
                          ? 'bg-transparent border-slate-100 dark:border-slate-800/60' 
                          : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-semibold text-xs text-slate-800 dark:text-white">{notif.title}</span>
                        {!notif.read_status && (
                          <button
                            onClick={() => markAsRead(notif.notification_id)}
                            className="p-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-brand-blue"
                            title="Mark read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 mt-2 block">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link
          to="/profile"
          className="p-1 rounded-xl hover:ring-2 hover:ring-brand-blue/30 transition-all"
        >
          <div className="h-10 w-10 bg-brand-emerald/10 text-brand-emerald dark:bg-brand-emerald/20 dark:text-emerald-400 font-bold rounded-xl flex items-center justify-center">
            P
          </div>
        </Link>
      </div>
    </header>
  );
};
export default Navbar;
