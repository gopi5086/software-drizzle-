import html2canvas from 'html2canvas';
import type { UnifiedInvoiceData } from '../components/UnifiedInvoice';
import type { ReceiptData } from '../components/ReservationReceipt';

/**
 * Renders the UnifiedInvoice component into a hidden offscreen container
 * and captures it as a high-resolution PNG using html2canvas.
 *
 * Returns a Blob (PNG) or null if capture fails.
 */
export async function captureInvoiceAsBlob(data: UnifiedInvoiceData): Promise<Blob | null> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 780px;
    background: #fff;
    z-index: -1;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
  `;
  document.body.appendChild(container);

  const { default: React } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: UnifiedInvoice } = await import('../components/UnifiedInvoice');

  const root = createRoot(container);

  // Wait for React to render + allow time for QR code image to load
  await new Promise<void>((resolve) => {
    root.render(React.createElement(UnifiedInvoice, { data }));
    setTimeout(resolve, 1400);
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2,           // 2× for high-DPI / retina sharpness
      useCORS: true,      // Allow cross-origin images (QR code API)
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
    });

    return blob;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

/**
 * Renders the ReservationReceipt component into a hidden offscreen container
 * and captures it as a high-resolution PNG using html2canvas.
 */
export async function captureReceiptAsBlob(data: ReceiptData): Promise<Blob | null> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 780px;
    background: #fff;
    z-index: -1;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
  `;
  document.body.appendChild(container);

  const { default: React } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: ReservationReceipt } = await import('../components/ReservationReceipt');

  const root = createRoot(container);

  await new Promise<void>((resolve) => {
    root.render(React.createElement(ReservationReceipt, { data }));
    setTimeout(resolve, 1400);
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
    });

    return blob;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

/**
 * Captures the invoice template as a PNG image, downloads it to the device,
 * then opens WhatsApp directly to the CUSTOMER'S chat using their phone number.
 *
 * Flow:
 *  1. Render UnifiedInvoice offscreen & capture as PNG
 *  2. Auto-download the PNG to the device
 *  3. Open wa.me/<customerPhone> → opens WhatsApp directly to that customer's chat
 *  4. Staff attaches the downloaded image and hits Send
 *
 * @param data       UnifiedInvoiceData for the reservation
 * @param invoiceNo  Invoice number string e.g. "DDI-0042"
 * @param phone      Customer phone with country code, digits only (e.g. "919962822355")
 */
export async function sendInvoiceViaWhatsApp(
  data: UnifiedInvoiceData,
  invoiceNo: string,
  phone: string,
): Promise<{ success: boolean; error?: string }> {
  // ── Step 1: Capture invoice as PNG ───────────────────────────────────────
  let blob: Blob | null = null;
  try {
    blob = await captureInvoiceAsBlob(data);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  if (!blob) {
    return { success: false, error: 'Failed to capture invoice image' };
  }

  // ── Step 2: Download the invoice PNG to the device ────────────────────────
  const fileName = `${invoiceNo}-DrizzleDrop-Invoice.png`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);

  // ── Step 3: Open WhatsApp directly to the customer's chat ─────────────────
  // wa.me/<phone> with no text opens straight into the customer's conversation
  // Staff just taps the attachment (📎) icon and selects the invoice image
  setTimeout(() => {
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  }, 600);

  return { success: true };
}

/**
 * Captures the ReservationReceipt as PNG, downloads it, and opens WhatsApp to the guest.
 */
export async function sendReceiptViaWhatsApp(
  data: ReceiptData,
  receiptNo: string,
  phone: string,
): Promise<{ success: boolean; error?: string }> {
  let blob: Blob | null = null;
  try {
    blob = await captureReceiptAsBlob(data);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  if (!blob) {
    return { success: false, error: 'Failed to capture receipt image' };
  }

  const fileName = `${receiptNo}-DrizzleDrop-Receipt.png`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);

  setTimeout(() => {
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  }, 600);

  return { success: true };
}



