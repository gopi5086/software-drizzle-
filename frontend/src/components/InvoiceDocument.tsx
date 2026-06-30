import React from 'react';
import { Phone, Mail, Globe, MapPin, QrCode } from 'lucide-react';

interface InvoiceData {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  numRooms: number;
  roomType: string;
  roomNo: string;
  breakfast: boolean;
  extraBed: boolean;
  rate: number;
  foodBill: number;
  advance: number;
  status: string;
  bookedBy: string;
  nights: number;
  netPay: number;
  balanceDue: number;
}

interface InvoiceDocumentProps {
  data: InvoiceData;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ data }) => {
  return (
    <div id="invoice-document" className="bg-white p-8 md:p-12 shadow-2xl rounded-sm max-w-[800px] mx-auto text-deep-charcoal border border-gray-100 print:shadow-none print:p-0 print:border-none animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DrizzleDrop Inn" className="h-16 w-auto object-contain" />
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black text-primary/10 tracking-widest uppercase">Invoice</h2>
          <p className="text-xs font-bold text-soft-slate mt-2">Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium">Dear <span className="font-bold text-primary">{data.guestName || 'Guest'}</span>,</p>
        {data.guestEmail && <p className="text-[10px] text-soft-slate">{data.guestEmail}</p>}
        <p className="text-xs text-soft-slate mt-1 italic text-elegant-gold">Greetings from DrizzleDrop Inn!!!!</p>
      </div>

      {/* Main Details Table */}
      <div className="overflow-hidden border border-gray-100 rounded-lg mb-8">
        <table className="w-full text-xs">
          <tbody>
            <tr className="bg-primary/5">
              <td className="px-4 py-3 font-bold text-primary border-b border-white">Check-In Date:</td>
              <td className="px-4 py-3 text-right border-b border-white font-medium">{data.checkIn || '--'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold text-primary border-b border-gray-50">Check-Out Date:</td>
              <td className="px-4 py-3 text-right border-b border-gray-50 font-medium">{data.checkOut || '--'}</td>
            </tr>
            <tr className="bg-primary/5">
              <td className="px-4 py-3 font-bold text-primary border-b border-white">Total Number of Guests (Adults):</td>
              <td className="px-4 py-3 text-right border-b border-white font-medium">{data.adults}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold text-primary border-b border-gray-50">Total Number of Guests (Kids - Below 10 years):</td>
              <td className="px-4 py-3 text-right border-b border-gray-50 font-medium">{data.children}</td>
            </tr>
            <tr className="bg-primary/5">
              <td className="px-4 py-3 font-bold text-primary border-b border-white">No. of Rooms:</td>
              <td className="px-4 py-3 text-right border-b border-white font-medium">{data.numRooms}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold text-primary border-b border-gray-50">Room Type:</td>
              <td className="px-4 py-3 text-right border-b border-gray-50 font-medium">{data.numRooms} x {data.roomType}</td>
            </tr>
            <tr className="bg-primary/5 border-t-2 border-primary">
              <td className="px-4 py-4 font-black text-sm text-primary uppercase">Total Tariff for {data.nights} Nights (in Rs):</td>
              <td className="px-4 py-4 text-right font-black text-sm text-primary">₹ {data.netPay.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-elegant-gold">
         <p className="text-[10px] font-bold text-soft-slate uppercase mb-1">The above rate includes:</p>
         <p className="text-xs font-bold text-primary">Breakfast, Tax{data.extraBed ? ', Extra Bed Charge (₹500)' : ''}</p>
      </div>

      {/* Payment & QR Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-center">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
             <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Policy Note</p>
             <p className="text-[10px] leading-relaxed text-blue-800">
               As per the booking policy, First Night Rent OR 30% of the total rent should be paid as prepayment (Advance Amount).
             </p>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-primary uppercase mb-2 border-b-2 border-elegant-gold inline-block">Payment Methods:</h3>
            <div className="mt-2 space-y-1">
              <p className="text-[10px] font-bold text-red-600">Bank Account details for Payment:</p>
              <div className="grid grid-cols-2 text-[10px] gap-y-1">
                <span className="text-soft-slate">Beneficiary Name</span>
                <span className="font-bold">: DrizzleDrop Inn</span>
                <span className="text-soft-slate">Account Number</span>
                <span className="font-bold">: 50200013228242</span>
                <span className="text-soft-slate">Account Type</span>
                <span className="font-bold">: Current</span>
                <span className="text-soft-slate">Bank</span>
                <span className="font-bold">: HDFC BANK LTD.</span>
                <span className="text-soft-slate">RTGS / NEFT / IFSC</span>
                <span className="font-bold text-primary">: HDFC0001270</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <p className="text-xs font-black text-primary">GOOGLE PAY : 9962822355</p>
            <p className="text-[10px] font-bold text-soft-slate">PAYTM : 9962822355</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white shadow-sm">
           <div className="w-full max-w-[150px] aspect-square bg-white flex items-center justify-center relative mb-3">
              <QrCode className="w-full h-full text-primary" />
           </div>
           <div className="text-center">
              <p className="text-xs font-bold text-primary">Scan to Pay</p>
              <p className="text-[10px] text-soft-slate font-medium mt-1">DrizzleDrop Inn @ HDFC</p>
           </div>
        </div>
      </div>

      {/* Policies */}
      <div className="border-t border-gray-100 pt-6 space-y-6">
        <div className="text-center">
           <h4 className="text-[10px] font-bold text-red-600 uppercase underline mb-2">Cancellation Policy:</h4>
           <p className="text-[10px] text-soft-slate leading-relaxed">
             The guest can cancel free of charge until 3 days before arrival.<br/>
             The guest will be charged the first night if they cancel within 3 days before arrival.<br/>
             <span className="font-bold text-primary">Refund will be processed within 3 - 6 days.</span>
           </p>
        </div>

        <div className="flex justify-center gap-12 text-[10px] font-bold text-primary py-3 bg-gray-50 rounded-full">
           <p>Checkin Time: 12:00 Noon</p>
           <p>Checkout Time: 11:00 A.M</p>
        </div>

        <div className="text-center space-y-4">
           <h3 className="text-xl font-black text-green-600 italic">Thank you for your business</h3>
           <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest px-4 py-1 border-y border-orange-100 inline-block">
             Please reach out to managers for any further assistance after booking
           </p>
           <div className="text-xs font-black text-primary">
              <p>Manager: 9150486153</p>
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center space-y-2 pt-8 border-t border-gray-50">
        <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-soft-slate">
           <MapPin className="w-3 h-3 text-elegant-gold" />
           <span>215 H, Dispensary Road, Fern Hill, Ooty, Tamil Nadu 643004</span>
        </div>
        <div className="flex justify-center gap-6 text-[10px] font-bold text-primary">
           <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> 0423 - 2440551</div>
           <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> stay@drizzledropinn.com</div>
           <div className="flex items-center gap-1"><Globe className="w-3 h-3" /> www.drizzledropinn.com</div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
