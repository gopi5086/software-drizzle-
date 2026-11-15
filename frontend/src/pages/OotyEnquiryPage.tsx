import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Calendar,
  Mail,
  Mountain,
  MapPin,
  Users,
  Home,
  Coffee,
  Calculator,
  Loader2,
  CheckCircle2,
  CreditCard,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import UnifiedInvoice, { type UnifiedInvoiceData } from '../components/UnifiedInvoice';

const OotyEnquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editEnquiryId = (location.state as any)?.editEnquiryId;
  const isEditMode = !!editEnquiryId;
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    address: '',
    idProof: '',
    adults: 1,
    children: 0,
    checkIn: '',
    checkOut: '',
    checkInTime: '12:00 Noon',
    checkOutTime: '11:00 A.M',
    rooms: [{ type: 'Std Room', count: 1, rate: 2500 }],
    breakfast: 'Breakfast',
    breakfastAmount: 0,
    extraBed: false,
    extraBedAmount: 0,
    specialRequirements: '',
    specialRequirementsAmount: 0,
    earlyCheckinAmount: 0,
    lateCheckoutAmount: 0,
    advance: 0,
    status: 'Enquiry',
    bookedBy: 'Direct',
    comments: '',
  });

  const [isSearchingGuest, setIsSearchingGuest] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchEnquiry = async () => {
      try {
        const res = await api.get(`/enquiries/${editEnquiryId}`);
        const data = res.data;

        let parsedRooms = [{ type: 'Std Room', count: 1, rate: 2500 }];
        if (data.room_details) {
          try {
            parsedRooms = typeof data.room_details === 'string' ? JSON.parse(data.room_details) : Array.isArray(data.room_details) ? data.room_details : parsedRooms;
          } catch {
            parsedRooms = [{ type: data.room_type || 'Std Room', count: Number(data.num_rooms) || 1, rate: Number(data.total_tariff || 2500) }];
          }
        } else if (data.room_type) {
          parsedRooms = [{ type: data.room_type, count: Number(data.num_rooms) || 1, rate: Number(data.total_tariff || 2500) }];
        }

        setFormData({
          guestName: data.guest_name || '',
          guestPhone: data.guest_phone || '',
          guestEmail: data.guest_email || '',
          address: data.address || '',
          idProof: data.id_proof || '',
          adults: Number(data.adults) || 1,
          children: Number(data.children) || 0,
          checkIn: data.check_in ? new Date(data.check_in).toISOString().split('T')[0] : '',
          checkOut: data.check_out ? new Date(data.check_out).toISOString().split('T')[0] : '',
          checkInTime: data.check_in_time || '12:00 Noon',
          checkOutTime: data.check_out_time || '11:00 A.M',
          rooms: parsedRooms,
          breakfast: data.breakfast || 'Breakfast',
          breakfastAmount: Number(data.breakfast_amount) || 0,
          extraBed: Boolean(data.extra_bed || data.extraBed),
          extraBedAmount: Number(data.extra_bed_amount || data.extraBedAmount || 0),
          specialRequirements: data.special_requirements || '',
          specialRequirementsAmount: Number(data.special_requirements_amount) || 0,
          earlyCheckinAmount: Number(data.early_checkin_amount) || 0,
          lateCheckoutAmount: Number(data.late_checkout_amount) || 0,
          advance: Number(data.advance) || 0,
          status: data.status || 'Enquiry',
          bookedBy: data.booked_by || 'Direct',
          comments: data.comments || '',
        });
      } catch (err: any) {
        toast.error('Failed to load enquiry: ' + (err.response?.data?.message || err.message));
        navigate('/enquiries');
      }
    };

    fetchEnquiry();
  }, [editEnquiryId, isEditMode, navigate]);

  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 1;
    const diff = new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime();
    const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 1;
  }, [formData.checkIn, formData.checkOut]);

  const totalRooms = useMemo(
    () => formData.rooms.reduce((a, r) => a + (Number(r.count) || 1), 0),
    [formData.rooms]
  );

  const stayCost = useMemo(
    () =>
      formData.rooms.reduce(
        (a, r) => a + (Number(r.rate) || 0) * (Number(r.count) || 1) * Math.max(1, nights),
        0
      ),
    [formData.rooms, nights]
  );

  const extraBedCharge = useMemo(() => {
    return Number(formData.extraBedAmount) || 0;
  }, [formData.extraBedAmount]);

  const totalCost = useMemo(
    () =>
      stayCost +
      Number(formData.earlyCheckinAmount || 0) +
      Number(formData.lateCheckoutAmount || 0) +
      extraBedCharge +
      Number(formData.breakfastAmount || 0) +
      Number(formData.specialRequirementsAmount || 0),
    [stayCost, formData.earlyCheckinAmount, formData.lateCheckoutAmount, extraBedCharge, formData.breakfastAmount, formData.specialRequirementsAmount]
  );

  const balanceDue = useMemo(() => totalCost - Number(formData.advance || 0), [totalCost, formData.advance]);

  const invoiceData: UnifiedInvoiceData = {
    guestName: formData.guestName || 'Guest',
    guestPhone: formData.guestPhone,
    guestEmail: formData.guestEmail,
    checkIn: formData.checkIn,
    checkOut: formData.checkOut,
    adults: formData.adults,
    children: formData.children,
    numRooms: totalRooms,
    roomType: formData.rooms[0]?.type || 'Std Room',
    rooms: formData.rooms.map(room => ({
      type: room.type,
      count: Number(room.count) || 1,
      rate: Number(room.rate) || 0,
    })),
    specialRequirements: formData.specialRequirements,
    specialRequirementsAmount: Number(formData.specialRequirementsAmount || 0),
    earlyCheckinAmount: Number(formData.earlyCheckinAmount || 0),
    lateCheckoutAmount: Number(formData.lateCheckoutAmount || 0),
    extraBed: formData.extraBed || extraBedCharge > 0,
    extraBedAmount: extraBedCharge,
    totalTariff: totalCost,
    advance: Number(formData.advance || 0),
    balanceDue: balanceDue,
    nights,
    checkInTime: formData.checkInTime,
    checkOutTime: formData.checkOutTime,
    status: formData.status,
    created_at: new Date().toISOString(),
    address: formData.address,
    id_proof: formData.idProof,
    breakfast: formData.breakfast,
    breakfastAmount: Number(formData.breakfastAmount || 0),
    location: 'Ooty',
  };

  const roomTypes = ['Std Room', 'Del. Bal Room', 'Fam Room', 'Del. Villa'];

  const addRoom = () => setFormData(prev => ({ ...prev, rooms: [...prev.rooms, { type: 'Std Room', count: 1, rate: 2000 }] }));
  const removeRoom = (i: number) => {
    if (formData.rooms.length > 1) {
      const r = [...formData.rooms]; r.splice(i, 1);
      setFormData(prev => ({ ...prev, rooms: r }));
    }
  };
  const updateRoom = (i: number, field: string, value: any) => {
    const r = [...formData.rooms]; r[i] = { ...r[i], [field]: value };
    setFormData(prev => ({ ...prev, rooms: r }));
  };

  const fetchGuest = async (phone: string) => {
    if (!phone || phone.length < 10) return;
    setIsSearchingGuest(true);
    try {
      const res = await api.get(`/customers/phone/${phone}`);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          guestName: res.data.full_name || prev.guestName,
          guestEmail: res.data.email || prev.guestEmail,
          address: res.data.address || prev.address,
          idProof: res.data.id_proof || prev.idProof,
        }));
        toast.success(`Guest found: ${res.data.full_name}`);
      }
    } catch {
      toast.info('No existing guest found. Fill in details manually.');
    } finally {
      setIsSearchingGuest(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setSaving(true);
    try {
      const payload = {
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.guestPhone,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        adults: formData.adults,
        children: formData.children,
        room_type: formData.rooms[0]?.type || 'Std Room',
        num_rooms: totalRooms,
        room_details: formData.rooms,
        special_requirements: formData.specialRequirements,
        special_requirements_amount: formData.specialRequirementsAmount,
        early_checkin_amount: formData.earlyCheckinAmount,
        late_checkout_amount: formData.lateCheckoutAmount,
        stay_cosy_amount: stayCost,
        total_tariff: totalCost,
        advance: formData.advance,
        check_in_time: formData.checkInTime,
        check_out_time: formData.checkOutTime,
        status: formData.status,
        booked_by: formData.bookedBy,
        comments: formData.comments,
        address: formData.address,
        id_proof: formData.idProof,
        breakfast: formData.breakfast,
        breakfast_amount: formData.breakfastAmount,
        location: 'Ooty',
      };
      if (isEditMode) {
        await api.put(`/enquiries/${editEnquiryId}`, payload);
        toast.success('🏔️ Ooty enquiry updated successfully!');
      } else {
        await api.post('/enquiries', payload);
        toast.success('🏔️ Ooty enquiry registered successfully!');
      }
      navigate('/enquiries');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving enquiry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Mountain className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">Confirm Ooty Enquiry</h3>
                <p className="text-xs text-gray-400">Review details before saving</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              {[
                ['Guest', formData.guestName],
                ['Phone', formData.guestPhone],
                ['Check-In', formData.checkIn],
                ['Check-Out', formData.checkOut],
                ['Rooms', `${totalRooms} room(s)`],
                ['Nights', nights.toString()],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{label}</p>
                  <p className="font-bold text-gray-800 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Stay Cost</span>
                <span className="font-bold">₹ {stayCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">₹ {totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-emerald-200">
                <span className="text-emerald-700">Balance Due</span>
                <span className="text-emerald-700">₹ {balanceDue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ooty Enquiry Registration</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Hill Station Branch · Location: Ooty</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(prev => !prev)}
            className="flex items-center gap-2 px-5 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview Invoice'}
          </button>
          <button
            form="ooty-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-transform disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Register Enquiry
          </button>
        </div>
      </header>

      {/* Ooty Banner */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-6 overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">Drizzle Drop Inn</p>
              <h3 className="text-white text-2xl font-black">Ooty Hill Station Branch</h3>
              <p className="text-emerald-200 text-sm mt-1">Complete enquiry registration for guest stay</p>
            </div>
            <Mountain className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4">
        {showPreview && (
          <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Invoice Preview</h3>
                <p className="text-[10px] text-gray-400 font-bold">Live quotation as it will appear on the final invoice</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
              >
                Print Invoice
              </button>
            </div>
            <div className="overflow-x-auto">
              <UnifiedInvoice data={invoiceData} />
            </div>
          </div>
        )}

        <form id="ooty-form" onSubmit={handleSubmit} className="space-y-6">

          {/* Guest Details */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Guest Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.guestName}
                  onChange={e => setFormData(p => ({ ...p, guestName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="tel"
                    placeholder="+91 00000 00000"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-28 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={formData.guestPhone}
                    onChange={e => setFormData(p => ({ ...p, guestPhone: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => fetchGuest(formData.guestPhone)}
                    disabled={isSearchingGuest || !formData.guestPhone}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSearchingGuest ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check Guest'}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="e.g. guest@email.com"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={formData.guestEmail}
                    onChange={e => setFormData(p => ({ ...p, guestEmail: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Proof</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Aadhar / Voter ID / Driving License"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={formData.idProof}
                    onChange={e => setFormData(p => ({ ...p, idProof: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest Address</label>
                <textarea
                  placeholder="Enter permanent address..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Stay Information */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Stay Information</h3>
              <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ooty
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In Date *</label>
                <input
                  required type="date"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.checkIn}
                  onChange={e => setFormData(p => ({ ...p, checkIn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out Date *</label>
                <input
                  required type="date"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.checkOut}
                  onChange={e => setFormData(p => ({ ...p, checkOut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In Time</label>
                <input
                  type="text" placeholder="12:00 Noon"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.checkInTime}
                  onChange={e => setFormData(p => ({ ...p, checkInTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out Time</label>
                <input
                  type="text" placeholder="11:00 A.M"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.checkOutTime}
                  onChange={e => setFormData(p => ({ ...p, checkOutTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adults *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number" min="1" placeholder="1"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                    value={formData.adults === 0 ? '' : formData.adults}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData(p => ({ ...p, adults: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Children</label>
                <input
                  type="number" min="0" placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.children === 0 ? '' : formData.children}
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(p => ({ ...p, children: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Home className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Room Configuration</h3>
              <button
                type="button"
                onClick={addRoom}
                className="ml-auto flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Room Type
              </button>
            </div>
            {formData.rooms.map((room, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-2xl border border-gray-100 relative">
                <div className="col-span-12 md:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room Type</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                    value={room.type}
                    onChange={e => updateRoom(i, 'type', e.target.value)}
                  >
                    {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-6 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Count</label>
                  <input
                    type="number" min="1" placeholder="1"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                    value={room.count === 0 ? '' : room.count}
                    onFocus={e => e.target.select()}
                    onChange={e => updateRoom(i, 'count', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-6 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate/Night (₹)</label>
                  <input
                    type="number" min="0" placeholder="0"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                    value={room.rate === 0 ? '' : room.rate}
                    onFocus={e => e.target.select()}
                    onChange={e => updateRoom(i, 'rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  />
                </div>
                {formData.rooms.length > 1 && (
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRoom(i)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Inclusions & Add-ons */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Coffee className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Inclusions & Add-ons</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Meal Plan</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.breakfast}
                  onChange={e => setFormData(p => ({ ...p, breakfast: e.target.value }))}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="No Breakfast">No Breakfast</option>
                  <option value="MAP">MAP</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Early Check-in Amount (₹)</label>
                <input
                  type="number" min="0" placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.earlyCheckinAmount === 0 ? '' : formData.earlyCheckinAmount}
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(p => ({ ...p, earlyCheckinAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Late Check-out Amount (₹)</label>
                <input
                  type="number" min="0" placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.lateCheckoutAmount === 0 ? '' : formData.lateCheckoutAmount}
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(p => ({ ...p, lateCheckoutAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Extra Bed Amount (₹)</label>
                <input
                  type="number" min="0" placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.extraBedAmount === 0 ? '' : formData.extraBedAmount}
                  onFocus={e => e.target.select()}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setFormData(p => ({ ...p, extraBedAmount: val, extraBed: val > 0 }));
                  }}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Special Requirements</label>
                <textarea
                  placeholder="Any special requests for the Ooty stay..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.specialRequirements}
                  onChange={e => setFormData(p => ({ ...p, specialRequirements: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Special Requirements Amount (₹)</label>
                <input
                  type="number" min="0" placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.specialRequirementsAmount === 0 ? '' : formData.specialRequirementsAmount}
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(p => ({ ...p, specialRequirementsAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comments</label>
                <textarea
                  placeholder="Internal notes or follow-up comments for this enquiry..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={formData.comments}
                  onChange={e => setFormData(p => ({ ...p, comments: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booked By</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.bookedBy}
                  onChange={e => setFormData(p => ({ ...p, bookedBy: e.target.value }))}
                >
                  <option value="Direct">Direct</option>
                  <option value="Agent">Agent</option>
                  <option value="Website">Website</option>
                  <option value="OTA">OTA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Payment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advance Received (₹)</label>
                <input
                  type="number" min="0" placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.advance === 0 ? '' : formData.advance}
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(p => ({ ...p, advance: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Status</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                  value={formData.status}
                  onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                >
                  {['Confirmed', 'Enquiry', 'On Hold', 'In Progress', 'Cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-emerald-700 to-teal-800 rounded-3xl p-8 text-white shadow-xl shadow-emerald-700/30">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4 text-emerald-300" />
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Cost Summary</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Nights</span>
                <span className="font-black text-lg">{nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80 font-medium">ROOM Rent ({totalRooms} {totalRooms === 1 ? 'room' : 'rooms'} × {nights} {nights === 1 ? 'night' : 'nights'})</span>
                <span className="font-bold">₹ {stayCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80 font-medium">Early Checkin</span>
                <span className="font-bold">₹ {(Number(formData.earlyCheckinAmount) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80 font-medium">Late Checkout</span>
                <span className="font-bold">₹ {(Number(formData.lateCheckoutAmount) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80 font-medium">Extra Bed</span>
                <span className="font-bold">₹ {extraBedCharge.toLocaleString()}</span>
              </div>
              {Number(formData.breakfastAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/80 font-medium">Breakfast ({formData.breakfast})</span>
                  <span className="font-bold">₹ {Number(formData.breakfastAmount).toLocaleString()}</span>
                </div>
              )}
              {Number(formData.specialRequirementsAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/80 font-medium">Special Requirements</span>
                  <span className="font-bold">₹ {Number(formData.specialRequirementsAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/80 font-semibold">Net Pay / Total Amount</span>
                <span className="font-black text-base">₹ {totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Advance Paid</span>
                <span className="font-bold">₹ {Number(formData.advance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-3 mt-2">
                <span className="text-emerald-300 font-black uppercase tracking-widest text-xs">Balance Due at Hotel</span>
                <span className="text-3xl font-black text-emerald-300">₹ {balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons below Cost Summary */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-emerald-400 text-emerald-600 bg-white rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Preview Invoice
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-xl shadow-emerald-600/20 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Register Enquiry
            </button>
          </div>
        </form>
      </div>

      {/* Invoice Modal Overlay */}
      {showInvoiceModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          onClick={() => setShowInvoiceModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Invoice Preview</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Live quotation — Ooty Enquiry</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-x-auto p-2">
              <UnifiedInvoice data={invoiceData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OotyEnquiryPage;
