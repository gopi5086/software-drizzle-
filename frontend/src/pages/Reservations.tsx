import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Calendar,
  FileText,
  Loader2,
  Trash2,
  CheckCircle,
  Mail,
  Printer,
  Download,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import ReservationReceipt, { type ReceiptData } from '../components/ReservationReceipt';
import Modal from '../components/Modal';

interface Reservation {
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
  created_at: string;
  room_details?: any;
  special_requirements?: string;
  special_requirements_amount?: number;
  early_checkin_amount?: number;
  late_checkout_amount?: number;
  stay_cosy_amount?: number;
  check_in_time?: string;
  check_out_time?: string;
}

const statusColors: Record<string, string> = {
  Active: 'bg-elegant-gold/20 text-elegant-gold',
  Upcoming: 'bg-primary/5 text-primary',
  Completed: 'bg-green-50 text-green-600',
  Cancelled: 'bg-red-50 text-red-500',
  Pending: 'bg-yellow-50 text-yellow-600',
  Confirmed: 'bg-blue-50 text-blue-600',
  Hold: 'bg-orange-50 text-orange-600',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
};

const calcNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const Reservations: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err: any) {
      toast.error('Failed to load reservations: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter(r =>
    activeTab === 'All' ? true : r.status === activeTab
  );

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      toast.success(`Reservation marked as ${status}`);
      fetchReservations();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteReservation = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation deleted');
      fetchReservations();
    } catch {
      toast.error('Failed to delete reservation');
    }
  };

  const sendInvoice = async (id: number) => {
    try {
      const promise = api.post(`/reservations/${id}/send-invoice`);
      toast.promise(promise, {
        loading: 'Sending invoice email...',
        success: 'Invoice sent successfully!',
        error: (err: any) => err.response?.data?.message || 'Failed to send invoice email'
      });
    } catch (err: any) {
      toast.error('Error initiating email process');
    }
  };

  const sendReceipt = async (id: number) => {
    try {
      const promise = api.post(`/reservations/${id}/send-receipt`);
      toast.promise(promise, {
        loading: 'Sending receipt email...',
        success: 'Receipt sent successfully!',
        error: (err: any) => err.response?.data?.message || 'Failed to send receipt email'
      });
    } catch (err: any) {
      toast.error('Error initiating email process');
    }
  };

  const viewReceipt = (res: Reservation) => {
    let parsedRooms = [];
    try { 
      // If room_details is a JSON string, parse it.
      if (typeof res.room_details === 'string') {
        parsedRooms = JSON.parse(res.room_details);
      } else if (Array.isArray(res.room_details)) {
        parsedRooms = res.room_details;
      }
    } catch (e) {
      console.warn("Could not parse room_details", e);
    }
    
    setReceiptModalData({
      guestName: res.guest_name,
      guestPhone: res.guest_phone,
      guestEmail: res.guest_email,
      roomType: res.room_type,
      numRooms: res.num_rooms,
      rooms: parsedRooms,
      specialRequirements: res.special_requirements,
      specialRequirementsAmount: Number(res.special_requirements_amount || 0),
      earlyCheckinAmount: Number(res.early_checkin_amount || 0),
      lateCheckoutAmount: Number(res.late_checkout_amount || 0),
      stayCosyAmount: Number(res.stay_cosy_amount || 0),
      checkIn: res.check_in,
      checkOut: res.check_out,
      adults: res.adults,
      children: res.children,
      totalTariff: Number(res.total_tariff),
      advance: Number(res.advance || 0),
      balanceDue: Math.max(0, Number(res.total_tariff) - Number(res.advance || 0)),
      checkInTime: res.check_in_time || '12:00 Noon',
      checkOutTime: res.check_out_time || '11:00 A.M',
      created_at: res.created_at
    });
    setSelectedReservationId(res.id);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Reservations</h2>
          <div className="flex gap-6 mt-6 border-b border-border-subtle overflow-x-auto scrollbar-hide">
            {['All', 'Upcoming', 'Active', 'Completed', 'Cancelled', 'Pending', 'Confirmed', 'Hold'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-elegant-gold'
                    : 'text-soft-slate hover:text-primary'
                }`}
              >
                {tab}
                <span className="ml-2 text-[10px] bg-background rounded-full px-2 py-0.5">
                  {tab === 'All' ? reservations.length : reservations.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/create-reservation')}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Create Reservation
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: reservations.length, color: 'text-primary' },
          { label: 'Upcoming', value: reservations.filter(r => r.status === 'Upcoming').length, color: 'text-blue-500' },
          { label: 'Active', value: reservations.filter(r => r.status === 'Active').length, color: 'text-elegant-gold' },
          { label: 'Completed', value: reservations.filter(r => r.status === 'Completed').length, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">{stat.label}</span>
            <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Reservations Table */}
      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-8 border-b border-border-subtle flex justify-between items-center">
          <h3 className="text-xl font-bold text-primary">
            {activeTab === 'All' ? 'All Reservations' : `${activeTab} Reservations`}
          </h3>
          <span className="text-xs font-bold text-soft-slate">{filteredReservations.length} records</span>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-elegant-gold" />
            <p className="text-sm font-bold text-soft-slate">Loading from database...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
            <Calendar className="w-16 h-16 text-gray-200" />
            <p className="text-xl font-bold text-primary">No reservations found</p>
            <p className="text-sm text-soft-slate">Click "Generate Receipt" to add your first booking.</p>
            <button
              onClick={() => navigate('/reservation-receipt')}
              className="mt-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
            >
              + Add Reservation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Guest</th>
                  <th className="px-6 py-4 text-left">Room Type</th>
                  <th className="px-6 py-4 text-left">Check-in / Check-out</th>
                  <th className="px-6 py-4 text-left">Guests</th>
                  <th className="px-6 py-4 text-left">Tariff</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-6 py-5 text-xs font-bold text-soft-slate">#{res.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-primary text-xs font-black">
                          {res.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{res.guest_name}</p>
                          <p className="text-[10px] text-soft-slate">{res.guest_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-primary">{res.room_type}</p>
                      <p className="text-[10px] text-soft-slate">{res.num_rooms} room(s)</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-primary">
                        {formatDate(res.check_in)} → {formatDate(res.check_out)}
                      </p>
                      <p className="text-[10px] text-soft-slate">
                        {calcNights(res.check_in, res.check_out)} night(s)
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-primary">
                      <span className="font-bold">{res.adults}</span>
                      <span className="text-soft-slate"> adults</span>
                      {res.children > 0 && (
                        <span className="text-soft-slate">, {res.children} kids</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-primary">₹{Number(res.total_tariff).toLocaleString()}</p>
                      <p className="text-[10px] text-green-600 font-bold">
                        Adv: ₹{Number(res.advance).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={res.status}
                        onChange={(e) => updateStatus(res.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border-none cursor-pointer focus:ring-2 focus:ring-elegant-gold ${statusColors[res.status] || 'bg-gray-100 text-soft-slate'}`}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewReceipt(res)}
                          title="Generate Receipt"
                          className="p-2 text-soft-slate hover:text-elegant-gold hover:bg-elegant-gold/10 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendInvoice(res.id)}
                          title="Send Invoice Email"
                          className="p-2 text-soft-slate hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(res.id, 'Active')}
                          title="Mark Active"
                          className="p-2 text-soft-slate hover:text-elegant-gold hover:bg-background rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteReservation(res.id)}
                          title="Delete"
                          className="p-2 text-soft-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {receiptModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
          <div className="bg-[#f0f2f5] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl print:shadow-none print:max-h-none print:bg-white print:rounded-none">
            {/* Header / Controls (Hidden when printing) */}
            <div className="px-6 py-4 bg-white border-b flex justify-between items-center print:hidden rounded-t-3xl border-gray-200">
              <h3 className="text-xl font-black text-primary">Receipt Preview</h3>
              <div className="flex items-center gap-3">
                {selectedReservationId && (
                  <button
                    onClick={() => sendReceipt(selectedReservationId)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                    title="Email Receipt"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-bold">Email</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  title="Print / PDF"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Print PDF</span>
                </button>
                <button
                  onClick={() => setReceiptModalData(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 print:p-0 print:bg-white">
              <ReservationReceipt data={receiptModalData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
