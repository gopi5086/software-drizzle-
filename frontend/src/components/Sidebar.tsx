import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  Hotel,
  PlusCircle,
  LogOut,
  ClipboardList,
  HelpCircle,
  TrendingUp,
  Phone,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import LocationPickerModal from './LocationPickerModal';

interface SidebarProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ expanded, onExpandChange, mobileOpen = false, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'staff'] },
    { label: 'Enquiries', icon: HelpCircle, path: '/enquiries', roles: ['admin', 'staff'] },
    { label: 'Reservations', icon: CalendarDays, path: '/reservations', roles: ['admin', 'staff'] },
    { label: 'Record', icon: ClipboardList, path: '/record', roles: ['admin', 'staff'] },
    { label: 'Guest Lookup', icon: Phone, path: '/guest-lookup', roles: ['admin', 'staff'] },
    { label: 'Customers', icon: Users, path: '/customers', roles: ['admin'] },
    { label: 'Staff', icon: UserCheck, path: '/staff', roles: ['admin'] },
    { label: 'Revenue', icon: TrendingUp, path: '/staff-revenue', roles: ['admin', 'staff'] },
    { label: 'Finance', icon: Wallet, path: '/finance', roles: ['admin'] },
    { label: 'Invoices', icon: Receipt, path: '/invoices', roles: ['admin', 'staff'] },
    { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin'] },
    { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
  ];

  // Safe normalized role - fallback to 'admin' if user or user.role is not populated
  const currentRole = (user?.role || 'admin').toLowerCase();
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => r.toLowerCase() === currentRole);
  });

  return (<>
    {/* Mobile Backdrop */}
    {mobileOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        onClick={onMobileClose}
      />
    )}

    <aside
      className={`fixed left-0 top-0 h-full bg-deep-charcoal border-r border-soft-slate/20 flex flex-col py-5 md:py-8 z-50 transition-all duration-300 overflow-y-auto scrollbar-hide
        ${mobileOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full md:translate-x-0'}
        ${expanded ? 'md:w-[260px]' : 'md:w-[72px]'}
      `}
      onMouseEnter={() => onExpandChange(true)}
      onMouseLeave={() => onExpandChange(false)}
      onTouchStart={() => onExpandChange(true)}
    >
      <div className={`px-4 mb-6 shrink-0 flex items-center justify-between ${expanded || mobileOpen ? 'justify-between' : 'md:justify-center'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-elegant-gold rounded-lg flex items-center justify-center text-deep-charcoal shrink-0 shadow-md">
            <Hotel className="w-6 h-6" />
          </div>
          <div className={`transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
            <h1 className="font-bold text-xl text-elegant-gold leading-none whitespace-nowrap">DrizzleDropInn</h1>
            <p className="text-[10px] uppercase tracking-widest text-soft-slate mt-1 whitespace-nowrap">Premium Management</p>
          </div>
        </div>
        {mobileOpen && (
          <button 
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto scrollbar-hide">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onMobileClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${expanded || mobileOpen ? 'justify-start' : 'justify-center'} ${isActive
                ? 'text-elegant-gold border-l-4 border-elegant-gold bg-elegant-gold/10 font-bold'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className={`font-medium text-sm transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 mt-auto space-y-3 pt-4 shrink-0 pb-2">
        <button
          onClick={() => {
            onMobileClose?.();
            setShowLocationModal(true);
          }}
          className="w-full py-3.5 px-3 bg-elegant-gold text-deep-charcoal font-bold text-sm rounded-xl flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-elegant-gold/20 justify-center"
        >
          <PlusCircle className="w-5 h-5 flex-shrink-0" />
          <span className={`transition-all duration-300 truncate ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Quotation for Enquiry</span>
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
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white transition-colors border-t border-white/5 pt-3 ${expanded || mobileOpen ? 'justify-start' : 'justify-center'}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={`font-medium text-sm transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Logout</span>
        </button>
      </div>
    </aside>

    <LocationPickerModal
      isOpen={showLocationModal}
      onClose={() => setShowLocationModal(false)}
    />
  </>);
};

export default Sidebar;
