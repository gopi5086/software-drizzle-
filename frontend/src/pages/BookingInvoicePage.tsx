import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import UnifiedInvoice, { type UnifiedInvoiceData } from '../components/UnifiedInvoice';

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
  room_details?: string; // JSON string
  special_requirements?: string;
  special_requirements_amount?: number;
  early_checkin_amount?: number;
  late_checkout_amount?: number;
  total_tariff: number;
  advance: number;
  status: string;
  created_at: string;
}

const fmt = (d: string) => {
  if (!d) return '--';
  const baseDate = d.includes('T') ? d.split('T')[0] : d;
  const dateObj = new Date(baseDate + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return '--';
  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: '2-digit'
  }).replace(/ /g, '-');
};

const nights = (ci: string, co: string) => {
  if (!ci || !co) return 1;
  const baseCi = ci.includes('T') ? ci.split('T')[0] : ci;
  const baseCo = co.includes('T') ? co.split('T')[0] : co;
  const diff = new Date(baseCo + 'T00:00:00').getTime() - new Date(baseCi + 'T00:00:00').getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
};

const BookingInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [res, setRes] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await api.get(`/reservations/${id}`);
        setRes(r.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load reservation');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-elegant-gold" />
        <p className="text-sm font-bold text-soft-slate uppercase tracking-widest">Loading Invoice...</p>
      </div>
    </div>
  );

  if (error || !res) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-lg font-bold text-primary">{error || 'Reservation not found'}</p>
        <button onClick={() => navigate('/reservations')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">
          Back to Reservations
        </button>
      </div>
    </div>
  );

  const parseRooms = (jsonStr?: string) => {
    try {
      return jsonStr ? JSON.parse(jsonStr) : [];
    } catch (e) {
      return [];
    }
  };

  const invoiceData: UnifiedInvoiceData = {
    guestName: res.guest_name,
    guestEmail: res.guest_email,
    guestPhone: res.guest_phone,
    checkIn: res.check_in,
    checkOut: res.check_out,
    adults: res.adults,
    children: res.children,
    numRooms: res.num_rooms,
    roomType: res.room_type,
    rooms: parseRooms(res.room_details),
    specialRequirements: res.special_requirements,
    specialRequirementsAmount: Number(res.special_requirements_amount || 0),
    earlyCheckinAmount: Number(res.early_checkin_amount || 0),
    lateCheckoutAmount: Number(res.late_checkout_amount || 0),
    stayCosyAmount: Number(res.stay_cosy_amount || 0),
    totalTariff: Number(res.total_tariff),
    advance: Number(res.advance),
    balanceDue: Number(res.total_tariff) - Number(res.advance),
    checkInTime: res.check_in_time,
    checkOutTime: res.check_out_time,
  };

  return (
    <div className="min-h-screen pb-16 animate-in fade-in duration-500 print:pb-0 print:min-h-0 print:animate-none">

      {/* ── Action Bar (hidden on print) ── */}
      <div className="print:hidden sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border-subtle px-4 py-3 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reservations')} className="p-2 hover:bg-white rounded-full transition-colors border border-border-subtle">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h2 className="text-xl font-black text-primary tracking-tight">Invoice {invoiceNo}</h2>
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">{res.guest_name} · {res.room_type} · {n} Night{n !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border-subtle text-primary rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-elegant-gold" />
            Print Invoice
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <Download className="w-4 h-4 text-elegant-gold" />
            Download PDF
          </button>
        </div>
      </div>

      <div ref={invoiceRef} className="print:m-0 print:p-0">
        <UnifiedInvoice data={invoiceData} />
      </div>
    </div>
  );
};

export default BookingInvoicePage;
