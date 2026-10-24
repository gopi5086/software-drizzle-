import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  Trash2,
  MapPin,
  PlusCircle,
  ArrowRight,
  UserCheck,
  FileText,
  IndianRupee,
  Download,
  MessageCircle,
  Mail,
  Pencil,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import LocationPickerModal from '../components/LocationPickerModal';
import { captureInvoiceAsBlob, sendInvoiceViaWhatsApp } from '../utils/invoiceCapture';
import type { UnifiedInvoiceData } from '../components/UnifiedInvoice';

interface EnquiryItem {
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
  reservation_id?: number;
}

const normalizeEnquiryStatus = (status?: string) => {
  if (!status) return 'Enquiry';
  const value = status.trim();
  if (value === 'Pending') return 'Enquiry';
  if (value === 'Hold') return 'On Hold';
  if (value === 'Converted') return 'Confirmed';
  return value;
};

const statusColors: Record<string, string> = {
  Enquiry: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'On Hold': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'In Progress': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  Cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const EnquiriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'All' | 'Enquiry' | 'Confirmed' | 'On Hold' | 'In Progress' | 'Cancelled'>('Enquiry');
  const [locationFilter, setLocationFilter] = useState<'All' | 'Chennai' | 'Ooty'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/enquiries');
      setEnquiries(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load enquiries: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const convertEnquiry = async (id: number) => {
    try {
      await api.post(`/enquiries/${id}/convert`);
      toast.success('✅ Enquiry accepted & added to Reservation database!');
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to convert enquiry to reservation');
    }
  };

  const buildInvoiceData = (item: EnquiryItem): UnifiedInvoiceData => ({
    guestName: item.guest_name,
    guestEmail: item.guest_email,
    guestPhone: item.guest_phone,
    checkIn: item.check_in,
    checkOut: item.check_out,
    adults: item.adults,
    children: item.children,
    numRooms: item.num_rooms,
    roomType: item.room_type,
    rooms: [{ type: item.room_type || 'Standard', count: item.num_rooms || 1, rate: Number((Number(item.total_tariff || 0) / Math.max(1, Number(item.num_rooms || 1))).toFixed(2)) }],
    totalTariff: Number(item.total_tariff || 0),
    advance: Number(item.advance || 0),
    balanceDue: Number(item.total_tariff || 0) - Number(item.advance || 0),
    location: item.location || 'Ooty',
    created_at: item.created_at,
  });

  const editEnquiry = (item: EnquiryItem) => {
    const locationPath = item.location === 'Ooty' ? '/create-ooty-enquiry' : '/create-chennai-enquiry';
    navigate(locationPath, { state: { editEnquiryId: item.id, location: item.location || 'Chennai' } });
  };

  const sendEmail = async (item: EnquiryItem) => {
    if (!item.guest_email) {
      toast.error('This enquiry has no email address to send to');
      return;
    }
    setSendingEmailId(item.id);
    try {
      const promise = api.post(`/enquiries/${item.id}/send-email`);
      toast.promise(promise, {
        loading: `📧 Sending invoice to ${item.guest_email}...`,
        success: `✅ Invoice sent to ${item.guest_email}!`,
        error: (err: any) => err.response?.data?.message || 'Failed to send invoice email',
      });
      await promise;
    } catch {
      // handled by toast.promise
    } finally {
      setSendingEmailId(null);
    }
  };

  const downloadInvoice = async (item: EnquiryItem) => {
    const toastId = toast.loading('Preparing invoice download...');
    try {
      const blob = await captureInvoiceAsBlob(buildInvoiceData(item));
      if (!blob) {
        toast.error('Failed to generate invoice image.', { id: toastId });
        return;
      }

      const invoiceNo = `ENQ-${String(item.id).padStart(4, '0')}`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${invoiceNo}-DrizzleDrop-Invoice.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);
      toast.success('✅ Invoice downloaded successfully.', { id: toastId, duration: 4000 });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download invoice.', { id: toastId });
    }
  };

  const sendWhatsAppInvoice = async (item: EnquiryItem) => {
    const invoiceData = buildInvoiceData(item);
    let phone = (item.guest_phone || '').replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('+')) {
      phone = phone.slice(1);
    } else if (phone.length === 10) {
      phone = '91' + phone;
    }

    if (!phone) {
      toast.error('This enquiry has no phone number to send invoice to.');
      return;
    }

    const invoiceNo = `ENQ-${String(item.id).padStart(4, '0')}`;
    const toastId = toast.loading('Capturing invoice image...');
    const result = await sendInvoiceViaWhatsApp(invoiceData, invoiceNo, phone);

    if (result.success) {
      toast.success('✅ Invoice image downloaded! WhatsApp is opening to the customer’s chat.', { id: toastId, duration: 7000 });
    } else {
      toast.error('Failed to capture invoice: ' + (result.error || 'Unknown error'), { id: toastId });
    }
  };

  const updateEnquiryStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/enquiries/${id}/status`, { status });
      toast.success(`Enquiry status updated to ${status}`);
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update enquiry status');
    }
  };

  const deleteEnquiry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await api.delete(`/enquiries/${id}`);
      toast.success('Enquiry deleted');
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete enquiry');
    }
  };

  const filteredEnquiries = enquiries.filter(item => {
    const normalizedStatus = normalizeEnquiryStatus(item.status);
    const isConverted = Boolean(item.reservation_id) || normalizedStatus === 'Confirmed';

    if (isConverted && activeTab === 'Enquiry') {
      return false;
    }

    let matchesStatus = true;
    if (activeTab === 'Enquiry') {
      matchesStatus = normalizedStatus === 'Enquiry';
    } else if (activeTab === 'Confirmed') {
      matchesStatus = normalizedStatus === 'Confirmed';
    } else if (activeTab === 'On Hold') {
      matchesStatus = normalizedStatus === 'On Hold';
    } else if (activeTab === 'In Progress') {
      matchesStatus = normalizedStatus === 'In Progress';
    } else if (activeTab === 'Cancelled') {
      matchesStatus = normalizedStatus === 'Cancelled';
    }

    let matchesLocation = true;
    if (locationFilter !== 'All') {
      matchesLocation = item.location === locationFilter;
    }

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

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const enquiryCount = enquiries.filter(e => !e.reservation_id && normalizeEnquiryStatus(e.status) === 'Enquiry').length;
  const confirmedCount = enquiries.filter(e => e.reservation_id || normalizeEnquiryStatus(e.status) === 'Confirmed').length;
  const pendingCount = enquiryCount;
  const convertedCount = confirmedCount;

  // Invoice stats
  const totalTariff = enquiries.reduce((sum, e) => sum + Number(e.total_tariff || 0), 0);
  const totalAdvance = enquiries.reduce((sum, e) => sum + Number(e.advance || 0), 0);
  const totalBalance = totalTariff - totalAdvance;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-subtle pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-md shrink-0">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tight">Enquiries & Quotations</h2>
              <p className="text-soft-slate text-xs sm:text-sm font-medium mt-0.5">
                Incoming quotes saved in enquiries database · Convert to reservation after completion
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowLocationModal(true)}
          className="w-full md:w-auto justify-center flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-elegant-gold text-deep-charcoal rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-elegant-gold/20 hover:scale-[1.02] transition-transform"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          Create New Enquiry
        </button>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Total Enquiries</p>
            <p className="text-2xl sm:text-3xl font-black text-primary mt-1">{enquiries.length}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Pending Enquiries</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-black text-soft-slate uppercase tracking-wider">Converted to Reservations</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{convertedCount}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-border-subtle shadow-xl">
        
        {/* Controls Header */}
        <div className="p-4 sm:p-6 md:p-8 border-b border-border-subtle bg-white/50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {(['Enquiry', 'Confirmed', 'On Hold', 'In Progress', 'All', 'Cancelled'] as const).map(tab => {
              const count = tab === 'Enquiry' ? enquiryCount : tab === 'Confirmed' ? confirmedCount : tab === 'All' ? enquiries.length : enquiries.filter(item => normalizeEnquiryStatus(item.status) === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-soft-slate hover:bg-gray-100'
                  }`}
                >
                  {tab === 'All' ? `All (${count})` : `${tab} (${count})`}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
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
            <p className="text-sm font-bold text-soft-slate">Loading enquiries database...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <HelpCircle className="w-16 h-16 text-gray-300" />
            <h4 className="text-xl font-bold text-primary">No enquiries found</h4>
            <p className="text-xs text-soft-slate">Click "Create New Enquiry" to add an enquiry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4">Enquiry ID</th>
                  <th className="px-6 py-4">Guest Details</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Tariff & Advance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredEnquiries.map(item => {
                  const isConverted = item.status === 'Converted';
                  const isSending = sendingEmailId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs font-black text-primary">#ENQ-{item.id}</span>
                        <p className="text-[10px] text-soft-slate font-medium">{formatDate(item.created_at)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-xs text-amber-700">
                            {item.guest_name ? item.guest_name[0].toUpperCase() : 'G'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{item.guest_name}</p>
                            <p className="text-[11px] text-soft-slate font-mono">{item.guest_phone}</p>
                            {item.guest_email && (
                              <p className="text-[10px] text-soft-slate truncate max-w-[160px]">{item.guest_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 w-max ${
                          item.location === 'Chennai'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          <MapPin className="w-3 h-3" /> {item.location || 'Chennai'}
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
                        <p className="text-[10px] font-bold text-rose-500">
                          Bal: ₹ {(Number(item.total_tariff || 0) - Number(item.advance || 0)).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          aria-label={`Update status for ${item.guest_name}`}
                          value={normalizeEnquiryStatus(item.status)}
                          onChange={(e) => updateEnquiryStatus(item.id, e.target.value)}
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border outline-none cursor-pointer ${statusColors[normalizeEnquiryStatus(item.status)] || 'bg-gray-100 text-soft-slate'}`}
                        >
                          <option value="Enquiry">Enquiry</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">

                          {/* Invoice send actions — only available after status is Confirmed */}
                          {normalizeEnquiryStatus(item.status) === 'Confirmed' ? (
                            <>
                              <button
                                onClick={() => sendWhatsAppInvoice(item)}
                                title={item.guest_phone ? `Send invoice via WhatsApp to ${item.guest_phone}` : 'No phone number on record'}
                                className={`p-2 rounded-lg transition-all ${
                                  item.guest_phone
                                    ? 'text-soft-slate hover:text-emerald-600 hover:bg-emerald-50 active:scale-95'
                                    : 'text-gray-300 cursor-not-allowed opacity-40'
                                }`}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => downloadInvoice(item)}
                                title="Download invoice"
                                className="p-2 rounded-lg text-soft-slate hover:text-amber-600 hover:bg-amber-50 active:scale-95 transition-all"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => sendEmail(item)}
                                disabled={isSending || !item.guest_email}
                                title={item.guest_email ? `Send invoice to ${item.guest_email}` : 'No email on record'}
                                className={`p-2 rounded-lg transition-all ${
                                  item.guest_email
                                    ? 'text-soft-slate hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                                    : 'text-gray-300 cursor-not-allowed opacity-40'
                                }`}
                              >
                                {isSending ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span
                              title={`Receipt/invoice available only after status is 'Confirmed' (current: ${normalizeEnquiryStatus(item.status)})`}
                              className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}

                          <button
                            onClick={() => editEnquiry(item)}
                            title="Edit enquiry"
                            className="p-2 rounded-lg text-soft-slate hover:text-violet-600 hover:bg-violet-50 active:scale-95 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Accept & Convert */}
                          {!isConverted ? (
                            <button
                              onClick={() => convertEnquiry(item.id)}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:scale-105"
                              title="Accept Enquiry & Create Official Reservation in Database"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Accept & Add to Reservation</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/reservations')}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                            >
                              <span>View in Reservations</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => deleteEnquiry(item.id)}
                            className="p-2 text-soft-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Enquiry"
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

      {/* Invoice Summary Table */}
      {enquiries.length > 0 && (
        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-border-subtle shadow-xl">
          <div className="p-6 md:p-8 border-b border-border-subtle bg-gradient-to-r from-deep-charcoal to-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-elegant-gold/20 border border-elegant-gold/30 flex items-center justify-center text-elegant-gold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Invoice Summary</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Click the 📧 Send icon to email an invoice directly to the guest</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Revenue</p>
                <p className="text-lg font-black text-elegant-gold">₹{totalTariff.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Balance Due</p>
                <p className="text-lg font-black text-rose-400">₹{totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4">Quote No.</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Registered On</th>
                  <th className="px-6 py-4">Stay Dates</th>
                  <th className="px-6 py-4 text-right">Total Tariff</th>
                  <th className="px-6 py-4 text-right">Advance</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {enquiries.map(item => {
                  const balance = Number(item.total_tariff || 0) - Number(item.advance || 0);
                  const isSendingInvoice = sendingEmailId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-black text-primary">QTE-{String(item.id).padStart(4, '0')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-primary">{item.guest_name}</p>
                        <p className="text-[10px] text-soft-slate">{item.guest_email || <span className="text-rose-400 italic">No email</span>}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.location === 'Chennai' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.location || 'Chennai'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-primary">{formatTimestamp(item.created_at)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-primary">{formatDate(item.check_in)}</p>
                        <p className="text-[10px] text-soft-slate">→ {formatDate(item.check_out)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-primary">₹{Number(item.total_tariff || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-bold text-emerald-600">₹{Number(item.advance || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-xs font-bold ${balance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          ₹{balance.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          aria-label={`Update status for ${item.guest_name}`}
                          value={normalizeEnquiryStatus(item.status)}
                          onChange={(e) => updateEnquiryStatus(item.id, e.target.value)}
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border outline-none cursor-pointer ${statusColors[normalizeEnquiryStatus(item.status)] || 'bg-gray-100 text-soft-slate'}`}
                        >
                          <option value="Enquiry">Enquiry</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => sendWhatsAppInvoice(item)}
                                title={item.guest_phone ? `Send invoice via WhatsApp to ${item.guest_phone}` : 'No phone number on record'}
                                className={`p-2 rounded-lg transition-all ${
                                  item.guest_phone
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white active:scale-95'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                }`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => downloadInvoice(item)}
                                title="Download invoice"
                                className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-600 hover:text-white active:scale-95 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => editEnquiry(item)}
                                title="Edit enquiry"
                                className="p-2 rounded-lg bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-600 hover:text-white active:scale-95 transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => sendEmail(item)}
                                disabled={isSendingInvoice || !item.guest_email}
                                title={item.guest_email ? `Send invoice email to ${item.guest_email}` : 'No email on record'}
                                className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${
                                  item.guest_email
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 shadow-sm'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                }`}
                              >
                                {isSendingInvoice ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5" />
                                )}
                              </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-deep-charcoal/5 to-slate-100/50 border-t-2 border-border-subtle">
                  <td colSpan={5} className="px-6 py-5 text-xs font-black text-soft-slate uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-elegant-gold" />
                      Grand Totals · {enquiries.length} enquiries
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-black text-primary">₹{totalTariff.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-xs font-black text-emerald-600">₹{totalAdvance.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-black text-rose-500">₹{totalBalance.toLocaleString()}</p>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};

export default EnquiriesPage;
