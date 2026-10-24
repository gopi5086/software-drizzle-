import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  Edit,
  IndianRupee,
  MapPin,
  Shield,
  User,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface RecordItem {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  room_type: string;
  num_rooms: number;
  total_tariff: number;
  advance: number;
  status: string;
  location: string;
  created_at: string;
  creator_name?: string;
  isEnquiryOnly?: boolean;
}

interface StaffInfo {
  id: number | string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface StaffStats {
  enquiriesAttended: number;
  convertedToReservation: number;
  pendingEnquiries: number;
  cancelledCount: number;
  conversionRate: number;
  totalRevenue: number;
}

const statusColors: Record<string, string> = {
  Active: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Upcoming: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  Pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  Confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Hold: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const RecordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [stats, setStats] = useState<StaffStats>({
    enquiriesAttended: 0,
    convertedToReservation: 0,
    pendingEnquiries: 0,
    cancelledCount: 0,
    conversionRate: 0,
    totalRevenue: 0,
  });
  const [allStaff, setAllStaff] = useState<{ id: number; full_name: string; email: string }[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);

  // Filter States
  const [activeTab, setActiveTab] = useState<'All' | 'Converted' | 'Pending' | 'Cancelled'>('All');
  const [locationFilter, setLocationFilter] = useState<'All' | 'Chennai' | 'Ooty'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecordData = async (staffId?: string) => {
    setLoading(true);
    try {
      const queryParam = staffId ? `?staff_id=${staffId}` : '';
      const res = await api.get(`/reports/staff-record${queryParam}`);
      
      setStaffInfo(res.data.staffInfo);
      setStats(res.data.stats);
      setAllStaff(res.data.allStaff || []);
      setRecords(res.data.records || []);
    } catch (err: any) {
      toast.error('Failed to load record details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordData(selectedStaffId);
  }, [selectedStaffId]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchRecordData(selectedStaffId);
    } catch (err: any) {
      toast.error('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRecord = async (item: RecordItem) => {
    if (!window.confirm(`Delete this ${item.isEnquiryOnly ? 'enquiry' : 'reservation'} record?`)) return;

    try {
      if (item.isEnquiryOnly) {
        await api.delete(`/enquiries/${item.id}`);
      } else {
        await api.delete(`/reservations/${item.id}`);
      }

      toast.success('Record deleted successfully');
      fetchRecordData(selectedStaffId);
    } catch (err: any) {
      toast.error('Failed to delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredRecords = records.filter(item => {
    // Status Filter
    let matchesStatus = true;
    if (activeTab === 'Converted') {
      matchesStatus = ['Confirmed', 'Active', 'Completed', 'Upcoming'].includes(item.status);
    } else if (activeTab === 'Pending') {
      matchesStatus = ['Pending', 'Hold'].includes(item.status);
    } else if (activeTab === 'Cancelled') {
      matchesStatus = item.status === 'Cancelled';
    }

    // Location Filter
    let matchesLocation = true;
    if (locationFilter !== 'All') {
      matchesLocation = item.location === locationFilter;
    }

    // Search Query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        item.guest_name.toLowerCase().includes(q) ||
        item.guest_phone.includes(q) ||
        String(item.id).includes(q);
    }

    return matchesStatus && matchesLocation && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Staff Profile Banner */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-subtle pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-elegant-gold/20 border border-elegant-gold/30 flex items-center justify-center text-elegant-gold shadow-lg shadow-elegant-gold/10 shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tight">Staff Activity & Conversion Record</h2>
              <p className="text-soft-slate text-xs sm:text-sm font-medium mt-0.5">
                Staff login performance tracking & enquiry to reservation conversion record
              </p>
            </div>
          </div>
        </div>

        {/* Admin Staff Filter Selector */}
        {currentUser?.role === 'admin' && (
          <div className="w-full md:w-auto flex items-center gap-2 sm:gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-border-subtle shadow-sm">
            <User className="w-4 h-4 text-elegant-gold ml-1 sm:ml-2 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-soft-slate uppercase tracking-wider shrink-0">Staff:</span>
            <select
              className="flex-1 bg-background border border-border-subtle text-primary font-bold text-xs sm:text-sm rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 focus:ring-2 focus:ring-elegant-gold outline-none cursor-pointer"
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
            >
              <option value="">My Record ({currentUser.full_name})</option>
              <option value="all">All Staff Members</option>
              {allStaff.map(st => (
                <option key={st.id} value={st.id}>
                  Staff #{st.id}: {st.full_name} ({st.email})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Logged-In Staff Profile Info Card */}
      {staffInfo && (
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle bg-gradient-to-r from-deep-charcoal via-slate-900 to-deep-charcoal text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-elegant-gold/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-elegant-gold flex items-center justify-center text-deep-charcoal font-black text-xl sm:text-2xl shadow-lg shadow-elegant-gold/20 shrink-0">
                {staffInfo.name ? staffInfo.name[0].toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-black text-elegant-gold bg-elegant-gold/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-elegant-gold/20 uppercase tracking-widest">
                    Staff ID: #{staffInfo.id}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-300 bg-white/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-elegant-gold" /> {staffInfo.role}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white mt-1 truncate">{staffInfo.name}</h3>
                <p className="text-xs text-gray-400 font-medium truncate">{staffInfo.email || 'Registered Staff Member'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">Logged In & Active</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account ID</p>
                <p className="text-xs sm:text-sm font-bold text-white mt-1">#{staffInfo.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        
        {/* Enquiries Attended */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-md hover:border-elegant-gold/40 transition-all group">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Enquiries Attended</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shrink-0">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-primary tracking-tight">{stats.enquiriesAttended}</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-soft-slate mt-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Total quotes logged
          </p>
        </div>

        {/* Converted to Reservation */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-md hover:border-emerald-500/40 transition-all group">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Converted to Reservation</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-emerald-600 tracking-tight">{stats.convertedToReservation}</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-soft-slate mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Confirmed bookings
          </p>
        </div>

        {/* Conversion Rate (%) */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-md hover:border-amber-500/40 transition-all group">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Conversion Rate</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-4xl font-black text-amber-600 tracking-tight">{stats.conversionRate}%</p>
            <span className="text-[10px] sm:text-xs font-bold text-soft-slate">success rate</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.conversionRate)}%` }}
            />
          </div>
        </div>

        {/* Revenue Generated */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-md hover:border-elegant-gold/40 transition-all group">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Revenue Generated</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-elegant-gold/10 flex items-center justify-center text-elegant-gold group-hover:scale-110 transition-transform shrink-0">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-primary tracking-tight">
            ₹ {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-soft-slate mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-elegant-gold shrink-0" /> Total booking revenue
          </p>
        </div>

      </div>

      {/* Main Records Table & Controls */}
      <div className="glass-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-border-subtle shadow-xl">
        
        {/* Table Filter Controls Header */}
        <div className="p-4 sm:p-6 md:p-8 border-b border-border-subtle bg-white/50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {(['All', 'Converted', 'Pending', 'Cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-soft-slate hover:bg-gray-100'
                }`}
              >
                {tab === 'All' ? 'All Records' : tab === 'Converted' ? 'Converted Reservations' : tab === 'Pending' ? 'Pending Enquiries' : 'Cancelled'}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Location Filter */}
            <div className="flex items-center justify-center bg-background rounded-xl p-1 border border-border-subtle text-xs font-bold shrink-0">
              {(['All', 'Chennai', 'Ooty'] as const).map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(loc)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-colors ${
                    locationFilter === loc ? 'bg-elegant-gold text-deep-charcoal shadow-sm' : 'text-soft-slate hover:text-primary'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-0 sm:min-w-[200px] flex-1">
              <Search className="w-4 h-4 text-soft-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or ID..."
                className="w-full bg-background border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-elegant-gold outline-none font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-elegant-gold" />
            <p className="text-sm font-bold text-soft-slate">Loading staff record activity...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <ClipboardList className="w-16 h-16 text-gray-300" />
            <h4 className="text-xl font-bold text-primary">No records found</h4>
            <p className="text-xs text-soft-slate">No enquiries or reservations match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4">Record ID</th>
                  <th className="px-6 py-4">Guest Details</th>
                  <th className="px-6 py-4">Branch Location</th>
                  <th className="px-6 py-4">Stay Dates</th>
                  <th className="px-6 py-4">Tariff & Advance</th>
                  <th className="px-6 py-4">Status / Conversion</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredRecords.map(item => {
                  const isConverted = ['Confirmed', 'Active', 'Completed', 'Upcoming'].includes(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs font-black text-primary">#{item.id}</span>
                        <p className="text-[10px] text-soft-slate font-medium">{formatDate(item.created_at)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-xs text-primary">
                            {item.guest_name ? item.guest_name[0].toUpperCase() : 'G'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{item.guest_name}</p>
                            <p className="text-[11px] text-soft-slate font-mono">{item.guest_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 w-max ${
                          item.location === 'Chennai'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          <MapPin className="w-3 h-3" /> {item.location || 'Ooty'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-primary">
                          {formatDate(item.check_in)} → {formatDate(item.check_out)}
                        </p>
                        <p className="text-[10px] text-soft-slate font-semibold">
                          {item.num_rooms || 1} room(s) · {item.room_type || 'Standard'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-primary">₹ {Number(item.total_tariff || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-600">
                          Adv: ₹ {Number(item.advance || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <select
                            value={item.status}
                            onChange={e => updateStatus(item.id, e.target.value)}
                            className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border cursor-pointer focus:ring-2 focus:ring-elegant-gold outline-none ${statusColors[item.status] || 'bg-gray-100 text-soft-slate'}`}
                          >
                            <option value="Confirmed">Confirmed (Converted)</option>
                            <option value="Active">Active (Converted)</option>
                            <option value="Upcoming">Upcoming (Converted)</option>
                            <option value="Completed">Completed (Converted)</option>
                            <option value="Pending">Pending Enquiry</option>
                            <option value="Hold">Hold Enquiry</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <p className="text-[9px] font-bold text-soft-slate mt-1">
                          {isConverted ? '✅ Converted to Reservation' : '⏳ Pending Enquiry'}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isConverted && (
                            <button
                              onClick={() => {
                                updateStatus(item.id, 'Confirmed');
                                toast.success('✅ Booking accepted & added to Reservation database!');
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                              title="Accept & Add to Reservation Database"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> + Add to Reservation
                            </button>
                          )}
                          <button
                            onClick={() => navigate(item.isEnquiryOnly ? '/enquiries' : `/edit-reservation/${item.id}`)}
                            className="p-2 text-soft-slate hover:text-primary hover:bg-background rounded-lg transition-colors"
                            title={item.isEnquiryOnly ? 'Open Enquiries' : 'Edit Reservation'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(item)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default RecordPage;
