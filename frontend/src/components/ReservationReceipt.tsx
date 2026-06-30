import React from 'react';

export interface ReceiptRoom {
  type: string;
  count: number;
  rate: number;
}

interface ReceiptData {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomType: string;
  numRooms: number;
  rooms?: ReceiptRoom[];
  specialRequirements?: string;
  specialRequirementsAmount?: number;
  earlyCheckinAmount?: number;
  lateCheckoutAmount?: number;
  stayCosyAmount?: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalTariff: number;
  advance: number;
  balanceDue: number;
  checkInTime: string;
  checkOutTime: string;
  created_at?: string;
}

interface ReservationReceiptProps {
  data: ReceiptData;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--';
  // Extract only the date part YYYY-MM-DD if it's a full timestamp
  const baseDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const d = new Date(baseDate + 'T00:00:00');
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
};

const ReservationReceipt: React.FC<ReservationReceiptProps> = ({ data }) => {
  return (
    <div
      id="reservation-receipt"
      style={{
        background: '#fff',
        maxWidth: '720px',
        margin: '0 auto',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#222',
        border: '1px solid #ccc',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ── BLUE HEADER BAR ── */}
      <div
        style={{
          background: '#3d5a80',
          color: '#fff',
          textAlign: 'center',
          padding: '22px 20px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          RESERVATION RECEIPT
        </h1>
        {data.created_at && (
          <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 'bold' }}>
            Generated: {new Date(data.created_at).toLocaleString('en-IN')}
          </p>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: '24px 36px 16px' }}>

        {/* Dear Guest + Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', margin: 0, color: '#333' }}>
            Dear <strong style={{ color: '#111' }}>{data.guestName || 'Guest'}</strong> ,
          </p>
          <img src="/logo.png" alt="DrizzleDrop Inn" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Thanks line */}
        <p style={{ fontSize: '13px', color: '#444', margin: '0 0 16px 20px' }}>
          Thanks for choosing <strong>DrizzleDrop Inn.</strong>
        </p>

        {/* Advance received */}
        {data.advance > 0 && (
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#d97706', margin: '0 0 4px 20px' }}>
            Received Rs.{data.advance.toLocaleString()}/- as advance
          </p>
        )}

        {/* Booking confirmed */}
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#2a7e3b', margin: '0 0 14px 20px' }}>
          Your booking is confirmed.
        </h2>

        {/* Guest Phone + Tariff + Balance */}
        <div style={{ marginLeft: '20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Guest Phone No.:</span>
            <span style={{ fontSize: '13px' }}>{data.guestPhone || '--'}</span>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '4px 0' }}>
            Total Tariff: Rs.{data.totalTariff.toLocaleString()}/-
          </p>
          <p style={{ fontSize: '16px', fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
            Balance Amount: Rs.{data.balanceDue.toLocaleString()}/-
          </p>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '14px 0' }} />

        {/* Room Type + Breakfast */}
        <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '40px', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '120px' }}>Room Configuration:</span>
            <div style={{ flex: 1 }}>
              {data.rooms && data.rooms.length > 0 ? (
                data.rooms.map((room, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', borderBottom: idx < data.rooms.length - 1 ? '1px dotted #eee' : 'none', paddingBottom: '4px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{room.count} x {room.type} @ ₹{room.rate}</p>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{data.numRooms} x {data.roomType}</p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#2a7e3b', fontWeight: 600 }}>Breakfast Included</p>
            </div>
          </div>

          {/* Extra Charges */}
          {(data.earlyCheckinAmount > 0 || data.lateCheckoutAmount > 0 || data.specialRequirementsAmount > 0) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '40px', marginTop: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '120px' }}>Extra Charges:</span>
              <div style={{ flex: 1 }}>
                {data.earlyCheckinAmount > 0 && <p style={{ margin: '0 0 2px', fontSize: '12px' }}>Early Check-in: ₹{data.earlyCheckinAmount}</p>}
                {data.lateCheckoutAmount > 0 && <p style={{ margin: '0 0 2px', fontSize: '12px' }}>Late Check-out: ₹{data.lateCheckoutAmount}</p>}
                {data.stayCosyAmount > 0 && <p style={{ margin: '0 0 2px', fontSize: '12px' }}>Stay Cosy: ₹{data.stayCosyAmount}</p>}
                {data.specialRequirementsAmount > 0 && (
                  <div style={{ margin: '0 0 2px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Special Requirements: ₹{data.specialRequirementsAmount}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#666', fontStyle: 'italic' }}>({data.specialRequirements})</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '14px 0' }} />

        {/* Check-In / Check-Out Dates */}
        <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Check-In Date:</span>
            <span style={{ fontSize: '13px' }}>{formatDate(data.checkIn)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Check-Out Date:</span>
            <span style={{ fontSize: '13px' }}>{formatDate(data.checkOut)}</span>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '14px 0' }} />

        {/* Guest Count */}
        <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px' }}>Total Number of Guests (Adults)</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{data.adults}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>
              Total Number of Guests <span style={{ fontSize: '11px' }}>(Kids - Below 10 years)</span>
            </span>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{data.children}</span>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '14px 0' }} />

        {/* Check-in / Check-out Times */}
        <div style={{ marginLeft: '20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '30px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', minWidth: '130px' }}>Check-in Time</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{data.checkInTime || '12:00 Noon'}</span>
          </div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <span style={{ fontSize: '13px', minWidth: '130px' }}>Check-Out Time</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{data.checkOutTime || '11:00 A.M'}</span>
          </div>
        </div>

        {/* ── CANCELLATION POLICY ── */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 900, color: '#d32f2f', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Cancellation Policy
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: '1.7' }}>
            The guest can cancel free of charge until 3 days before arrival.<br />
            Cancellations made within 3 days of arrival will be charged for the first night.<br />
            Refunds, if applicable, will be processed within 3 to 6 days
          </p>
        </div>

        {/* ── HOTEL CONTACT DETAILS ── */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 900, color: '#222' }}>Hotel Contact Details</p>
          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
            Landline: 0423 - 2440551, 0423 - 2440552
          </p>
        </div>

        {/* ── GREEN MANAGER BAR ── */}
        <div
          style={{
            background: '#4caf50',
            color: '#fff',
            textAlign: 'center',
            padding: '8px 10px',
            fontWeight: 900,
            fontSize: '14px',
            marginBottom: '8px',
          }}
        >
          Manager : 9150486153
        </div>

        {/* Email & Website */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#444' }}>E-Mail: stay@drizzledropinn.com</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#444' }}>website: www.drizzledropinn.com</p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign: 'center', padding: '12px 20px 16px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 'bold', color: '#2a7e3b' }}>
          Thank you for choosing  Drizzledrop Inn Ooty
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#2a7e3b', fontWeight: 600 }}>
          We look forward to your stay.
        </p>
      </div>
    </div>
  );
};

export default ReservationReceipt;
export type { ReceiptData };
