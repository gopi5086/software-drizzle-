import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, X, Building2, Mountain } from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraState?: Record<string, any>;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, extraState }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelect = (location: 'chennai' | 'ooty') => {
    onClose();
    if (location === 'chennai') {
      navigate('/create-chennai-enquiry', { state: { location: 'Chennai', ...extraState } });
    } else {
      navigate('/create-ooty-enquiry', { state: { location: 'Ooty', ...extraState } });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl p-5 sm:p-8 w-[92%] sm:w-[90%] max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2 pr-8">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">Select Location</h2>
            <p className="text-xs text-gray-400 font-medium">Choose a branch to open the enquiry form</p>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-4 sm:my-5" />

        {/* Location Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

          {/* Chennai */}
          <button
            onClick={() => handleSelect('chennai')}
            className="group relative flex flex-row sm:flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 text-left cursor-pointer shadow-sm hover:shadow-lg"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-left sm:text-center flex-1">
              <p className="font-black text-gray-800 text-base group-hover:text-blue-700">Chennai</p>
              <p className="text-[11px] text-gray-400 mt-0.5 sm:mt-1 font-medium">City Branch</p>
            </div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full group-hover:bg-blue-100 transition-colors shrink-0">
              Standard Form
            </span>
          </button>

          {/* Ooty */}
          <button
            onClick={() => handleSelect('ooty')}
            className="group relative flex flex-row sm:flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl border-2 border-gray-100 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200 text-left cursor-pointer shadow-sm hover:shadow-lg"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Mountain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-left sm:text-center flex-1">
              <p className="font-black text-gray-800 text-base group-hover:text-emerald-700">Ooty</p>
              <p className="text-[11px] text-gray-400 mt-0.5 sm:mt-1 font-medium">Hill Station</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 sm:px-3 py-1 rounded-full group-hover:bg-emerald-100 transition-colors shrink-0">
              Enquiry Form
            </span>
          </button>

        </div>

        <p className="text-center text-[11px] text-gray-400 mt-5 font-medium">
          Each location has its own registration process
        </p>
      </div>
    </div>
  );
};

export default LocationPickerModal;
