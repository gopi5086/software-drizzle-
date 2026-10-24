import React, { useEffect, useState } from 'react';
import { Search, X, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface SearchResult {
  id: string | number;
  label: string;
  subtitle: string;
  category: 'Reservation' | 'Enquiry' | 'Guest' | 'Invoice';
  route: string;
}

interface TopBarProps {
  expanded?: boolean;
  onMobileMenuToggle?: () => void;
}

type SearchScope = 'All' | 'Reservation' | 'Enquiry' | 'Guest' | 'Invoice';

const TopBar: React.FC<TopBarProps> = ({ expanded = false, onMobileMenuToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<SearchScope>('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (!search) {
      setResults([]);
      return;
    }

    if (search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const value = search.toLowerCase();

        const fetchReservationResults = async () => {
          const res = await api.get('/reservations');
          return (res.data || [])
            .filter((item: any) => {
              const text = [
                item.guest_name,
                item.guest_phone,
                item.guest_email,
                item.room_type,
                String(item.id),
                item.location,
                item.status,
              ].join(' ').toLowerCase();
              return text.includes(value);
            })
            .slice(0, 6)
            .map((item: any) => ({
              id: item.id,
              label: item.guest_name || 'Reservation guest',
              subtitle: `Reservation • ${item.guest_phone || item.guest_email || 'No contact'} • ${item.room_type || 'Stay'}`,
              category: 'Reservation' as const,
              route: '/reservations',
            }));
        };

        const fetchEnquiryResults = async () => {
          const res = await api.get('/enquiries');
          return (res.data || [])
            .filter((item: any) => {
              const text = [
                item.guest_name,
                item.guest_phone,
                item.guest_email,
                item.room_type,
                String(item.id),
                item.location,
                item.status,
              ].join(' ').toLowerCase();
              return text.includes(value);
            })
            .slice(0, 6)
            .map((item: any) => ({
              id: item.id,
              label: item.guest_name || 'Enquiry guest',
              subtitle: `Enquiry • ${item.location || 'Chennai'} • ${item.guest_phone || item.guest_email || 'No contact'}`,
              category: 'Enquiry' as const,
              route: '/enquiries',
            }));
        };

        const fetchCustomerResults = async () => {
          const res = await api.get('/customers', { params: { search } });
          return (res.data || [])
            .filter((item: any) => {
              const text = [
                item.full_name,
                item.email,
                item.phone,
                item.address,
                item.room_no,
                item.room_type,
                String(item.id),
              ].join(' ').toLowerCase();
              return text.includes(value);
            })
            .slice(0, 5)
            .map((item: any) => ({
              id: item.id,
              label: item.full_name || 'Guest',
              subtitle: `Guest • ${item.phone || item.email || 'No contact details'}`,
              category: 'Guest' as const,
              route: '/customers',
            }));
        };

        const fetchInvoiceResults = async () => {
          const res = await api.get('/reports/invoices');
          return ((res.data && res.data.invoices) || [])
            .filter((item: any) => {
              const text = [
                item.client,
                item.id,
                item.status,
                item.method,
                String(item.amount),
              ].join(' ').toLowerCase();
              return text.includes(value);
            })
            .slice(0, 5)
            .map((item: any) => ({
              id: item.id,
              label: item.client || 'Invoice',
              subtitle: `Invoice • ${item.id} • ₹${Number(item.amount || 0).toLocaleString()}`,
              category: 'Invoice' as const,
              route: '/finance',
            }));
        };

        let combined: SearchResult[] = [];

        if (selectedScope === 'All') {
          const [reservationResults, enquiryResults, customerResults, invoiceResults] = await Promise.all([
            fetchReservationResults(),
            fetchEnquiryResults(),
            fetchCustomerResults(),
            fetchInvoiceResults(),
          ]);
          combined = [...reservationResults, ...enquiryResults, ...customerResults, ...invoiceResults].slice(0, 12);
        } else if (selectedScope === 'Reservation') {
          combined = await fetchReservationResults();
        } else if (selectedScope === 'Enquiry') {
          combined = await fetchEnquiryResults();
        } else if (selectedScope === 'Guest') {
          combined = await fetchCustomerResults();
        } else {
          combined = await fetchInvoiceResults();
        }

        setResults(combined);
      } catch (error) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedScope]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    navigate(result.route);
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 sm:h-20 bg-surface-glass backdrop-blur-md border-b border-border-subtle flex justify-between items-center px-3 sm:px-6 md:px-10 shadow-sm z-40 transition-all duration-300 left-0 w-full ${
        expanded ? 'md:left-[260px] md:w-[calc(100%-260px)]' : 'md:left-[72px] md:w-[calc(100%-72px)]'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 relative">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-primary hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-primary" />
        </button>

        <div className="relative w-full max-w-[640px] focus-within:ring-2 focus-within:ring-elegant-gold rounded-lg transition-all bg-background/50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reservations, enquiries, guests, invoices..."
            className="w-full bg-transparent border-none rounded-lg pl-9 sm:pl-10 pr-9 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm placeholder:text-soft-slate/50 focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-slate hover:text-primary"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {query.trim() && (
          <div className="absolute left-0 top-full mt-2 w-full bg-white border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex gap-1.5 sm:gap-2 px-3 py-2 border-b border-border-subtle bg-background/60 overflow-x-auto">
              {(['All', 'Reservation', 'Enquiry', 'Guest', 'Invoice'] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setSelectedScope(scope)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${
                    selectedScope === scope
                      ? 'bg-primary text-white'
                      : 'bg-white text-soft-slate hover:bg-gray-100'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="px-4 py-3 text-xs text-soft-slate font-medium">Searching {selectedScope === 'All' ? 'across records' : selectedScope.toLowerCase()}...</div>
            ) : results.length > 0 ? (
              <div className="max-h-[60vh] overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={`${result.category}-${result.id}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-background/80 border-b border-border-subtle last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-primary">{result.label}</p>
                      <p className="text-[11px] text-soft-slate mt-0.5">{result.subtitle}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-soft-slate mt-1 shrink-0">{result.category}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-soft-slate font-medium">
                No matching {selectedScope === 'All' ? 'reservations, enquiries, guests, or invoices' : selectedScope.toLowerCase() + ' records'} found.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-6 pl-2 shrink-0">
        {(user?.role || 'admin').toLowerCase() === 'admin' ? (
          <Link to="/settings" className="flex items-center gap-2 sm:gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-primary">{user?.full_name || 'Admin Profile'}</p>
              <p className="text-[10px] text-soft-slate uppercase tracking-wider">{user?.role || 'Hotel Manager'}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-2 border-elegant-gold text-xs sm:text-sm font-bold text-slate-700 shadow-sm">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-primary">{user?.full_name || 'Staff Profile'}</p>
              <p className="text-[10px] text-soft-slate uppercase tracking-wider">{user?.role || 'Staff Member'}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-2 border-elegant-gold text-xs sm:text-sm font-bold text-slate-700 shadow-sm">
              {(user?.full_name || 'S').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
