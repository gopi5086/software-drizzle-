import React, { useState, useRef } from 'react';
import { Phone, User, Mail, MapPin, Search, ArrowRight, CheckCircle2, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import LocationPickerModal from '../components/LocationPickerModal';

interface GuestInfo {
  full_name: string;
  email: string;
  address: string;
  id_proof: string;
  phone: string;
}

const GuestLookupPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [guestFound, setGuestFound] = useState<GuestInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!cleaned || cleaned.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setIsSearching(true);
    setGuestFound(null);
    setNotFound(false);

    try {
      const res = await api.get(`/customers/phone/${cleaned}`);
      if (res.data) {
        setGuestFound({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          address: res.data.address || '',
          id_proof: res.data.id_proof || '',
          phone: cleaned,
        });
        toast.success('Guest found! Details auto-filled.');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
        toast.info('No guest found with this number. You can create a quotation for enquiry.');
      } else {
        toast.error('Error searching guest. Check your connection.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setPhone('');
    setGuestFound(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  const prefillData = guestFound
    ? {
        guestName: guestFound.full_name,
        guestEmail: guestFound.email,
        guestPhone: guestFound.phone,
        address: guestFound.address,
        idProof: guestFound.id_proof,
      }
    : {
        guestPhone: phone.trim(),
      };

  const handleProceedBooking = () => {
    setShowLocationModal(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#ffffff' }}
    >
      {/* Header branding */}
      <div className="mb-10 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
          style={{ background: '#1a1a2e' }}
        >
          <Phone className="w-8 h-8" style={{ color: '#D4AF37' }} />
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: '#1a1a2e' }}>
          Guest Phone Lookup
        </h1>
        <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-semibold">
          Auto-fetch guest details from database
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">

        {/* Phone input form */}
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Enter Guest Phone Number
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="tel"
                autoFocus
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setGuestFound(null);
                  setNotFound(false);
                }}
                className="w-full pl-12 pr-12 py-4 text-lg font-bold border-2 border-gray-200 rounded-2xl focus:outline-none transition-all placeholder:font-normal placeholder:text-gray-300"
                style={{
                  color: '#1a1a2e',
                  letterSpacing: '0.05em',
                }}
                onFocus={e => (e.target.style.borderColor = '#D4AF37')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
              {phone && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching || !phone}
            className="w-full flex items-center justify-center gap-3 py-4 font-bold text-base rounded-2xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#1a1a2e', color: '#ffffff' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#2d2d52'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1a1a2e'; }}
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Check Guest
              </>
            )}
          </button>
        </form>

        {/* ── Guest Found Result ── */}
        {guestFound && (
          <div className="mt-8 space-y-4">
            {/* Success banner */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm font-bold text-green-700">Guest found! Details auto-filled.</p>
            </div>

            {/* Detail rows */}
            <div className="space-y-3">
              <DetailRow icon={<User className="w-4 h-4" style={{ color: '#D4AF37' }} />} label="Full Name" value={guestFound.full_name} />
              <DetailRow icon={<Phone className="w-4 h-4" style={{ color: '#D4AF37' }} />} label="Phone" value={guestFound.phone} />
              {guestFound.email && <DetailRow icon={<Mail className="w-4 h-4" style={{ color: '#D4AF37' }} />} label="Email Address" value={guestFound.email} />}
              {guestFound.address && <DetailRow icon={<MapPin className="w-4 h-4" style={{ color: '#D4AF37' }} />} label="Address" value={guestFound.address} />}
              {guestFound.id_proof && <DetailRow icon={<CreditCard className="w-4 h-4" style={{ color: '#D4AF37' }} />} label="ID Proof" value={guestFound.id_proof} />}
            </div>

            <button
              onClick={handleProceedBooking}
              className="w-full flex items-center justify-center gap-3 py-4 font-black text-base rounded-2xl shadow-lg transition-transform hover:scale-[1.02]"
              style={{ background: '#D4AF37', color: '#1a1a2e' }}
            >
              Proceed to Quotation for Enquiry
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── Not Found ── */}
        {notFound && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
              <X className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-bold text-amber-700">
                No existing guest found with this phone number.
              </p>
            </div>
            <p className="text-xs text-gray-400 text-center">
              A new guest profile will be created during booking.
            </p>
            <button
              onClick={handleProceedBooking}
              className="w-full flex items-center justify-center gap-3 py-4 font-bold text-base rounded-2xl shadow-lg transition-all"
              style={{ background: '#1a1a2e', color: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2d2d52')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
            >
              Continue as New Guest
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-300 text-center">
        Drizzle Drop Inn • Internal Staff Tool
      </p>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        extraState={{ prefill: prefillData }}
      />
    </div>
  );
};

// Small helper component
const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: '#1a1a2e' }}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-base font-black mt-0.5" style={{ color: '#1a1a2e' }}>{value}</p>
    </div>
  </div>
);

export default GuestLookupPage;
