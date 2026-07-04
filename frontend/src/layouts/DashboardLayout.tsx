import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Navbar } from '../components/Navbar/Navbar';
import { Sparkles, X, Send, MessageSquareText } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const DashboardLayout: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  // Chatbot states
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Hello! I am your Expenix AI Financial Advisor. Ask me anything about your finances, for example:\n\n* *'Can I afford a laptop for 35000 next month?'*\n* *'How much did I spend on Food?'*\n* *'Give me tips to save money.'*"
    }
  ]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const userText = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await fetch('/api/predictions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I encountered an issue processing your request. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Error communicating with AI Financial Advisor. Ensure python microservice is active.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300 relative">
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

      {/* Floating AI Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="mb-4 w-80 md:w-96 h-[450px] flex flex-col rounded-3xl glass-card border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-emerald animate-pulse"></div>
                <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1">
                  <Sparkles className="h-4.5 w-4.5 text-brand-blue" /> AI Financial Advisor
                </span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Body */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[78%] p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'self-end bg-brand-blue text-white rounded-tr-none shadow-md shadow-blue-500/10' 
                      : 'self-start bg-slate-100 dark:bg-slate-850/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/20 dark:border-slate-800/50 shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {sending && (
                <div className="self-start max-w-[70%] p-3 rounded-2xl bg-slate-100 dark:bg-slate-850/80 text-slate-400 rounded-tl-none border border-slate-250/20 dark:border-slate-800/50 shadow-sm flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-2 bg-slate-50/20 dark:bg-slate-900/20 backdrop-blur-md">
              <input
                type="text"
                placeholder="Ask: 'Can I afford a laptop for 35000?'"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl glass-input outline-none text-slate-800 dark:text-slate-100"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !inputValue.trim()}
                className="p-2 bg-brand-blue hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-blue-500/10"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/10 glow-blue"
          title="Ask AI Advisor"
        >
          {chatOpen ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
        </button>
      </div>

    </div>
  );
};
export default DashboardLayout;
