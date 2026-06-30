import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Home,
  Users,
  Clock,
  CreditCard,
  Calculator,
  Printer,
  Download,
  CheckCircle2,
  X,
  Save,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import ReservationReceipt, { type ReceiptData } from '../components/ReservationReceipt';


const roomTypes = ['Standard Room', 'Deluxe Room', 'Triple Room'];

const ReservationReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    rooms: [{ type: 'Deluxe Room', count: 1, rate: 2500 }],
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    totalTariff: 0,
    advance: 0,
    specialRequirements: '',
    specialRequirementsAmount: 0,
    earlyCheckinAmount: 0,
    lateCheckoutAmount: 0,
    stayCosyAmount: 0,
    checkInTime: '12:00 Noon',
    checkOutTime: '11:00 A.M',
  });

  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 1;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [formData.checkIn, formData.checkOut]);

  const totalRoomsCount = useMemo(() => {
    return formData.rooms.reduce((acc, room) => acc + room.count, 0);
  }, [formData.rooms]);

  const autoTotalTariff = useMemo(() => {
    return formData.rooms.reduce((acc, room) => acc + (room.rate * room.count * nights), 0) +
           formData.specialRequirementsAmount +
           formData.earlyCheckinAmount +
           formData.lateCheckoutAmount +
           formData.stayCosyAmount;
  }, [formData.rooms, nights, formData.specialRequirementsAmount, formData.earlyCheckinAmount, formData.lateCheckoutAmount, formData.stayCosyAmount]);

  const balanceDue = useMemo(() => {
    return Math.max(0, (formData.totalTariff || autoTotalTariff) - formData.advance);
  }, [formData.totalTariff, autoTotalTariff, formData.advance]);

  const receiptData: ReceiptData = {
    ...formData,
    numRooms: totalRoomsCount,
    roomType: formData.rooms[0]?.type || 'N/A',
    totalTariff: formData.totalTariff || autoTotalTariff,
    balanceDue,
  };

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [...formData.rooms, { type: 'Standard Room', count: 1, rate: 2000 }]
    });
  };

  const removeRoom = (index: number) => {
    if (formData.rooms.length > 1) {
      const newRooms = [...formData.rooms];
      newRooms.splice(index, 1);
      setFormData({ ...formData, rooms: newRooms });
    }
  };

  const updateRoom = (index: number, field: string, value: any) => {
    const newRooms = [...formData.rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setFormData({ ...formData, rooms: newRooms });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.guestPhone || !formData.checkIn || !formData.checkOut) {
      toast.error('Please fill in all required fields (Name, Phone, Check-in, Check-out).');
      return;
    }

    setIsSaving(true);
    try {
      // Map frontend fields to backend column names
      const payload = {
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.guestPhone,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        adults: formData.adults,
        children: formData.children,
        room_type: formData.rooms[0]?.type || 'N/A',
        num_rooms: totalRoomsCount,
        room_details: formData.rooms,
        special_requirements: formData.specialRequirements,
        special_requirements_amount: formData.specialRequirementsAmount,
        early_checkin_amount: formData.earlyCheckinAmount,
        late_checkout_amount: formData.lateCheckoutAmount,
        stay_cosy_amount: formData.stayCosyAmount,
        total_tariff: formData.totalTariff || autoTotalTariff,
        advance: formData.advance,
        check_in_time: formData.checkInTime,
        check_out_time: formData.checkOutTime,
        status: 'Upcoming'
      };

      await api.post('/reservations', payload);
      setShowPreview(true);
      toast.success('Reservation saved to Database!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save reservation to MySQL');
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (field: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleDownloadPDF = () => {
    window.print();
  };

  const inputCls =
    'w-full bg-background border-none rounded-xl py-3.5 px-5 text-sm focus:ring-2 focus:ring-elegant-gold transition-all font-medium';
  const labelCls = 'text-[10px] font-bold text-soft-slate uppercase tracking-widest';

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700 print:pb-0 print:min-h-0 print:animate-none">
      {/* Sticky Header */}
      <header className="flex justify-between items-center mb-8 sticky top-0 bg-background/90 backdrop-blur-md py-4 z-20 border-b border-border-subtle px-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors border border-border-subtle"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Reservation Receipt</h2>
            <p className="text-xs font-bold text-soft-slate uppercase tracking-widest mt-0.5">
              Quick Booking Confirmation Generator
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${showPreview
                ? 'bg-elegant-gold text-deep-charcoal'
                : 'bg-white border border-border-subtle text-primary'
              }`}
          >
            {showPreview ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {showPreview ? 'Close Preview' : 'Preview Receipt'}
          </button>
          <button
            form="receipt-form"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-7 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-elegant-gold" />
            ) : (
              <Save className="w-4 h-4 text-elegant-gold" />
            )}
            {isSaving ? 'Saving...' : 'Generate & Save'}
          </button>
        </div>
      </header>

      <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-10 transition-all duration-500 print:block print:w-full`}>

        {/* ===== FORM ===== */}
        <section className="glass-card p-8 rounded-[2.5rem] border border-border-subtle shadow-2xl print:hidden">
          <form id="receipt-form" onSubmit={handleSave} className="space-y-8">

            {/* Guest Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="w-4 h-4 text-elegant-gold" />
                <h3 className="text-xs font-black text-primary uppercase tracking-widest">Guest Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelCls}>Guest Full Name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Gopi Kumar"
                    className={inputCls}
                    value={formData.guestName}
                    onChange={e => setField('guestName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="tel" required
                      placeholder="+91 00000 00000"
                      className={`${inputCls} pl-11`}
                      value={formData.guestPhone}
                      onChange={e => setField('guestPhone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelCls}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="email"
                      placeholder="e.g. gopi@example.com"
                      className={`${inputCls} pl-11`}
                      value={formData.guestEmail}
                      onChange={e => setField('guestEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Information */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Calendar className="w-4 h-4 text-elegant-gold" />
                <h3 className="text-xs font-black text-primary uppercase tracking-widest">Stay Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Check-in Date */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Check-In Date *</label>
                  <input
                    type="date" required
                    className={inputCls}
                    value={formData.checkIn}
                    onChange={e => setField('checkIn', e.target.value)}
                  />
                </div>
                {/* Check-out Date */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Check-Out Date *</label>
                  <input
                    type="date" required
                    className={inputCls}
                    value={formData.checkOut}
                    onChange={e => setField('checkOut', e.target.value)}
                  />
                </div>
                {/* Check-in Time */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Check-In Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="text"
                      placeholder="12:00 Noon"
                      className={`${inputCls} pl-11`}
                      value={formData.checkInTime}
                      onChange={e => setField('checkInTime', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Check-Out Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="text"
                      placeholder="11:00 A.M"
                      className={`${inputCls} pl-11`}
                      value={formData.checkOutTime}
                      onChange={e => setField('checkOutTime', e.target.value)}
                    />
                  </div>
                </div>
                {/* Multiple Room Selection */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-elegant-gold" />
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Rooms Configuration</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addRoom}
                      className="flex items-center gap-1 text-[10px] font-black text-elegant-gold uppercase tracking-tighter bg-elegant-gold/10 px-3 py-1.5 rounded-lg hover:bg-elegant-gold/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Type
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.rooms.map((room, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-background/50 p-4 rounded-2xl border border-border-subtle relative group">
                        <div className="md:col-span-6 space-y-1.5">
                          <label className={labelCls}>Room Type</label>
                          <select
                            className={`${inputCls} font-bold text-primary appearance-none`}
                            value={room.type}
                            onChange={e => updateRoom(idx, 'type', e.target.value)}
                          >
                            {roomTypes.map(type => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <label className={labelCls}>Count</label>
                          <input
                            type="number" min="1"
                            className={`${inputCls} font-black text-center`}
                            value={room.count}
                            onChange={e => updateRoom(idx, 'count', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5">
                          <label className={labelCls}>Rate (₹)</label>
                          <input
                            type="number"
                            className={`${inputCls} font-black`}
                            value={room.rate}
                            onChange={e => updateRoom(idx, 'rate', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-center pb-1">
                          <button
                            type="button"
                            onClick={() => removeRoom(idx)}
                            disabled={formData.rooms.length === 1}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Users className="w-4 h-4 text-elegant-gold" />
                <h3 className="text-xs font-black text-primary uppercase tracking-widest">Number of Guests</h3>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelCls}>Adults</label>
                  <input
                    type="number" min="1"
                    className={`${inputCls} font-bold`}
                    value={formData.adults}
                    onChange={e => setField('adults', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Kids (Below 10 yrs)</label>
                  <input
                    type="number" min="0"
                    className={`${inputCls} font-bold`}
                    value={formData.children}
                    onChange={e => setField('children', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <CreditCard className="w-4 h-4 text-elegant-gold" />
                <h3 className="text-xs font-black text-primary uppercase tracking-widest">Payment Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelCls}>Early Check-in (₹)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={formData.earlyCheckinAmount}
                    onChange={e => setField('earlyCheckinAmount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Late Check-out (₹)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={formData.lateCheckoutAmount}
                    onChange={e => setField('lateCheckoutAmount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Stay Cosy Amount (₹)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={formData.stayCosyAmount}
                    onChange={e => setField('stayCosyAmount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelCls}>Special Requirements</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    placeholder="e.g. Birthday cake, Extra towels..."
                    value={formData.specialRequirements}
                    onChange={e => setField('specialRequirements', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Special Req. Amount (₹)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={formData.specialRequirementsAmount}
                    onChange={e => setField('specialRequirementsAmount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Total Tariff (₹) [Override]</label>
                  <input
                    type="number" min="0"
                    className={`${inputCls} font-bold text-primary`}
                    value={formData.totalTariff || ''}
                    placeholder={`Auto: ₹${autoTotalTariff}`}
                    onChange={e => setField('totalTariff', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Advance Received (₹)</label>
                  <input
                    type="number" min="0"
                    className={`${inputCls} font-bold text-green-700`}
                    value={formData.advance || ''}
                    placeholder="e.g. 500"
                    onChange={e => setField('advance', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Auto Summary */}
            <div className="bg-primary p-6 rounded-2xl text-white space-y-3 shadow-xl shadow-primary/20 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 text-elegant-gold" />
                <p className="text-[10px] font-bold text-elegant-gold uppercase tracking-widest">Auto-Calculation</p>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60">Nights:</span>
                <span className="font-black text-lg">{nights}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60">Total Amount:</span>
                <span className="font-black text-lg">₹ {(formData.totalTariff || autoTotalTariff).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60">Advance Received:</span>
                <span className="font-black text-lg text-green-400">₹ {formData.advance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-lg pt-1">
                <span className="text-elegant-gold font-black uppercase tracking-widest text-xs">Balance Due @ Hotel:</span>
                <span className="font-black text-2xl text-elegant-gold">₹ {balanceDue.toLocaleString()}</span>
              </div>
            </div>

          </form>
        </section>

        {/* ===== PREVIEW ===== */}
        {showPreview && (
          <section className="sticky top-28 h-fit lg:max-h-[calc(100vh-160px)] overflow-y-auto pr-1 scrollbar-hide print:relative print:top-0 print:p-0 print:m-0 print:overflow-visible print:w-full">
            <div className="flex items-center justify-between mb-4 bg-white/60 p-4 rounded-2xl backdrop-blur-sm border border-border-subtle print:hidden">
              <div>
                <h3 className="text-sm font-black text-primary uppercase">Receipt Preview</h3>
                <p className="text-[10px] font-bold text-soft-slate">Exactly as it will appear when printed</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-border-subtle shadow-sm"
                  title="Print Receipt"
                >
                  <Printer className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-border-subtle shadow-sm"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
            <ReservationReceipt data={receiptData} />
          </section>
        )}
      </div>

      {/* Mobile FAB */}
      {!showPreview && (
        <button
          onClick={() => { if (formData.guestName && formData.checkIn) setShowPreview(true); else toast.warning('Fill in Name and Check-in date first.'); }}
          className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-white"
        >
          <CheckCircle2 className="w-8 h-8 text-elegant-gold" />
        </button>
      )}
    </div>
  );
};

export default ReservationReceiptPage;
