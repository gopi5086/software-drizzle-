import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Printer,
  Download,
  User,
  Phone,
  Calendar,
  Home,
  CheckCircle2,
  Coffee,
  X,
  CreditCard,
  Calculator,
  Mail,
  PlusSquare,
  Trash2,
  Plus,
  LogOut,
  Loader2,
  MapPin
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import UnifiedInvoice, { type UnifiedInvoiceData } from '../components/UnifiedInvoice';
import Modal from '../components/Modal';
import api from '../api/axios';
import logo from '../assets/logo.png'; // Use logo.png asset


const CreateReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const handleLogout = () => {
    navigate('/');
  };

  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<{
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    adults: number | string;
    children: number | string;
    rooms: { type: string; count: number | string; rate: number | string }[];
    roomNo: string;
    breakfast: string;
    breakfastAmount: number | string;
    extraBed: boolean;
    specialRequirements: string;
    specialRequirementsAmount: number | string;
    earlyCheckinAmount: number | string;
    lateCheckoutAmount: number | string;
    stayCosyAmount: number | string;
    totalTariff: number | string;
    address: string;
    idProof: string;
    checkInTime: string;
    checkOutTime: string;
    foodBill: number | string;
    advance: number | string;
    status: string;
    bookedBy: string;
    location: string;
  }>({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    checkIn: '',
    checkOut: '',
    adults: '',
    children: '',
    rooms: [{ type: 'Std Room', count: '', rate: '' }],
    roomNo: '',
    breakfast: 'No Breakfast',
    breakfastAmount: '',
    extraBed: false,
    specialRequirements: '',
    specialRequirementsAmount: '',
    earlyCheckinAmount: '',
    lateCheckoutAmount: '',
    stayCosyAmount: '',
    totalTariff: '',
    address: '',
    idProof: '',
    checkInTime: '12:00 Noon',
    checkOutTime: '11:00 A.M',
    foodBill: '',
    advance: '',
    status: 'Pending',
    bookedBy: 'Direct',
    location: (location.state as any)?.location || 'Chennai',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!isEditMode) {
      const loc = (location.state as any)?.location;
      if (loc === 'Ooty') {
        navigate('/create-ooty-enquiry', { replace: true, state: location.state });
      } else if (loc === 'Chennai') {
        navigate('/create-chennai-enquiry', { replace: true, state: location.state });
      } else {
        navigate('/enquiries', { replace: true });
      }
    }
  }, [isEditMode, location.state, navigate]);

  // Load existing reservation in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchReservation = async () => {
        try {
          const res = await api.get(`/reservations/${id}`);
          const data = res.data;
          
          let parsedRooms: { type: string; count: number | string; rate: number | string }[] = [{ type: 'Std Room', count: '', rate: '' }];
          if (data.room_details) {
            try {
              if (typeof data.room_details === 'string') {
                parsedRooms = JSON.parse(data.room_details);
              } else if (Array.isArray(data.room_details)) {
                parsedRooms = data.room_details;
              }
            } catch (e) {
              console.error(e);
            }
          } else if (data.room_type) {
            parsedRooms = [{ type: data.room_type, count: data.num_rooms ?? '', rate: data.total_tariff ?? '' }];
          }

          setFormData({
            guestName: data.guest_name || '',
            guestPhone: data.guest_phone || '',
            guestEmail: data.guest_email || '',
            checkIn: data.check_in ? formatDateForInput(data.check_in) : '',
            checkOut: data.check_out ? formatDateForInput(data.check_out) : '',
            adults: data.adults !== null && data.adults !== undefined ? data.adults : '',
            children: data.children !== null && data.children !== undefined ? data.children : '',
            rooms: parsedRooms,
            roomNo: '',
            breakfast: data.breakfast !== undefined && data.breakfast !== null ? data.breakfast : 'No Breakfast',
            breakfastAmount: data.breakfast_amount !== null && data.breakfast_amount !== undefined ? data.breakfast_amount : '',
            extraBed: false,
            specialRequirements: data.special_requirements || '',
            specialRequirementsAmount: data.special_requirements_amount !== null && data.special_requirements_amount !== undefined ? data.special_requirements_amount : '',
            earlyCheckinAmount: data.early_checkin_amount !== null && data.early_checkin_amount !== undefined ? data.early_checkin_amount : '',
            lateCheckoutAmount: data.late_checkout_amount !== null && data.late_checkout_amount !== undefined ? data.late_checkout_amount : '',
            stayCosyAmount: data.stay_cosy_amount !== null && data.stay_cosy_amount !== undefined ? data.stay_cosy_amount : '',
            totalTariff: data.total_tariff !== null && data.total_tariff !== undefined ? data.total_tariff : '',
            address: data.address || '',
            idProof: data.id_proof || '',
            checkInTime: data.check_in_time || '12:00 Noon',
            checkOutTime: data.check_out_time || '11:00 A.M',
            foodBill: '',
            advance: data.advance !== null && data.advance !== undefined ? data.advance : '',
            status: data.status || 'Confirmed',
            bookedBy: data.booked_by || 'Direct',
            location: data.location || 'Ooty',
          });
        } catch (err: any) {
          toast.error('Failed to fetch reservation details: ' + (err.response?.data?.message || err.message));
        }
      };
      fetchReservation();
    }
  }, [id, isEditMode]);

  // Auto-fill from GuestLookupPage prefill state
  useEffect(() => {
    if (isEditMode) return;
    const prefill = (location.state as any)?.prefill;
    if (prefill) {
      setFormData(prev => ({
        ...prev,
        guestName: prefill.guestName || prev.guestName,
        guestEmail: prefill.guestEmail || prev.guestEmail,
        guestPhone: prefill.guestPhone || prev.guestPhone,
        address: prefill.address || prev.address,
        idProof: prefill.idProof || prev.idProof,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGuestByPhone = async (phone: string) => {
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
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.info('No existing guest found. Fill in details manually.');
      } else {
        toast.error('Error fetching guest details.');
        console.error('Error fetching guest:', err);
      }
    } finally {
      setIsSearchingGuest(false);
    }
  };

  // Derived data
  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // Default to 1 if same day
  }, [formData.checkIn, formData.checkOut]);

  const totalRoomsCount = useMemo(() => {
    return formData.rooms.reduce((acc, room) => acc + (Number(room.count) || 0), 0);
  }, [formData.rooms]);

  const stayCost = useMemo(() => {
    return formData.rooms.reduce((acc, room) => acc + ((Number(room.rate) || 0) * (Number(room.count) || 0) * nights), 0);
  }, [formData.rooms, nights]);

  const autoTotalTariff = useMemo(() => {
    return stayCost +
           (Number(formData.specialRequirementsAmount) || 0) +
           (Number(formData.earlyCheckinAmount) || 0) +
           (Number(formData.lateCheckoutAmount) || 0) +
           (Number(formData.stayCosyAmount) || 0) +
           (Number(formData.breakfastAmount) || 0);
  }, [stayCost, formData.specialRequirementsAmount, formData.earlyCheckinAmount, formData.lateCheckoutAmount, formData.stayCosyAmount, formData.breakfastAmount]);

  const netPay = useMemo(() => {
    const extraBedCharge = formData.extraBed ? 500 : 0; 
    return stayCost + 
           (Number(formData.foodBill) || 0) + 
           extraBedCharge + 
           (Number(formData.specialRequirementsAmount) || 0) + 
           (Number(formData.earlyCheckinAmount) || 0) + 
           (Number(formData.lateCheckoutAmount) || 0) +
           (Number(formData.stayCosyAmount) || 0) +
           (Number(formData.breakfastAmount) || 0);
  }, [stayCost, formData.foodBill, formData.extraBed, formData.specialRequirementsAmount, formData.earlyCheckinAmount, formData.lateCheckoutAmount, formData.stayCosyAmount, formData.breakfastAmount]);

  const balanceDue = useMemo(() => {
    return netPay - (Number(formData.advance) || 0);
  }, [netPay, formData.advance]);

  const invoiceData: UnifiedInvoiceData = {
    ...formData,
    adults: Number(formData.adults) || 0,
    children: Number(formData.children) || 0,
    numRooms: totalRoomsCount || 1,
    roomType: formData.rooms.length > 0 ? formData.rooms[0].type : '', // Primary type for fallback
    rooms: formData.rooms.map(r => ({ type: r.type, count: Number(r.count) || 1, rate: Number(r.rate) || 0 })),
    nights,
    totalTariff: netPay,
    advance: Number(formData.advance) || 0,
    balanceDue,
    location: formData.location,
    breakfastAmount: Number(formData.breakfastAmount) || 0,
    specialRequirementsAmount: Number(formData.specialRequirementsAmount) || 0,
    earlyCheckinAmount: Number(formData.earlyCheckinAmount) || 0,
    lateCheckoutAmount: Number(formData.lateCheckoutAmount) || 0,
    stayCosyAmount: Number(formData.stayCosyAmount) || 0,
  };

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [...formData.rooms, { type: 'Std Room', count: '', rate: '' }]
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

  const handleSaveConfirmed = async () => {
    setShowConfirmModal(false);
    try {
      const payload = {
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.guestPhone,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        adults: Number(formData.adults) || 1,
        children: Number(formData.children) || 0,
        room_type: formData.rooms[0]?.type || 'N/A',
        num_rooms: totalRoomsCount || 1,
        room_details: formData.rooms.map(r => ({
          type: r.type,
          count: Number(r.count) || 1,
          rate: Number(r.rate) || 0,
        })),
        special_requirements: formData.specialRequirements,
        special_requirements_amount: Number(formData.specialRequirementsAmount) || 0,
        early_checkin_amount: Number(formData.earlyCheckinAmount) || 0,
        late_checkout_amount: Number(formData.lateCheckoutAmount) || 0,
        stay_cosy_amount: (Number(formData.stayCosyAmount) || 0) || stayCost,
        total_tariff: (Number(formData.totalTariff) || 0) || autoTotalTariff,
        advance: Number(formData.advance) || 0,
        check_in_time: formData.checkInTime,
        check_out_time: formData.checkOutTime,
        status: formData.status,
        address: formData.address,
        id_proof: formData.idProof,
        breakfast: formData.breakfast,
        breakfast_amount: Number(formData.breakfastAmount) || 0,
        location: formData.location || 'Ooty'
      };

      if (isEditMode) {
        await api.put(`/reservations/${id}`, payload);
        toast.success('Quotation updated successfully!');
        navigate('/reservations');
      } else {
        await api.post('/enquiries', payload);
        toast.success('Enquiry registered successfully!');
        navigate('/enquiries');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving quotation');
    }
  };

  const handleSaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const roomTypesChennai = ['Std Room', 'Del Room', 'Fam Room', 'Sup Del Room', 'Suite Room'];
  const roomTypesOoty = ['Std Room', 'Del. Bal Room', 'Fam Room', 'Del. Villa'];
  const roomTypes = formData.location === 'Chennai' ? roomTypesChennai : roomTypesOoty;

  return (
    <div className="min-h-screen pb-12 sm:pb-20 animate-in fade-in duration-700 print:pb-0 print:min-h-0 print:animate-none">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8 sticky top-0 bg-background/80 backdrop-blur-md py-3 sm:py-4 z-10 border-b border-border-subtle px-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 hover:bg-white rounded-full transition-colors border border-border-subtle shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </button>
          <div className="flex items-center gap-2.5 sm:gap-4">
            <img src={logo} alt="Logo" className="h-6 w-6 sm:h-8 sm:w-8 object-contain shrink-0" />
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-primary tracking-tight">{isEditMode ? 'Edit Quotation' : 'Quotation for Enquiry'}</h2>
              <p className="text-[10px] sm:text-xs font-bold text-soft-slate uppercase tracking-widest mt-0.5 sm:mt-1">Quotation Generator & Reservation Management</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${showPreview ? 'bg-elegant-gold text-deep-charcoal' : 'bg-white border border-border-subtle text-primary'}`}
          >
            {showPreview ? <X className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {showPreview ? 'Close Preview' : 'Live Preview'}
          </button>
          <button
            form="reservation-form"
            type="submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 bg-primary text-white rounded-xl font-bold text-xs sm:text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <Save className="w-4 h-4 text-elegant-gold shrink-0" />
            {isEditMode ? 'Update' : 'Save'}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-border-subtle text-primary shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <Modal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Quotation Details"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Guest Name</p>
              <p className="font-bold text-primary">{formData.guestName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Phone</p>
              <p className="font-bold text-primary">{formData.guestPhone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Check-In</p>
              <p className="font-bold text-primary">{formData.checkIn}</p>
            </div>
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Check-Out</p>
              <p className="font-bold text-primary">{formData.checkOut}</p>
            </div>
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Rooms</p>
              <p className="font-bold text-primary">{totalRoomsCount} ({formData.rooms[0]?.type})</p>
            </div>
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Location</p>
              <p className="font-bold text-elegant-gold">{formData.location || 'Ooty'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-soft-slate uppercase text-[10px] font-bold">Nights</p>
              <p className="font-bold text-primary">{nights}</p>
            </div>
          </div>

          <div className="bg-background p-6 rounded-2xl border border-border-subtle space-y-3">
             <div className="flex justify-between items-center text-sm">
               <span className="text-soft-slate">Stay Cost:</span>
               <span className="font-bold text-primary">₹ {stayCost.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-soft-slate">Total Tariff:</span>
               <span className="font-bold text-primary">₹ {autoTotalTariff.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm border-t border-border-subtle pt-3">
               <span className="text-primary font-bold">Balance Due:</span>
               <span className="font-black text-xl text-elegant-gold">₹ {balanceDue.toLocaleString()}</span>
             </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-4 border border-border-subtle rounded-xl font-bold text-sm text-soft-slate hover:bg-gray-50 transition-colors"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSaveConfirmed}
              className="flex-1 py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Confirm & Save Quotation
            </button>
          </div>
        </div>
      </Modal>

      <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-2' : 'max-w-4xl mx-auto'} gap-12 transition-all duration-500 print:block print:w-full`}>
        {/* Form Section */}
        <section className="glass-card p-10 rounded-[2.5rem] border border-border-subtle shadow-2xl print:hidden">
          <form id="reservation-form" onSubmit={handleSaveRequest} className="space-y-8">

            {/* Guest Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="w-4 h-4 text-elegant-gold" />
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">Guest Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Guest Full Name</label>
                  <input
                    type="text" required
                    placeholder="e.g. Alexander Wright"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    value={formData.guestName}
                    onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="tel" required
                      placeholder="+91 00000 00000"
                      className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-28 text-sm focus:ring-2 focus:ring-elegant-gold"
                      value={formData.guestPhone}
                      onChange={e => setFormData({ ...formData, guestPhone: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => fetchGuestByPhone(formData.guestPhone)}
                      disabled={isSearchingGuest || !formData.guestPhone}
                      className="absolute right-2 top-1.25 bottom-1.25 my-1.25 px-4 bg-primary text-white text-[10px] font-bold uppercase rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                      style={{ top: '6px', bottom: '6px', right: '6px' }}
                    >
                      {isSearchingGuest ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Check Guest</span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="email"
                      placeholder="e.g. alex@example.com"
                      className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                      value={formData.guestEmail}
                      onChange={e => setFormData({ ...formData, guestEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Guest Address</label>
                  <textarea
                    placeholder="Enter permanent address..."
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">ID Proof (Aadhar/Voter ID/Driving License)</label>
                  <input
                    type="text"
                    placeholder="Enter ID number..."
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    value={formData.idProof}
                    onChange={e => setFormData({ ...formData, idProof: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Booking Dates & Rooms */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-elegant-gold" />
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest">Stay Information</h3>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                  <MapPin className="w-3 h-3 text-amber-600" /> Chennai Branch
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Check-In</label>
                  <input
                    type="date" required
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    value={formData.checkIn}
                    onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Check-Out</label>
                  <input
                    type="date" required
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    value={formData.checkOut}
                    onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
                {/* Check-in Time */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Check-In Time</label>
                  <input
                    type="text"
                    placeholder="12:00 Noon"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    value={formData.checkInTime}
                    onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                  />
                </div>
                {/* Check-out Time */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Check-Out Time</label>
                  <input
                    type="text"
                    placeholder="11:00 A.M"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                    value={formData.checkOutTime}
                    onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Adults</label>
                    <input
                      type="number" min="1"
                      className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold"
                      value={formData.adults}
                      onChange={e => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Children</label>
                    <input
                      type="number" min="0"
                      className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold"
                      value={formData.children}
                      onChange={e => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
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
                        <div className="md:col-span-5 space-y-2">
                          <label className="text-[9px] font-bold text-soft-slate uppercase tracking-widest">Room Type</label>
                          <select
                            className="w-full bg-background border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-elegant-gold appearance-none font-bold text-primary"
                            value={room.type}
                            onChange={e => updateRoom(idx, 'type', e.target.value)}
                          >
                            {roomTypes.map(type => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[9px] font-bold text-soft-slate uppercase tracking-widest">Count</label>
                          <input
                            type="number" min="1"
                            className="w-full bg-background border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-elegant-gold font-black text-center"
                            value={room.count}
                            onChange={e => updateRoom(idx, 'count', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-[9px] font-bold text-soft-slate uppercase tracking-widest">Rate (₹)</label>
                          <input
                            type="number"
                            className="w-full bg-background border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-elegant-gold font-black"
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Room Numbers (Comma separated)</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input
                      type="text" placeholder="e.g. 101, 102, 105"
                      className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold"
                      value={formData.roomNo}
                      onChange={e => setFormData({ ...formData, roomNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="p-6 bg-background rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <Coffee className="w-5 h-5 text-elegant-gold" />
                      <div>
                        <p className="text-xs font-black text-primary">Breakfast Configuration</p>
                        <p className="text-[10px] text-soft-slate font-bold uppercase tracking-widest">Configure breakfast plan and extra charges</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Meal Plan</label>
                        <select
                          className="w-full bg-background border border-border-subtle rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-elegant-gold text-primary font-bold appearance-none"
                          value={formData.breakfast}
                          onChange={e => setFormData({ ...formData, breakfast: e.target.value })}
                        >
                          <option value="No Breakfast">No Breakfast</option>
                          <option value="Buffet Breakfast">Buffet Breakfast</option>
                          <option value="Partial Breakfast">Partial Breakfast</option>
                          <option value="MAP">MAP</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Breakfast Charge (₹)</label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          className="w-full bg-background border border-border-subtle rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-elegant-gold text-primary font-bold"
                          value={formData.breakfastAmount}
                          onChange={e => setFormData({ ...formData, breakfastAmount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <PlusSquare className="w-5 h-5 text-elegant-gold" />
                      <div>
                        <p className="text-xs font-black text-primary">Extra Bed Option</p>
                        <p className="text-[10px] text-soft-slate font-bold uppercase tracking-widest">Add extra bed for current room</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, extraBed: !formData.extraBed })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${formData.extraBed ? 'bg-elegant-gold' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.extraBed ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <CreditCard className="w-4 h-4 text-elegant-gold" />
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">Financial Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Early Check-in (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-primary"
                    value={formData.earlyCheckinAmount}
                    onChange={e => setFormData({ ...formData, earlyCheckinAmount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Late Check-out (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-primary"
                    value={formData.lateCheckoutAmount}
                    onChange={e => setFormData({ ...formData, lateCheckoutAmount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Special Requirements</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Flower decoration, Birthday cake..."
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold"
                    value={formData.specialRequirements}
                    onChange={e => setFormData({ ...formData, specialRequirements: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Special Req. Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-primary"
                    value={formData.specialRequirementsAmount}
                    onChange={e => setFormData({ ...formData, specialRequirementsAmount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Food Bill (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-primary"
                    value={formData.foodBill}
                    onChange={e => setFormData({ ...formData, foodBill: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Stay Cost (Rate × Nights) (₹)*</label>
                  <input
                    type="number" readOnly
                    className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 text-sm font-black text-primary cursor-not-allowed"
                    value={stayCost}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Extra Charges (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-primary"
                    value={formData.stayCosyAmount}
                    onChange={e => setFormData({ ...formData, stayCosyAmount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Booking Status</label>
                   <select
                     className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-primary"
                     value={formData.status}
                     onChange={e => setFormData({ ...formData, status: e.target.value })}
                   >
                     <option value="Pending">Pending</option>
                     <option value="Confirmed">Confirmed</option>
                     <option value="Hold">Hold</option>
                     <option value="Upcoming">Upcoming</option>
                     <option value="Active">Active</option>
                     <option value="Cancelled">Cancelled</option>
                   </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Advance Paid (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold text-green-600"
                    value={formData.advance}
                    onChange={e => setFormData({ ...formData, advance: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Booked By (Source)</label>
                  <select
                    className="w-full bg-background border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-elegant-gold font-bold appearance-none text-primary"
                    value={formData.bookedBy}
                    onChange={e => setFormData({ ...formData, bookedBy: e.target.value })}
                  >
                    <option value="Direct">Direct</option>
                    <option value="Agent">Agent</option>
                    <option value="Website">Website</option>
                    <option value="OTA">OTA</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Calculation Summary */}
            <div className="bg-primary p-8 rounded-[2rem] text-white space-y-4 shadow-xl shadow-primary/20 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-elegant-gold" />
                <p className="text-[10px] font-bold text-elegant-gold uppercase tracking-widest">Auto-Calculation Summary</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                  <span className="text-white/60 font-medium">Nights:</span>
                  <span className="font-black text-xl">{nights}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                  <span className="text-white/60 font-medium">Net Pay (Rate × Nights + Food):</span>
                  <span className="font-black text-xl">₹ {netPay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-2">
                  <span className="text-elegant-gold font-black uppercase tracking-widest text-xs">Amt 2 B Paid @ Hotel:</span>
                  <span className="font-black text-3xl text-elegant-gold">₹ {balanceDue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Live Preview Section */}
        {showPreview && (
          <section className="sticky top-28 h-fit lg:max-h-[calc(100vh-160px)] overflow-y-auto pr-4 scrollbar-hide print:relative print:top-0 print:p-0 print:m-0 print:overflow-visible print:w-full">
            <div className="flex items-center justify-between mb-4 bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-border-subtle print:hidden">
              <div>
                <h3 className="text-sm font-black text-primary uppercase">Invoice Preview</h3>
                <p className="text-[10px] font-bold text-soft-slate">Exactly as it will appear when printed</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-border-subtle shadow-sm"
                  title="Print Invoice"
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
            <UnifiedInvoice data={invoiceData} />
          </section>
        )}
      </div>

      {/* Responsive Overlay for Mobile Preview */}
      {!showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce z-50 border-4 border-white"
        >
          <CheckCircle2 className="w-8 h-8 text-elegant-gold" />
        </button>
      )}
    </div>
  );
};

export default CreateReservationPage;
