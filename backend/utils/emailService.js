const nodemailer = require('nodemailer');

// For production, you'd use real SMTP credentials in .env
// For now, we'll use a placeholder structure or Ethereal for testing
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER || 'placeholder@ethereal.email',
    pass: process.env.EMAIL_PASS || 'placeholder_pass',
  },
});

exports.sendInvoiceEmail = async (res) => {
  if (!res.guest_email) return;

  const invoiceNo = `DDI-${String(res.id).padStart(4, '0')}`;
  const checkInDate = new Date(res.check_in + 'T00:00:00');
  const checkOutDate = new Date(res.check_out + 'T00:00:00');
  const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const balanceDue = (res.total_tariff || 0) - (res.advance || 0);
  
  // UPI QR Code
  const upiUrl = `upi://pay?pa=9962822355@okbizaxis&pn=DrizzleDrop%20Inn${balanceDue > 0 ? `&am=${balanceDue}` : ''}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;

  // Table rows for dynamic content
  let roomsHtml = '';
  const details = typeof res.room_details === 'string' ? JSON.parse(res.room_details) : (res.room_details || []);
  
  const addRow = (label, value, shade) => `
    <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: ${shade ? '#e8eff7' : '#ffffff'}; border-bottom: 1px solid #d1dce6;">
      <span style="font-weight: bold; color: #1e3a5f;">${label}</span>
      <span style="font-weight: bold; color: #000;">${value}</span>
    </div>
  `;

  let rows = '';
  rows += addRow('Check-In Date:', formatDate(checkInDate), true);
  rows += addRow('Check-Out Date:', formatDate(checkOutDate), false);
  rows += addRow('Total Number of Guests (Adults)', res.adults, true);
  rows += addRow('Total Number of Guests (Kids < 10y)', res.children, false);
  rows += addRow('No. of Rooms', res.num_rooms, true);

  let currentShade = false;
  if (details.length > 0) {
    details.forEach(room => {
      rows += addRow(`${room.type} (Per Room/Night)`, `${room.count} x ₹${room.rate}`, currentShade);
      currentShade = !currentShade;
    });
  } else {
    rows += addRow(`${res.room_type} (Per Room/Night)`, `${res.num_rooms} x ₹${res.total_tariff / nights / res.num_rooms}`, currentShade);
    currentShade = !currentShade;
  }

  if (res.early_checkin_amount > 0) {
    rows += addRow('Early Check-in Charges', `₹${res.early_checkin_amount}`, currentShade);
    currentShade = !currentShade;
  }
  if (res.late_checkout_amount > 0) {
    rows += addRow('Late Check-out Charges', `₹${res.late_checkout_amount}`, currentShade);
    currentShade = !currentShade;
  }
  if (res.stay_cosy_amount > 0) {
    rows += addRow('Stay Cosy Charges', `₹${res.stay_cosy_amount}`, currentShade);
    currentShade = !currentShade;
  }
  if (res.special_requirements_amount > 0) {
    rows += addRow(`Special Req (${res.special_requirements})`, `₹${res.special_requirements_amount}`, currentShade);
    currentShade = !currentShade;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #f4f7f9; }
    .container { max-width: 650px; margin: 20px auto; background: #ffffff; border: 1px solid #e1e8ef; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 30px; }
    .footer { text-align: center; padding: 20px 30px; background: #f9fafb; }
    .blue-bar { background: #1e3a5f; color: #ffffff; padding: 10px; text-align: center; font-weight: bold; font-size: 14px; }
    .red-policy { color: #d32f2f; font-weight: bold; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div style="padding: 20px 30px 10px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size: 14px; color: #333;">Dear <strong>${res.guest_name}</strong>,</td>
          <td align="right" style="font-size: 32px; font-weight: 900; color: #1e3a5f; letter-spacing: 2px;">INVOICE</td>
        </tr>
      </table>
      <p style="margin: 10px 0 0; color: #2a7e3b; font-style: italic; font-weight: bold; font-size: 13px;">Greetings from DrizzleDrop Inn!!!!</p>
    </div>

    <div style="margin: 0 30px; border: 1px solid #b8c8d8;">
      ${rows}
      <div style="background: #1e3a5f; color: #ffffff; display: flex; justify-content: space-between; padding: 10px; font-weight: 900; font-size: 14px;">
        <span style="flex: 1;">Total Tariff for ${nights} Nights (in Rs)</span>
        <span style="flex: 0;">₹${Number(res.total_tariff).toLocaleString()}</span>
      </div>
    </div>

    <div style="padding: 20px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="60%" valign="top">
            <p style="margin: 0 0 5px; color: #d97706; font-weight: bold; font-size: 12px;">The above rate includes:</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">• Breakfast</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">• Tax</p>
            
            <div style="background: #a8b5c4; color: #ffffff; padding: 8px; font-size: 10px; font-weight: bold; margin-top: 15px; border-radius: 4px;">
              As per the booking policy, First Night Rent OR 30% of the total rent should be paid as prepayment (Advance Amount).
            </div>

            <h3 style="margin: 15px 0 5px; color: #1e3a5f; font-weight: 900; font-size: 14px;">PAYMENT METHODS:</h3>
            <p style="margin: 0 0 5px; color: #d32f2f; font-weight: bold; font-size: 11px;">Bank Account details for Payment.</p>
            <table width="100%" style="font-size: 11px; color: #444;">
              <tr><td width="40%">Beneficiary Name</td><td><strong>DrizzleDrop Inn</strong></td></tr>
              <tr><td>Account number</td><td><strong>50200013228242</strong></td></tr>
              <tr><td>Account Type</td><td><strong>Current</strong></td></tr>
              <tr><td valign="top">Bank / IFSC</td><td><strong>HDFC BANK / HDFC0001270</strong></td></tr>
            </table>

            <div style="background: #fde8cc; padding: 6px; margin: 10px 0; font-size: 12px; font-weight: bold;">
              GOOGLE PAY / PAYTM : 9962822355
            </div>
          </td>
          <td width="40%" align="center" valign="top">
            <div style="border: 4px solid #1973e8; border-radius: 8px; padding: 10px; width: 160px; background: white;">
               <div style="font-size: 16px; font-weight: bold; color: #1973e8; margin-bottom: 5px;">G Pay</div>
               <div style="font-size: 10px; color: #5f6368; margin-bottom: 8px;">DrizzleDrop Inn</div>
               <img src="${qrCodeUrl}" width="140" height="140" style="display: block; margin: 0 auto;">
               <div style="font-size: 8px; color: #5f6368; margin-top: 5px; word-break: break-all;">9962822355@okbizaxis</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div class="blue-bar" style="margin: 0 30px;">
      NOTE: Once the Payment is done, please message details to +91 9962822355.
    </div>

    <div style="padding: 20px 30px; text-align: center;">
      <p style="text-decoration: underline; color: #d32f2f; font-weight: bold; font-size: 12px; margin-bottom: 5px;">Cancellation Policy:</p>
      <p style="color: #d32f2f; font-weight: bold; font-size: 10px; margin: 0;">• Free cancellation until 3 days before arrival.</p>
      <p style="color: #d32f2f; font-weight: bold; font-size: 10px; margin: 2px 0;">• One night charge if cancelled within 3 days.</p>
      <p style="font-size: 10px; margin-top: 5px;">Refund processed within 3-6 business days.</p>
    </div>

    <div style="padding: 0 30px 20px; font-size: 11px; font-weight: bold; display: flex; justify-content: center; gap: 40px;">
      <span>Checkin Time: 12:00 Noon</span>
      <span style="margin-left: 20px;">Checkout Time: 11:00 A.M</span>
    </div>

    <div class="footer">
      <p style="margin: 0; color: #2a7e3b; font-weight: bold; font-size: 18px; font-style: italic;">Thank you for your business</p>
      <p style="margin: 10px 0; color: #1e3a5f; font-weight: 900; font-size: 16px;">Manager: +91 91504 86153</p>
      <div style="font-size: 10px; color: #666; line-height: 1.5;">
        215 H, Dispensary Road, Fern Hill, Ooty, Tamil Nadu 643004<br>
        Ph: 0423 - 2440551, 0423 - 2440552<br>
        stay@drizzledropinn.com | www.drizzledropinn.com
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Drizzle Drop Inn" <${process.env.EMAIL_USER || 'noreply@drizzledropinn.com'}>`,
      to: res.guest_email,
      subject: `Booking Confirmation & Invoice - ${invoiceNo}`,
      html: html,
    });
    console.log('Invoice email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return null;
  }
};

