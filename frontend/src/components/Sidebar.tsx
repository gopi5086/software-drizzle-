import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  Hotel,
  PlusCircle,
  LogOut,
  ClipboardList,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import LocationPickerModal from './LocationPickerModal';

interface SidebarProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ expanded, onExpandChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const sidebarWidth = expanded ? 'w-[260px]' : 'w-[72px]';

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'staff'] },
    { label: 'Enquiries', icon: HelpCircle, path: '/enquiries', roles: ['admin', 'staff'] },
    { label: 'Reservations', icon: CalendarDays, path: '/reservations', roles: ['admin', 'staff'] },
    { label: 'Record', icon: ClipboardList, path: '/record', roles: ['admin', 'staff'] },
    { label: 'Staff', icon: Users, path: '/staff', roles: ['admin'] },
    { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
  ];

  return (<>
    <aside
      className={`fixed left-0 top-0 h-full ${sidebarWidth} bg-deep-charcoal border-r border-soft-slate/20 flex flex-col py-8 z-50 transition-all duration-300 overflow-hidden`}
      onMouseEnter={() => onExpandChange(true)}
      onMouseLeave={() => onExpandChange(false)}
      onTouchStart={() => onExpandChange(true)}
      onClick={() => onExpandChange(!expanded)}
    >
      <div className={`px-3 mb-10 flex items-center gap-3 ${expanded ? 'justify-start' : 'justify-center'}`}>
        <div className="w-10 h-10 bg-elegant-gold rounded-lg flex items-center justify-center text-deep-charcoal shrink-0">
          <Hotel className="w-6 h-6" />
        </div>
        <div className={`transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
          <h1 className="font-bold text-xl text-elegant-gold leading-none whitespace-nowrap">DrizzleDropInn</h1>
          <p className="text-[10px] uppercase tracking-widest text-soft-slate mt-1 whitespace-nowrap">Premium Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
      {menuItems
          .filter(item => item.roles.includes(user?.role ?? ''))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${expanded ? 'justify-start' : 'justify-center'} ${isActive
                  ? 'text-elegant-gold border-l-4 border-elegant-gold bg-elegant-gold/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={`font-medium transition-all duration-300 ${expanded ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
      </nav>

      <div className="px-3 mt-auto space-y-4">
        <button
          onClick={() => setShowLocationModal(true)}
          className={`w-full py-3.5 px-3 bg-elegant-gold text-deep-charcoal font-bold text-sm rounded-xl flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-elegant-gold/20 ${expanded ? 'justify-center' : 'justify-center'}`}
        >
          <PlusCircle className="w-5 h-5 flex-shrink-0" />
          <span className={`transition-all duration-300 truncate ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Quotation for Enquiry</span>
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
          className={`w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors border-t border-white/5 pt-6 ${expanded ? 'justify-start' : 'justify-center'}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={`font-medium transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Logout</span>
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
