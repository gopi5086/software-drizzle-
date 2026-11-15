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
  Trash2,
  Calendar,
  Download,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { exportToCSV } from '../utils/export';

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
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
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

  const fetchRecordData = async (staffId?: string, month?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (staffId) params.append('staff_id', staffId);
      const activeMonth = month !== undefined ? month : selectedMonth;
      if (activeMonth && activeMonth !== 'all') {
        params.append('month', activeMonth);
      }
      const queryParam = params.toString() ? `?${params.toString()}` : '';
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
    fetchRecordData(selectedStaffId, selectedMonth);
  }, [selectedStaffId, selectedMonth]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchRecordData(selectedStaffId, selectedMonth);
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
      fetchRecordData(selectedStaffId, selectedMonth);
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

  const getMonthLabel = (monthStr: string) => {
    if (!monthStr || monthStr === 'all') return 'All Time';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleExportPDF = () => {
    if (!staffInfo) return;

    const monthLabel = getMonthLabel(selectedMonth);
    const title = `Staff Activity & Conversion Monthly Report - ${staffInfo.name}`;
    
    const tableHeaders = ['ID', 'Type', 'Guest Name', 'Phone', 'Branch', 'Stay Dates', 'Rooms', 'Tariff', 'Advance', 'Status', 'Date Logged'];
    const tableRows = filteredRecords.map(item => [
      `#${item.id}`,
      item.isEnquiryOnly ? 'Enquiry' : 'Reservation',
      item.guest_name,
      item.guest_phone,
      item.location || 'Ooty',
      `${formatDate(item.check_in)} → ${formatDate(item.check_out)}`,
      `${item.num_rooms || 1} x ${item.room_type || 'Std'}`,
      `₹ ${Number(item.total_tariff || 0).toLocaleString()}`,
      `₹ ${Number(item.advance || 0).toLocaleString()}`,
      item.status,
      formatDate(item.created_at)
    ]);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - ${monthLabel}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 28px; color: #1a1a2e; background: #fff; }
    .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 24px; font-weight: 900; color: #1e3a5f; letter-spacing: 1px; }
    .brand-sub { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .report-title { font-size: 16px; font-weight: 900; color: #d97706; text-align: right; }
    .period-badge { display: inline-block; background: #e8eff7; color: #1e3a5f; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-top: 4px; }
    
    .profile-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
    .profile-name { font-size: 16px; font-weight: 900; color: #1e3a5f; }
    .profile-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; text-align: center; }
    .stat-val { font-size: 20px; font-weight: 900; color: #1e3a5f; margin-top: 4px; }
    .stat-val.rev { color: #2a7e3b; }
    .stat-val.rate { color: #d97706; }
    .stat-label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    th { background: #1e3a5f; color: #ffffff; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 12px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">DRIZZLE DROP INN</div>
      <div class="brand-sub">Hotel Management System</div>
    </div>
    <div style="text-align: right;">
      <div class="report-title">STAFF MONTHLY REPORT</div>
      <div class="period-badge">Report Period: ${monthLabel}</div>
    </div>
  </div>

  <div class="profile-card">
    <div>
      <div class="profile-name">${staffInfo.name} ${staffInfo.id !== 'ALL' ? `(Staff ID: #${staffInfo.id})` : ''}</div>
      <div class="profile-meta">Role: <strong>${staffInfo.role.toUpperCase()}</strong> | Email: ${staffInfo.email || '--'}</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      Generated: <strong>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong><br />
      Total Activity Records: <strong>${filteredRecords.length}</strong>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Enquiries Attended</div>
      <div class="stat-val">${stats.enquiriesAttended}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Converted Bookings</div>
      <div class="stat-val">${stats.convertedToReservation}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Conversion Rate</div>
      <div class="stat-val rate">${stats.conversionRate}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Revenue Generated</div>
      <div class="stat-val rev">₹ ${stats.totalRevenue.toLocaleString()}</div>
    </div>
  </div>

  <h3 style="font-size: 13px; font-weight: 800; color: #1e3a5f; margin: 16px 0 6px;">Detailed Records Breakdown (${filteredRecords.length} entries)</h3>
  <table>
    <thead>
      <tr>
        ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows.length > 0 
        ? tableRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
        : '<tr><td colspan="11" style="text-align:center; padding: 20px; color: #888;">No records found for this period</td></tr>'
      }
    </tbody>
  </table>

  <div class="footer">
    <span>Drizzle Drop Inn - Performance Record (${monthLabel})</span>
    <span>Generated by ${currentUser?.full_name || 'System'}</span>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Popup blocked! Please allow popups to export report.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
    toast.success(`Monthly report for ${staffInfo.name} (${monthLabel}) opened for PDF printing/download!`);
  };

  const handleExportCSV = () => {
    if (!staffInfo) return;
    const monthLabel = getMonthLabel(selectedMonth);
    const safeName = staffInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `monthly-record-${safeName}-${selectedMonth}`;
    const headers = [
      'Record ID',
      'Record Type',
      'Guest Name',
      'Phone',
      'Email',
      'Location',
      'Check-In',
      'Check-Out',
      'Rooms',
      'Tariff (Rs)',
      'Advance (Rs)',
      'Status',
      'Logged Date',
      'Staff Member'
    ];
    const rows = filteredRecords.map(item => [
      item.id,
      item.isEnquiryOnly ? 'Enquiry' : 'Reservation',
      item.guest_name,
      item.guest_phone,
      item.guest_email || '',
      item.location || 'Ooty',
      item.check_in,
      item.check_out,
      item.num_rooms || 1,
      item.total_tariff || 0,
      item.advance || 0,
      item.status,
      item.created_at,
      item.creator_name || staffInfo.name
    ]);

    exportToCSV(filename, headers, rows);
    toast.success(`CSV exported for ${staffInfo.name} (${monthLabel})!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Staff Profile Banner */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-elegant-gold/20 border border-elegant-gold/30 flex items-center justify-center text-elegant-gold shadow-lg shadow-elegant-gold/10">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight">Staff Activity & Conversion Record</h2>
              <p className="text-soft-slate text-sm font-medium mt-0.5">
                Staff login performance tracking & enquiry to reservation conversion record
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Staff Selector, Month Selector, Export Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Staff Filter Selector */}
          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-border-subtle shadow-sm">
              <User className="w-4 h-4 text-elegant-gold ml-1" />
              <span className="text-xs font-bold text-soft-slate uppercase tracking-wider">Staff:</span>
              <select
                className="bg-background border border-border-subtle text-primary font-bold text-xs rounded-xl py-2 px-2.5 focus:ring-2 focus:ring-elegant-gold outline-none cursor-pointer"
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
              >
                <option value="">My Record ({currentUser.full_name})</option>
                <option value="all">All Staff Members</option>
                {allStaff.map(st => (
                  <option key={st.id} value={st.id}>
                    Staff #{st.id}: {st.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Filter Selector (for both Admin & Staff) */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-border-subtle shadow-sm">
            <Calendar className="w-4 h-4 text-elegant-gold ml-1" />
            <span className="text-xs font-bold text-soft-slate uppercase tracking-wider">Month:</span>
            <input
              type="month"
              value={selectedMonth === 'all' ? '' : selectedMonth}
              onChange={e => setSelectedMonth(e.target.value || 'all')}
              className="bg-background border border-border-subtle text-primary font-bold text-xs rounded-xl py-1.5 px-2.5 focus:ring-2 focus:ring-elegant-gold outline-none cursor-pointer"
            />
            {selectedMonth !== 'all' ? (
              <button
                onClick={() => setSelectedMonth('all')}
                className="text-[10px] font-bold text-soft-slate hover:text-primary bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg transition-colors"
                title="View All Months"
              >
                All Time
              </button>
            ) : (
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="text-[10px] font-bold text-elegant-gold hover:underline px-1"
                title="Filter by Current Month"
              >
                This Month
              </button>
            )}
          </div>

          {/* Export Monthly Report Buttons (for both Admin & Staff) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform cursor-pointer"
              title="Download Monthly Report as PDF"
            >
              <Printer className="w-4 h-4 text-elegant-gold" />
              <span>Export Monthly Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border-subtle text-primary hover:border-elegant-gold hover:text-elegant-gold rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="Download Records as CSV Spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Logged-In Staff Profile Info Card */}
      {staffInfo && (
        <div className="glass-card p-6 rounded-[2rem] border border-border-subtle bg-gradient-to-r from-deep-charcoal via-slate-900 to-deep-charcoal text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-elegant-gold/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-elegant-gold flex items-center justify-center text-deep-charcoal font-black text-2xl shadow-lg shadow-elegant-gold/20">
                {staffInfo.name ? staffInfo.name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-elegant-gold bg-elegant-gold/10 px-3 py-1 rounded-full border border-elegant-gold/20 uppercase tracking-widest">
                    Staff ID: #{staffInfo.id}
                  </span>
                  <span className="text-xs font-bold text-gray-300 bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-elegant-gold" /> {staffInfo.role}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1.5">{staffInfo.name}</h3>
                <p className="text-xs text-gray-400 font-medium">{staffInfo.email || 'Registered Staff Member'}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-400">Logged In & Active</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account ID</p>
                <p className="text-sm font-bold text-white mt-1">#{staffInfo.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Enquiries Attended */}
        <div className="glass-card p-6 rounded-[2rem] border border-border-subtle shadow-md hover:border-elegant-gold/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black text-soft-slate uppercase tracking-wider">Enquiries Attended</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-primary tracking-tight">{stats.enquiriesAttended}</p>
          <p className="text-[11px] font-semibold text-soft-slate mt-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Total quotes & enquiries logged
          </p>
        </div>

        {/* Converted to Reservation */}
        <div className="glass-card p-6 rounded-[2rem] border border-border-subtle shadow-md hover:border-emerald-500/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black text-soft-slate uppercase tracking-wider">Converted to Reservation</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-emerald-600 tracking-tight">{stats.convertedToReservation}</p>
          <p className="text-[11px] font-semibold text-soft-slate mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Confirmed bookings generated
          </p>
        </div>

        {/* Conversion Rate (%) */}
        <div className="glass-card p-6 rounded-[2rem] border border-border-subtle shadow-md hover:border-amber-500/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black text-soft-slate uppercase tracking-wider">Conversion Rate</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-amber-600 tracking-tight">{stats.conversionRate}%</p>
            <span className="text-xs font-bold text-soft-slate">success rate</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.conversionRate)}%` }}
            />
          </div>
        </div>

        {/* Revenue Generated */}
        <div className="glass-card p-6 rounded-[2rem] border border-border-subtle shadow-md hover:border-elegant-gold/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black text-soft-slate uppercase tracking-wider">Revenue Generated</span>
            <div className="w-10 h-10 rounded-xl bg-elegant-gold/10 flex items-center justify-center text-elegant-gold group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-primary tracking-tight">
            ₹ {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] font-semibold text-soft-slate mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-elegant-gold" /> Total booking revenue
          </p>
        </div>

      </div>

      {/* Main Records Table & Controls */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-border-subtle shadow-xl">
        
        {/* Table Filter Controls Header */}
        <div className="p-6 md:p-8 border-b border-border-subtle bg-white/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {(['All', 'Converted', 'Pending', 'Cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-soft-slate hover:bg-gray-100'
                }`}
              >
                {tab === 'All' ? 'All Records' : tab === 'Converted' ? 'Converted Reservations' : tab === 'Pending' ? 'Pending Enquiries' : 'Cancelled'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Location Filter */}
            <div className="flex items-center bg-background rounded-xl p-1 border border-border-subtle text-xs font-bold">
              {(['All', 'Chennai', 'Ooty'] as const).map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(loc)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    locationFilter === loc ? 'bg-elegant-gold text-deep-charcoal shadow-sm' : 'text-soft-slate hover:text-primary'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
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
