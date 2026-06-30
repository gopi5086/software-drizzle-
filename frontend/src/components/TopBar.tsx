import { Search, Bell, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopBar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-20 bg-surface-glass backdrop-blur-md border-b border-border-subtle flex justify-between items-center px-10 shadow-sm z-40">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-elegant-gold rounded-lg transition-all bg-background/50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search reservations, guests, or invoices..."
            className="w-full bg-transparent border-none rounded-lg pl-10 py-2 text-sm placeholder:text-soft-slate/50 focus:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-border-subtle pr-6">
          <button className="p-2 text-soft-slate hover:text-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-elegant-gold rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-soft-slate hover:text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {user?.role === 'admin' ? (
          <Link to="/settings" className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{user?.full_name || 'Staff Profile'}</p>
              <p className="text-[10px] text-soft-slate uppercase tracking-wider">{user?.role || 'Hotel Manager'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-elegant-gold">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{user?.full_name || 'Staff Profile'}</p>
              <p className="text-[10px] text-soft-slate uppercase tracking-wider">{user?.role || 'Hotel Manager'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-elegant-gold">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
