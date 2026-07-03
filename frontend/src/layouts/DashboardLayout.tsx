import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Navbar } from '../components/Navbar/Navbar';

export const DashboardLayout: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
        </div>
      </div>
    );
  }

  // Redirect to Landing if not authenticated
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Determine Title based on pathname
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Financial Overview';
      case '/expenses': return 'Expense Ledger';
      case '/budgets': return 'Budget Planner';
      case '/predictions': return 'AI Expense Prediction';
      case '/reports': return 'Report Repository';
      case '/analytics': return 'Spending Analytics';
      case '/admin': return 'System Admin Panel';
      case '/profile': return 'User Profile Settings';
      default: return 'Fintech Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Panel */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={getPageTitle(location.pathname)} 
        />
        
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
