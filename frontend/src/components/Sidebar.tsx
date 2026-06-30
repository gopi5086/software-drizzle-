import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  Hotel,
  PlusCircle,
  LogOut,
  TrendingUp,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'staff'] },
    { label: 'Reservations', icon: CalendarDays, path: '/reservations', roles: ['admin', 'staff'] },
    { label: 'Guest Lookup', icon: Phone, path: '/guest-lookup', roles: ['admin', 'staff'] },
    { label: 'Customers', icon: Users, path: '/customers', roles: ['admin'] },
    { label: 'Staff', icon: Users, path: '/staff', roles: ['admin'] },
    { label: 'Revenue', icon: TrendingUp, path: '/staff-revenue', roles: ['admin', 'staff'] },
    { label: 'Finance', icon: Wallet, path: '/finance', roles: ['admin'] },
    { label: 'Invoices', icon: Receipt, path: '/invoices', roles: ['admin', 'staff'] },
    { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin'] },
    { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-deep-charcoal border-r border-soft-slate/20 flex flex-col py-8 z-50">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-elegant-gold rounded-lg flex items-center justify-center text-deep-charcoal">
          <Hotel className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-elegant-gold leading-none">DrizzleDropInn</h1>
          <p className="text-[10px] uppercase tracking-widest text-soft-slate mt-1">Premium Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
      {menuItems
          .filter(item => item.roles.includes(user?.role ?? ''))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-elegant-gold border-l-4 border-elegant-gold bg-elegant-gold/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="px-4 mt-auto space-y-4">
        <button
          onClick={() => navigate('/create-reservation')}
          className="w-full py-4 bg-elegant-gold text-deep-charcoal font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-elegant-gold/20"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Booking</span>
        </button>

        <button
          onClick={() => {
            toast.promise(new Promise(res => setTimeout(res, 800)), {
              loading: 'Signing out...',
              success: () => {
                logout();
                navigate('/');
                return 'Signed out successfully';
              }
            });
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors border-t border-white/5 pt-6"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