exports.sendReceiptEmail = async (res) => {
  if (!res.guest_email) return;

  const receiptNo = `REC-${String(res.id).padStart(4, '0')}`;
  const checkInDate = new Date(res.check_in + 'T00:00:00');
  const checkOutDate = new Date(res.check_out + 'T00:00:00');
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const balanceDue = (res.total_tariff || 0) - (res.advance || 0);
  const details = typeof res.room_details === 'string' ? JSON.parse(res.room_details) : (res.room_details || []);

  let roomsHtml = '';
  if (details.length > 0) {
    details.forEach((room, idx) => {
      roomsHtml += `
        <div style="margin-bottom: 4px; border-bottom: ${idx < details.length - 1 ? '1px dotted #eee' : 'none'}; padding-bottom: 4px;">
          <p style="margin: 0; font-size: 13px; font-weight: bold;">${room.count} x ${room.type} @ ₹${room.rate}</p>
        </div>
      `;
    });
  } else {
    roomsHtml = `<p style="margin: 0; font-size: 13px; font-weight: bold;">${res.num_rooms} x ${res.room_type}</p>`;
  }

  let extraChargesHtml = '';
  if (res.early_checkin_amount > 0 || res.late_checkout_amount > 0 || res.stay_cosy_amount > 0 || res.special_requirements_amount > 0) {
    extraChargesHtml += `
      <div style="display: flex; align-items: flex-start; gap: 40px; margin-top: 10px;">
        <span style="font-size: 13px; font-weight: bold; min-width: 120px;">Extra Charges:</span>
        <div style="flex: 1;">
          ${res.early_checkin_amount > 0 ? `<p style="margin: 0 0 2px; font-size: 12px;">Early Check-in: ₹${res.early_checkin_amount}</p>` : ''}
          ${res.late_checkout_amount > 0 ? `<p style="margin: 0 0 2px; font-size: 12px;">Late Check-out: ₹${res.late_checkout_amount}</p>` : ''}
          ${res.stay_cosy_amount > 0 ? `<p style="margin: 0 0 2px; font-size: 12px;">Stay Cosy: ₹${res.stay_cosy_amount}</p>` : ''}
          ${res.special_requirements_amount > 0 ? `
            <div style="margin: 0 0 2px;">
              <p style="margin: 0; font-size: 12px;">Special Requirements: ₹${res.special_requirements_amount}</p>
              <p style="margin: 0; font-size: 10px; color: #666; font-style: italic;">(${res.special_requirements || ''})</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #f4f7f9; }
    .container { max-width: 720px; margin: 20px auto; background: #ffffff; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <div class="container">
    <div style="background: #3d5a80; color: #fff; text-align: center; padding: 22px 20px;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;">RESERVATION RECEIPT</h1>
    </div>

    <div style="padding: 24px 36px 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <p style="font-size: 14px; margin: 0; color: #333;">
          Dear <strong style="color: #111;">${res.guest_name || 'Guest'}</strong>,
        </p>
      </div>

      <p style="font-size: 13px; color: #444; margin: 0 0 16px 20px;">
        Thanks for choosing <strong>DrizzleDrop Inn.</strong>
      </p>

      ${res.advance > 0 ? `
      <p style="font-size: 14px; font-weight: bold; color: #d97706; margin: 0 0 4px 20px;">
        Received Rs.${res.advance.toLocaleString()}/- as advance
      </p>` : ''}

      <h2 style="font-size: 26px; font-weight: 900; color: #2a7e3b; margin: 0 0 14px 20px;">
        Your booking is confirmed.
      </h2>

      <div style="margin-left: 20px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 13px; font-weight: bold;">Guest Phone No.:</span>
          <span style="font-size: 13px;">${res.guest_phone || '--'}</span>
        </div>
        <p style="font-size: 13px; font-weight: bold; margin: 4px 0;">
          Total Tariff: Rs.${Number(res.total_tariff || 0).toLocaleString()}/-
        </p>
        <p style="font-size: 16px; font-weight: 900; color: #2563eb; margin: 4px 0;">
          Balance Amount: Rs.${balanceDue.toLocaleString()}/-
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 14px 0;" />

      <div style="margin-left: 20px; margin-bottom: 4px;">
        <div style="display: flex; align-items: flex-start; gap: 40px; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: bold; min-width: 120px;">Room Configuration:</span>
          <div style="flex: 1;">
            ${roomsHtml}
            <p style="margin: 4px 0 0; font-size: 13px; color: #2a7e3b; font-weight: 600;">Breakfast Included</p>
          </div>
        </div>
        ${extraChargesHtml}
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 14px 0;" />

      <div style="margin-left: 20px; margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 13px; font-weight: bold;">Check-In Date:</span>
          <span style="font-size: 13px;">${formatDate(checkInDate)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 13px; font-weight: bold;">Check-Out Date:</span>
          <span style="font-size: 13px;">${formatDate(checkOutDate)}</span>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 14px 0;" />

      <div style="margin-left: 20px; margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 13px;">Total Number of Guests (Adults)</span>
          <span style="font-size: 13px; font-weight: bold;">${res.adults}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 13px;">
            Total Number of Guests <span style="font-size: 11px;">(Kids - Below 10 years)</span>
          </span>
          <span style="font-size: 13px; font-weight: bold;">${res.children}</span>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 14px 0;" />

      <div style="margin-left: 20px; margin-bottom: 14px;">
        <div style="display: flex; gap: 30px; margin-bottom: 4px;">
          <span style="font-size: 13px; min-width: 130px;">Check-in Time</span>
          <span style="font-size: 13px; font-weight: 600;">${res.check_in_time || '12:00 Noon'}</span>
        </div>
        <div style="display: flex; gap: 30px;">
          <span style="font-size: 13px; min-width: 130px;">Check-Out Time</span>
          <span style="font-size: 13px; font-weight: 600;">${res.check_out_time || '11:00 A.M'}</span>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 900; color: #d32f2f; text-decoration: underline; text-transform: uppercase;">
          Cancellation Policy
        </h4>
        <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.7;">
          The guest can cancel free of charge until 3 days before arrival.<br />
          Cancellations made within 3 days of arrival will be charged for the first night.<br />
          Refunds, if applicable, will be processed within 3 to 6 days
        </p>
      </div>

      <div style="background: #4caf50; color: #fff; text-align: center; padding: 8px 10px; font-weight: 900; font-size: 14px; margin-bottom: 8px;">
        Manager : 9150486153
      </div>

      <div style="text-align: center; margin-bottom: 6px;">
        <p style="margin: 0 0 2px; font-size: 12px; color: #444;">E-Mail: stay@drizzledropinn.com | website: www.drizzledropinn.com</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Drizzle Drop Inn" <${process.env.EMAIL_USER || 'noreply@drizzledropinn.com'}>`,
      to: res.guest_email,
      subject: `Reservation Receipt - ${receiptNo}`,
      html: html,
    });
    console.log('Receipt email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return null;
  }
};
