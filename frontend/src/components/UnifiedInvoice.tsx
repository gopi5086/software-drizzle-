import React from 'react';

export interface RoomDetail {
  type: string;
  count: number;
  rate: number;
}

export interface UnifiedInvoiceData {
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  numRooms: number;
  roomType: string;
  rooms?: RoomDetail[]; // New: support for multiple room types
  specialRequirements?: string;
  specialRequirementsAmount?: number;
  earlyCheckinAmount?: number;
  lateCheckoutAmount?: number;
  stayCosyAmount?: number;
  rate?: number;
  totalTariff: number;
  advance?: number;
  balanceDue?: number;
  nights?: number;
  extraBed?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  created_at?: string;
  address?: string;
  id_proof?: string;
}

interface UnifiedInvoiceProps {
  data: UnifiedInvoiceData;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--';
  // Extract only the date part YYYY-MM-DD if it's a full timestamp
  const baseDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const d = new Date(baseDate + 'T00:00:00');
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
};

const UnifiedInvoice: React.FC<UnifiedInvoiceProps> = ({ data }) => {
  // Calculate dynamic UPI QR URL with balance due amount
  const balanceDueVal = data.balanceDue !== undefined ? data.balanceDue : ((data.totalTariff || 0) - (data.advance || 0));
  const upiUrl = `upi://pay?pa=9962822355@okbizaxis&pn=DrizzleDrop%20Inn${balanceDueVal > 0 ? `&am=${balanceDueVal}` : ''}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;

  // Derive nights
  let nights = data.nights || 0;
  if (!nights && data.checkIn && data.checkOut) {
    const diff = new Date(data.checkOut + 'T00:00:00').getTime() - new Date(data.checkIn + 'T00:00:00').getTime();
    nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  if (!nights) nights = 1;

  // Build Table Rows
  const tableRows: { label: React.ReactNode; value: number | string; shade: boolean }[] = [
    { label: <><strong>Check-In Date:</strong></>, value: formatDate(data.checkIn), shade: true },
    { label: <><strong>Check-Out Date:</strong></>, value: formatDate(data.checkOut), shade: false },
    { label: <strong>Total Number of Guests (Adults)</strong>, value: data.adults, shade: true },
    { label: <><strong>Total Number of Guests</strong> <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(Kids - Below 10 years)</span></>, value: data.children, shade: false },
    { label: <strong>No. of Rooms</strong>, value: data.numRooms, shade: true },
  ];

  let shadeCount = false;

  // Add rooms
  if (data.rooms && data.rooms.length > 0) {
    data.rooms.forEach((room) => {
      tableRows.push({
        label: <>{room.type} <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(Per Room/ Per Night)</span></>,
        value: `${room.count} x ${room.rate}`,
        shade: shadeCount
      });
      shadeCount = !shadeCount;
    });
  } else {
    // Fallback for single room type
    tableRows.push({
      label: <>{data.roomType} <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(Per Room/ Per Night)</span></>,
      value: `${data.numRooms} x ${data.rate || 0}`,
      shade: shadeCount
    });
    shadeCount = !shadeCount;
  }

  // Add Extra Bed
  if (data.extraBed) {
    tableRows.push({
      label: <>Extra Bed <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(Per Night)</span></>,
      value: 500,
      shade: shadeCount
    });
    shadeCount = !shadeCount;
  }

  // Add Early Check-in
  if (data.earlyCheckinAmount && data.earlyCheckinAmount > 0) {
    tableRows.push({
      label: <strong>Early Check-in Charges</strong>,
      value: data.earlyCheckinAmount,
      shade: shadeCount
    });
    shadeCount = !shadeCount;
  }

  // Add Late Check-out
  if (data.lateCheckoutAmount && data.lateCheckoutAmount > 0) {
    tableRows.push({
      label: <strong>Late Check-out Charges</strong>,
      value: data.lateCheckoutAmount,
      shade: shadeCount
    });
    shadeCount = !shadeCount;
  }

  // Add Stay Cosy
  if (data.stayCosyAmount && data.stayCosyAmount > 0) {
    tableRows.push({
      label: <strong>Stay Cosy Charges</strong>,
      value: data.stayCosyAmount,
      shade: shadeCount
    });
    shadeCount = !shadeCount;
  }

  // Add Special Requirements
  if (data.specialRequirementsAmount && data.specialRequirementsAmount > 0) {
    tableRows.push({
      label: <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>Special Requirements</strong>
        <span style={{ fontWeight: 'normal', fontSize: '9px', fontStyle: 'italic' }}>({data.specialRequirements})</span>
      </div>,
      value: data.specialRequirementsAmount,
      shade: shadeCount
    });
    shadeCount = !shadeCount;
  }

  return (
    <div
      id="unified-invoice"
      style={{
        background: '#fff',
        maxWidth: '780px',
        margin: '0 auto',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        color: '#000',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ── TOP HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 32px 6px' }}>
        {/* Dear guest */}
        <div style={{ flex: 1, paddingTop: '24px' }}>
          <p style={{ fontSize: '13px', margin: 0 }}>Dear <strong>{data.guestName || 'Guest'}</strong> ,</p>
          {data.address && <p style={{ fontSize: '10px', color: '#666', margin: '2px 0' }}>Address: {data.address}</p>}
          {data.id_proof && <p style={{ fontSize: '10px', color: '#666', margin: '2px 0' }}>ID: {data.id_proof}</p>}
        </div>

        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="DrizzleDrop Inn" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* INVOICE label */}
        <div style={{ flex: 1, textAlign: 'right', paddingTop: '4px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: 900, margin: 0, letterSpacing: '2px' }}>
            {data.status === 'Completed' ? 'RECEIPT' : 'INVOICE'}
          </h1>
          {data.created_at && (
            <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold' }}>
              Generated: {new Date(data.created_at).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>

      {/* Greetings */}
      <div style={{ padding: '2px 32px 4px' }}>
        <p style={{ margin: 0, color: '#5a8c5a', fontStyle: 'italic', fontWeight: 'bold', fontSize: '11px' }}>
          Greetings from DrizzleDrop Inn!!!!
        </p>
      </div>

      {/* ── MAIN TABLE ── */}
      <div style={{ margin: '0 32px', border: '1px solid #b8c8d8' }}>
        {tableRows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: row.shade ? '#e8eff7' : '#fff',
              borderBottom: '1px solid #d1dce6',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>{row.label}</span>
            <span style={{ fontWeight: 'bold' }}>{row.value}</span>
          </div>
        ))}

        {/* Total row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: '#1e3a5f',
            color: '#fff',
            fontWeight: 900,
            fontSize: '13px',
          }}
        >
          <span>Total Tariff for {nights} Nights (in Rs)</span>
          <span>{data.totalTariff.toLocaleString()}</span>
        </div>
      </div>

      {/* ── INCLUSIONS + QR SIDE BY SIDE ── */}
      <div style={{ display: 'flex', gap: '20px', padding: '10px 32px 0' }}>

        {/* Left column */}
        <div style={{ flex: 1 }}>
          {/* Rate includes */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ margin: '0 0 2px', color: '#d97706', fontWeight: 'bold', fontSize: '11px' }}>The above rate includes:</p>
            <p style={{ margin: '0', fontWeight: 'bold' }}>Breakfast</p>
            <p style={{ margin: '0', fontWeight: 'bold' }}>Tax</p>
          </div>

          {/* Booking policy */}
          <div style={{ background: '#a8b5c4', color: '#fff', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', lineHeight: '1.4', marginBottom: '10px' }}>
            As per the booking policy, First Night Rent OR 30% of the total rent should be paid as prepayment (Advance Amount).
          </div>

          {/* Payment Methods */}
          <div>
            <h3 style={{ margin: '0 0 2px', color: '#4a7fb5', fontWeight: 900, fontSize: '13px' }}>PAYMENT METHODS:</h3>
            <p style={{ margin: '0 0 4px', color: '#d32f2f', fontWeight: 'bold', fontSize: '11px' }}>Bank Account details for Payment.</p>

            <table style={{ fontSize: '10px', width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#444', paddingBottom: '2px', width: '40%' }}>Beneficiary Name</td>
                  <td>DrizzleDrop Inn</td>
                </tr>
                <tr>
                  <td style={{ color: '#444', paddingBottom: '2px' }}>Account number</td>
                  <td>50200013228242</td>
                </tr>
                <tr>
                  <td style={{ color: '#444', paddingBottom: '2px' }}>Account Type</td>
                  <td>Current</td>
                </tr>
                <tr>
                  <td style={{ color: '#444', paddingBottom: '2px', verticalAlign: 'top', paddingTop: '2px' }}>Address</td>
                  <td style={{ paddingTop: '2px' }}>
                    "HDFC BANK LTD.<br />421/C1 ETTINES ROAD,<br />OOTY -643001"
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#444', paddingTop: '2px' }}>RTGS / NEFT / IFSC</td>
                  <td style={{ fontWeight: 'bold', paddingTop: '2px' }}>HDFC0001270</td>
                </tr>
              </tbody>
            </table>

            <div style={{ background: '#fde8cc', padding: '5px 10px', marginBottom: '2px' }}>
              <strong style={{ fontSize: '13px' }}>GOOGLE PAY &nbsp;&nbsp;&nbsp; : 9962822355</strong>
            </div>
            <div style={{ padding: '2px 4px' }}>
              <strong style={{ fontSize: '11px' }}>PAYTM &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : 9962822355</strong>
            </div>
          </div>
        </div>

        {/* QR Card (GPay style) */}
        <div style={{ width: '195px', flexShrink: 0 }}>
          <div style={{
            background: '#1973e8', // Official GPay blue
            borderRadius: '10px',
            padding: '10px',
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '6px',
              padding: '10px 6px 6px',
              color: '#000',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* GPay Logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1973e8' }}>G</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea4335' }}> P</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbc05' }}>a</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#34a853' }}>y</span>
              </div>
              <div style={{ fontSize: '7px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '-2px', marginBottom: '6px' }}>
                accepted here
              </div>
              
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#202124', margin: '0' }}>DrizzleDrop Inn</div>
              <div style={{ fontSize: '7px', color: '#5f6368', margin: '1px 0 4px' }}>+91 99628 22355</div>
              
              {/* QR Code image */}
              <div style={{ margin: '4px 0', background: '#fff', padding: '3px', border: '1px solid #dadce0', borderRadius: '4px' }}>
                <img 
                  src={qrCodeUrl} 
                  alt="Payment QR Code" 
                  style={{ width: '100px', height: '100px', display: 'block' }} 
                />
              </div>
              
              <div style={{ fontSize: '7px', color: '#5f6368', wordBreak: 'break-all' }}>9962822355@okbizaxis</div>
              
              {/* GPay/UPI branding logos */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '6px', borderTop: '1px solid #f1f3f4', paddingTop: '6px', width: '100%' }}>
                <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#1973e8' }}>BHIM</span>
                <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#2e7d32', fontStyle: 'italic' }}>UPI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BLUE NOTE ── */}
      <div style={{
        margin: '8px 32px 0',
        background: '#1e3a5f',
        color: '#fff',
        textAlign: 'center',
        padding: '6px 10px',
        fontSize: '10px',
      }}>
        <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Note:</span>{' '}
        Once the Payment is done, please mention the transaction details through Watsup OR SMS the payment details to +91 9962822355.
      </div>

      {/* ── CANCELLATION POLICY ── */}
      <div style={{ padding: '10px 32px 0', textAlign: 'center' }}>
        <p style={{ margin: '0 0 3px', color: '#d32f2f', textDecoration: 'underline', fontWeight: 'bold', fontSize: '12px' }}>
          Cancellation Policy:
        </p>
        <p style={{ margin: '0', color: '#d32f2f', fontWeight: 'bold', fontSize: '10px' }}>
          The guest can cancel free of charge until 3 days before arrival.
        </p>
        <p style={{ margin: '2px 0', color: '#d32f2f', fontWeight: 'bold', fontSize: '10px' }}>
          The guest will be charged the first night if they cancel within 3 days before arrival.
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '10px' }}>Refund will be processed within 3 - 6 days.</p>
      </div>

      {/* ── TIMES ── */}
      <div style={{ padding: '8px 32px 0', fontSize: '10px', fontWeight: 'bold' }}>
        <p style={{ margin: 0 }}>Checkin Time: {data.checkInTime || '12:00 Noon'}</p>
        <p style={{ margin: '2px 0 0' }}>Checkout Time: {data.checkOutTime || '11:00 A.M'}</p>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign: 'center', padding: '10px 32px 12px' }}>
        <p style={{ margin: '0 0 4px', color: '#4a9a4a', fontWeight: 'bold', fontSize: '20px', fontStyle: 'italic' }}>
          Thank you for your business
        </p>
        <p style={{ margin: '0 0 6px', color: '#e67e00', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          PLEASE REACH OUT TO MANAGERS FOR ANY FURHTER ASSISTANCE AFTER BOOKING
        </p>
        <p style={{ margin: '0 0 10px', color: '#1e3a5f', fontWeight: 900, fontSize: '17px' }}>
          Manager: &nbsp; 9150486153
        </p>
        <div style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: '1.6' }}>
          <p style={{ margin: 0 }}>215 H, Dispensary Road,, Fern Hill, Ooty, Tamil Nadu 643004</p>
          <p style={{ margin: 0 }}>Ph: 0423 - 2440551, 0423 - 2440552</p>
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          <p style={{ margin: 0 }}>Email: stay@drizzledropinn.com | Website: www.drizzledropinn.com</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInvoice;
