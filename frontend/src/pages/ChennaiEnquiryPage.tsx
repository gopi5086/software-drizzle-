import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Calendar,
  Mail,
  Building2,
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

const ChennaiEnquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editEnquiryId = (location.state as any)?.editEnquiryId;
  const editReservationId = (location.state as any)?.editReservationId;
  const isEditMode = !!(editEnquiryId || editReservationId);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<{
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    address: string;
    idProof: string;
    adults: number | string;
    children: number | string;
    checkIn: string;
    checkOut: string;
    checkInTime: string;
    checkOutTime: string;
    rooms: { type: string; count: number | string; rate: number | string }[];
    breakfast: string;
    breakfastAmount: number | string;
    specialRequirements: string;
    specialRequirementsAmount: number | string;
    earlyCheckinAmount: number | string;
    lateCheckoutAmount: number | string;
    advance: number | string;
    status: string;
    bookedBy: string;
    comments: string;
  }>({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    address: '',
    idProof: '',
    adults: '',
    children: '',
    checkIn: '',
    checkOut: '',
    checkInTime: '12:00 Noon',
    checkOutTime: '11:00 A.M',
    rooms: [{ type: 'Std Room', count: '', rate: '' }],
    breakfast: 'No Breakfast',
    breakfastAmount: '',
    specialRequirements: '',
    specialRequirementsAmount: '',
    earlyCheckinAmount: '',
    lateCheckoutAmount: '',
    advance: '',
    status: 'Enquiry',
    bookedBy: 'Direct',
    comments: '',
  });

  const [isSearchingGuest, setIsSearchingGuest] = useState(false);

  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) {
      setFormData(prev => ({
        ...prev,
        guestName: prefill.guestName || prev.guestName,
        guestPhone: prefill.guestPhone || prev.guestPhone,
        guestEmail: prefill.guestEmail || prev.guestEmail,
        address: prefill.address || prev.address,
        idProof: prefill.idProof || prev.idProof,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchDetails = async () => {
      try {
        const endpoint = editReservationId ? `/reservations/${editReservationId}` : `/enquiries/${editEnquiryId}`;
        const res = await api.get(endpoint);
        const data = res.data;

        let parsedRooms = [{ type: 'Std Room', count: '', rate: '' }];
        if (data.room_details) {
          try {
            parsedRooms = typeof data.room_details === 'string' ? JSON.parse(data.room_details) : Array.isArray(data.room_details) ? data.room_details : parsedRooms;
          } catch {
            parsedRooms = [{ type: data.room_type || 'Std Room', count: data.num_rooms ?? '', rate: data.total_tariff ?? '' }];
          }
        } else if (data.room_type) {
          parsedRooms = [{ type: data.room_type, count: data.num_rooms ?? '', rate: data.total_tariff ?? '' }];
        }

        setFormData({
          guestName: data.guest_name || '',
          guestPhone: data.guest_phone || '',
          guestEmail: data.guest_email || '',
          address: data.address || '',
          idProof: data.id_proof || '',
          adults: data.adults !== null && data.adults !== undefined ? data.adults : '',
          children: data.children !== null && data.children !== undefined ? data.children : '',
          checkIn: data.check_in ? new Date(data.check_in).toISOString().split('T')[0] : '',
          checkOut: data.check_out ? new Date(data.check_out).toISOString().split('T')[0] : '',
          checkInTime: data.check_in_time || '12:00 Noon',
          checkOutTime: data.check_out_time || '11:00 A.M',
          rooms: parsedRooms,
          breakfast: data.breakfast || 'No Breakfast',
          breakfastAmount: data.breakfast_amount !== null && data.breakfast_amount !== undefined ? data.breakfast_amount : '',
          specialRequirements: data.special_requirements || '',
          specialRequirementsAmount: data.special_requirements_amount !== null && data.special_requirements_amount !== undefined ? data.special_requirements_amount : '',
          earlyCheckinAmount: data.early_checkin_amount !== null && data.early_checkin_amount !== undefined ? data.early_checkin_amount : '',
          lateCheckoutAmount: data.late_checkout_amount !== null && data.late_checkout_amount !== undefined ? data.late_checkout_amount : '',
          advance: data.advance !== null && data.advance !== undefined ? data.advance : '',
          status: data.status || (editReservationId ? 'Confirmed' : 'Enquiry'),
          bookedBy: data.booked_by || 'Direct',
          comments: data.comments || '',
        });
      } catch (err: any) {
        toast.error('Failed to load details: ' + (err.response?.data?.message || err.message));
        navigate(editReservationId ? '/reservations' : '/enquiries');
      }
    };

    fetchDetails();
  }, [editEnquiryId, editReservationId, isEditMode, navigate]);

  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const diff = new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime();
    const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 1;
  }, [formData.checkIn, formData.checkOut]);

  const totalRooms = useMemo(() => formData.rooms.reduce((a, r) => a + (Number(r.count) || 0), 0), [formData.rooms]);

  const stayCost = useMemo(
    () => formData.rooms.reduce((a, r) => a + (Number(r.rate) || 0) * (Number(r.count) || 0) * nights, 0),
    [formData.rooms, nights]
  );

  const totalCost = useMemo(
    () =>
      stayCost +
      Number(formData.breakfastAmount || 0) +
      Number(formData.specialRequirementsAmount || 0) +
      Number(formData.earlyCheckinAmount || 0) +
      Number(formData.lateCheckoutAmount || 0),
    [stayCost, formData]
  );

  const balanceDue = useMemo(() => totalCost - Number(formData.advance || 0), [totalCost, formData.advance]);

  const invoiceData: UnifiedInvoiceData = {
    guestName: formData.guestName || 'Guest',
    guestPhone: formData.guestPhone,
    guestEmail: formData.guestEmail,
    checkIn: formData.checkIn,
    checkOut: formData.checkOut,
    adults: Number(formData.adults) || 0,
    children: Number(formData.children) || 0,
    numRooms: totalRooms || 1,
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
    location: 'Chennai',
  };

  const roomTypes = ['Std Room', 'Del. Bal Room', 'Fam Room', 'Del. Villa'];

  const ratePerNight = formData.rooms.reduce((sum, room) => sum + (Number(room.rate) || 0) * (Number(room.count) || 0), 0);

  const addRoom = () => setFormData(prev => ({ ...prev, rooms: [...prev.rooms, { type: 'Std Room', count: '', rate: '' }] }));
  const removeRoom = (i: number) => {
    if (formData.rooms.length > 1) {
      const r = [...formData.rooms];
      r.splice(i, 1);
      setFormData(prev => ({ ...prev, rooms: r }));
    }
  };
  const updateRoom = (i: number, field: string, value: any) => {
    const r = [...formData.rooms];
    r[i] = { ...r[i], [field]: value };
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
        adults: Number(formData.adults) || 1,
        children: Number(formData.children) || 0,
        room_type: formData.rooms[0]?.type || 'Std Room',
        num_rooms: totalRooms || 1,
        room_details: formData.rooms.map(r => ({
          type: r.type,
          count: Number(r.count) || 1,
          rate: Number(r.rate) || 0,
        })),
        special_requirements: formData.specialRequirements,
        special_requirements_amount: Number(formData.specialRequirementsAmount) || 0,
        early_checkin_amount: Number(formData.earlyCheckinAmount) || 0,
        late_checkout_amount: Number(formData.lateCheckoutAmount) || 0,
        stay_cosy_amount: stayCost,
        total_tariff: totalCost,
        advance: Number(formData.advance) || 0,
        check_in_time: formData.checkInTime,
        check_out_time: formData.checkOutTime,
        status: formData.status,
        booked_by: formData.bookedBy,
        comments: formData.comments,
        address: formData.address,
        id_proof: formData.idProof,
        breakfast: formData.breakfast,
        breakfast_amount: Number(formData.breakfastAmount) || 0,
        location: 'Chennai',
      };
      if (editReservationId) {
        await api.put(`/reservations/${editReservationId}`, payload);
        toast.success('🏙️ Chennai reservation updated successfully!');
        navigate('/reservations');
      } else if (editEnquiryId) {
        await api.put(`/enquiries/${editEnquiryId}`, payload);
        toast.success('🏙️ Chennai enquiry updated successfully!');
        navigate('/enquiries');
      } else {
        await api.post('/enquiries', payload);
        toast.success('🏙️ Chennai enquiry registered successfully!');
        navigate('/enquiries');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving enquiry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">Confirm Chennai Enquiry</h3>
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
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Stay Cost</span>
                <span className="font-bold">₹ {stayCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">₹ {totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-blue-200">
                <span className="text-blue-700">Balance Due</span>
                <span className="text-blue-700">₹ {balanceDue.toLocaleString()}</span>
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
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {editReservationId ? 'Edit Chennai Reservation' : isEditMode ? 'Edit Chennai Enquiry' : 'Chennai Enquiry Registration'}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">City Branch · Location: Chennai</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Drizzle Drop Inn</p>
              <h3 className="text-white text-2xl font-black">Chennai City Branch</h3>
              <p className="text-blue-200 text-sm mt-1">
                {editReservationId ? 'Update reservation details and quotation for guest stay' : 'Complete enquiry registration for guest stay'}
              </p>
            </div>
            <Building2 className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {showPreview && (
          <div className="mb-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm overflow-hidden">
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

        <form id="chennai-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Guest Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-28 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.guestPhone}
                    onChange={e => setFormData(p => ({ ...p, guestPhone: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => fetchGuest(formData.guestPhone)}
                    disabled={isSearchingGuest || !formData.guestPhone}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg disabled:opacity-50 flex items-center gap-1"
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Stay Information</h3>
              <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Chennai
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In Date *</label>
                <input
                  required type="date"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.checkIn}
                  onChange={e => setFormData(p => ({ ...p, checkIn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out Date *</label>
                <input
                  required type="date"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.checkOut}
                  onChange={e => setFormData(p => ({ ...p, checkOut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In Time</label>
                <input
                  type="text" placeholder="12:00 Noon"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.checkInTime}
                  onChange={e => setFormData(p => ({ ...p, checkInTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out Time</label>
                <input
                  type="text" placeholder="11:00 A.M"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.checkOutTime}
                  onChange={e => setFormData(p => ({ ...p, checkOutTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adults *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number" min="1"
                    placeholder="1"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                    value={formData.adults}
                    onChange={e => setFormData(p => ({ ...p, adults: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) }))}
                    onFocus={e => e.target.select()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Children</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                  value={formData.children}
                  onChange={e => setFormData(p => ({ ...p, children: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Home className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Room Configuration</h3>
              <button
                type="button"
                onClick={addRoom}
                className="ml-auto flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Room Type
              </button>
            </div>
            {formData.rooms.map((room, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-2xl border border-gray-100 relative">
                <div className="col-span-12 md:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room Category</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                    value={room.type}
                    onChange={e => updateRoom(i, 'type', e.target.value)}
                  >
                    {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-6 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Count</label>
                  <input
                    type="number" min="1"
                    placeholder="1"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                    value={room.count}
                    onChange={e => updateRoom(i, 'count', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    onFocus={e => e.target.select()}
                  />
                </div>
                <div className="col-span-6 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate/Night (₹)</label>
                  <input
                    type="number" min="0"
                    placeholder="0"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                    value={room.rate}
                    onChange={e => updateRoom(i, 'rate', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                    onFocus={e => e.target.select()}
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

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Coffee className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Inclusions & Add-ons</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Meal Plan</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                  value={formData.breakfast}
                  onChange={e => setFormData(p => ({ ...p, breakfast: e.target.value }))}
                >
                  <option value="No Breakfast">No Breakfast</option>
                  <option value="Buffet Breakfast">Buffet Breakfast</option>
                  <option value="Partial Breakfast">Partial Breakfast</option>
                  <option value="MAP">MAP</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Breakfast Amount (₹)</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.breakfastAmount}
                  onChange={e => setFormData(p => ({ ...p, breakfastAmount: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Early Check-in Amount (₹)</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.earlyCheckinAmount}
                  onChange={e => setFormData(p => ({ ...p, earlyCheckinAmount: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Late Check-out Amount (₹)</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.lateCheckoutAmount}
                  onChange={e => setFormData(p => ({ ...p, lateCheckoutAmount: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Special Requirements</label>
                <textarea
                  placeholder="Any special requests for the Chennai stay..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.specialRequirements}
                  onChange={e => setFormData(p => ({ ...p, specialRequirements: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Special Requirements Amount (₹)</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.specialRequirementsAmount}
                  onChange={e => setFormData(p => ({ ...p, specialRequirementsAmount: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comments</label>
                <textarea
                  placeholder="Internal notes or follow-up comments for this enquiry..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.comments}
                  onChange={e => setFormData(p => ({ ...p, comments: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booked By</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
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

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Payment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate (₹ / Night)</label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl py-4 px-5 text-sm text-gray-700 font-bold"
                  value={ratePerNight.toLocaleString('en-IN')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Pay (₹)</label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl py-4 px-5 text-sm text-gray-700 font-bold"
                  value={totalCost.toLocaleString('en-IN')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advance Received (₹)</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                  value={formData.advance}
                  onChange={e => setFormData(p => ({ ...p, advance: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Status</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
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

          <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-700/30">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4 text-blue-200" />
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Cost Summary</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Nights</span>
                <span className="font-black text-lg">{nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Room Cost ({totalRooms} room × {nights} nights)</span>
                <span className="font-bold">₹ {stayCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Net Pay</span>
                <span className="font-bold">₹ {totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Advance Paid</span>
                <span className="font-bold">₹ {Number(formData.advance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-3 mt-2">
                <span className="text-blue-200 font-black uppercase tracking-widest text-xs">Balance Due at Hotel</span>
                <span className="text-3xl font-black text-blue-200">₹ {balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(prev => !prev)}
              className="flex items-center gap-2 px-8 py-4 border-2 border-blue-200 bg-white text-blue-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all hover:scale-[1.02]"
            >
              <FileText className="w-5 h-5" />
              {showPreview ? 'Hide Preview' : 'Preview Invoice'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Register Enquiry
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ChennaiEnquiryPage;
