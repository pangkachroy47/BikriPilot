import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Order, Shop } from '../types';

/**
 * Sanitizes string for pdf-lib StandardFonts (Helvetica) to prevent WinAnsi encoding crashes
 */
function toSafePdfString(str: string | undefined | null, fallback: string = ''): string {
  if (!str) return fallback;
  // Replace characters outside WinAnsi Latin-1 (0x20 - 0xFF) with Latin representation or transliteration
  // To ensure the PDF never throws WinAnsi error even with Bengali input:
  return str
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 255) {
        return char;
      }
      return '';
    })
    .join('')
    .trim() || fallback;
}

/**
 * Generates an executive, print-ready PDF invoice for Bangladeshi F-commerce orders
 */
export async function generateInvoicePdf(order: Order, shop: Shop): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (Points)
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Corporate Theme Palette
  const primaryColor = rgb(0.05, 0.58, 0.53); // Emerald/Teal #0d9488
  const darkColor = rgb(0.12, 0.16, 0.22); // #1e293b
  const mutedColor = rgb(0.4, 0.45, 0.53); // #64748b
  const lightBg = rgb(0.96, 0.98, 0.98); // Slate 50
  const borderGrey = rgb(0.88, 0.91, 0.94);

  let y = height - 50;

  // Header Banner Background
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: width - 80,
    height: 70,
    color: primaryColor,
  });

  // Shop Header Information
  const shopNameText = toSafePdfString(shop.name, 'BikriPilot Merchant Store');
  const shopPhoneText = toSafePdfString(shop.phone, 'Helpline');
  const fbPageText = toSafePdfString(shop.fb_page_name, 'Online Facebook Store');

  page.drawText(shopNameText, {
    x: 55,
    y: y - 20,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Facebook Page: ${fbPageText} | Helpline: ${shopPhoneText}`, {
    x: 55,
    y: y - 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.9, 0.96, 0.95),
  });

  // Invoice Title on Top Right
  page.drawText('INVOICE / MEMO', {
    x: width - 200,
    y: y - 22,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Invoice #${order.order_number}`, {
    x: width - 200,
    y: y - 40,
    size: 10,
    font: fontRegular,
    color: rgb(0.9, 0.96, 0.95),
  });

  y -= 90;

  // Date and Meta Row
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  page.drawText(`Date: ${orderDate}`, {
    x: 45,
    y,
    size: 10,
    font: fontRegular,
    color: darkColor,
  });

  const paymentMethodSafe = toSafePdfString(order.payment_method, 'Cash on Delivery');
  page.drawText(`Payment Method: ${paymentMethodSafe}`, {
    x: width / 2 - 20,
    y,
    size: 10,
    font: fontRegular,
    color: darkColor,
  });

  page.drawText(`Status: ${order.status.toUpperCase()}`, {
    x: width - 180,
    y,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  y -= 25;

  // Customer Info Card
  page.drawRectangle({
    x: 40,
    y: y - 80,
    width: width - 80,
    height: 80,
    color: lightBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });

  page.drawText('CUSTOMER & DELIVERY DETAILS / PARCEL SLIP', {
    x: 55,
    y: y - 18,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  const customerNameSafe = toSafePdfString(order.customer_name, 'Valued Customer');
  const customerPhoneSafe = toSafePdfString(order.phone, 'N/A');
  const addressSafe = toSafePdfString(
    `${order.full_address}${order.thana ? ', ' + order.thana : ''}${order.district ? ', ' + order.district : ''}`,
    'Customer Address'
  );

  page.drawText(`Customer Name: ${customerNameSafe}`, {
    x: 55,
    y: y - 35,
    size: 11,
    font: fontBold,
    color: darkColor,
  });

  page.drawText(`Mobile Number: ${customerPhoneSafe}`, {
    x: 55,
    y: y - 52,
    size: 10,
    font: fontRegular,
    color: darkColor,
  });

  const truncatedAddress = addressSafe.length > 70 ? addressSafe.slice(0, 68) + '...' : addressSafe;
  page.drawText(`Address: ${truncatedAddress}`, {
    x: 55,
    y: y - 69,
    size: 10,
    font: fontRegular,
    color: darkColor,
  });

  y -= 110;

  // Product Table Header
  page.drawRectangle({
    x: 40,
    y: y - 24,
    width: width - 80,
    height: 24,
    color: rgb(0.93, 0.95, 0.98),
  });

  page.drawText('SL', { x: 50, y: y - 16, size: 9, font: fontBold, color: darkColor });
  page.drawText('ITEM DESCRIPTION', { x: 80, y: y - 16, size: 9, font: fontBold, color: darkColor });
  page.drawText('VARIANT', { x: 280, y: y - 16, size: 9, font: fontBold, color: darkColor });
  page.drawText('QTY', { x: 370, y: y - 16, size: 9, font: fontBold, color: darkColor });
  page.drawText('PRICE (BDT)', { x: 420, y: y - 16, size: 9, font: fontBold, color: darkColor });
  page.drawText('TOTAL (BDT)', { x: width - 120, y: y - 16, size: 9, font: fontBold, color: darkColor });

  y -= 30;

  // Product Item Row
  const itemTotal = Number(order.selling_price) * Number(order.quantity);
  const productNameSafe = toSafePdfString(order.product_name, 'Ordered Product');
  const variantSafe = toSafePdfString(order.variant, 'Standard');

  page.drawText('1', { x: 50, y: y - 12, size: 10, font: fontRegular, color: darkColor });
  page.drawText(productNameSafe.slice(0, 32), { x: 80, y: y - 12, size: 10, font: fontBold, color: darkColor });
  page.drawText(variantSafe.slice(0, 16), { x: 280, y: y - 12, size: 10, font: fontRegular, color: mutedColor });
  page.drawText(String(order.quantity), { x: 375, y: y - 12, size: 10, font: fontRegular, color: darkColor });
  page.drawText(`BDT ${Number(order.selling_price).toLocaleString()}`, { x: 420, y: y - 12, size: 10, font: fontRegular, color: darkColor });
  page.drawText(`BDT ${itemTotal.toLocaleString()}`, { x: width - 120, y: y - 12, size: 10, font: fontBold, color: darkColor });

  // Divider line
  page.drawLine({
    start: { x: 40, y: y - 24 },
    end: { x: width - 40, y: y - 24 },
    thickness: 1,
    color: borderGrey,
  });

  y -= 50;

  // Financial Summary Section (Right aligned)
  const summaryX = width - 240;
  const deliveryCharge = Number(order.delivery_charge) || 0;
  const advancePayment = Number(order.advance_payment) || 0;
  const grandTotal = itemTotal + deliveryCharge;
  const dueOnDelivery = Math.max(0, grandTotal - advancePayment);

  // Subtotal
  page.drawText('Item Subtotal:', { x: summaryX, y, size: 10, font: fontRegular, color: mutedColor });
  page.drawText(`BDT ${itemTotal.toLocaleString()}`, { x: width - 110, y, size: 10, font: fontRegular, color: darkColor });
  y -= 20;

  // Delivery
  page.drawText('Delivery Charge:', { x: summaryX, y, size: 10, font: fontRegular, color: mutedColor });
  page.drawText(`BDT ${deliveryCharge.toLocaleString()}`, { x: width - 110, y, size: 10, font: fontRegular, color: darkColor });
  y -= 20;

  // Total
  page.drawText('Total Amount:', { x: summaryX, y, size: 10, font: fontBold, color: darkColor });
  page.drawText(`BDT ${grandTotal.toLocaleString()}`, { x: width - 110, y, size: 10, font: fontBold, color: darkColor });
  y -= 20;

  // Advance
  if (advancePayment > 0) {
    page.drawText('Advance Received (-):', { x: summaryX, y, size: 10, font: fontRegular, color: rgb(0.1, 0.6, 0.3) });
    page.drawText(`BDT ${advancePayment.toLocaleString()}`, { x: width - 110, y, size: 10, font: fontRegular, color: rgb(0.1, 0.6, 0.3) });
    y -= 20;
  }

  // Final Due / Cash to Collect Card
  page.drawRectangle({
    x: summaryX - 10,
    y: y - 30,
    width: 170,
    height: 35,
    color: lightBg,
    borderColor: primaryColor,
    borderWidth: 1.5,
  });

  page.drawText('CASH TO COLLECT (COD):', {
    x: summaryX,
    y: y - 14,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText(`BDT ${dueOnDelivery.toLocaleString()}`, {
    x: summaryX,
    y: y - 26,
    size: 13,
    font: fontBold,
    color: primaryColor,
  });

  // Notes and Courier instructions on the left
  if (order.notes) {
    const notesSafe = toSafePdfString(order.notes, 'Please deliver with care.');
    page.drawText('Courier Note / Delivery Instruction:', {
      x: 45,
      y: y + 20,
      size: 9,
      font: fontBold,
      color: darkColor,
    });
    page.drawText(notesSafe.slice(0, 60), {
      x: 45,
      y: y + 5,
      size: 9,
      font: fontRegular,
      color: mutedColor,
    });
  }

  // Footer / Terms
  const footerY = 60;
  page.drawLine({
    start: { x: 40, y: footerY + 25 },
    end: { x: width - 40, y: footerY + 25 },
    thickness: 1,
    color: borderGrey,
  });

  page.drawText('Thank you for shopping with us! Please check parcel before making payment.', {
    x: 45,
    y: footerY + 10,
    size: 9,
    font: fontRegular,
    color: mutedColor,
  });

  page.drawText('Generated seamlessly via BikriPilot — Bangladeshi F-Commerce Order & Profit Assistant', {
    x: 45,
    y: footerY - 5,
    size: 8,
    font: fontRegular,
    color: mutedColor,
  });

  return await pdfDoc.save();
}

/**
 * Helper to download PDF directly in browser
 */
export function downloadPdfBlob(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print Invoice with full native Bengali font support
 * Opens clean, styled print dialogue for thermal / A4 packing slips
 */
export function printInvoiceSlip(order: Order, shop: Shop) {
  const itemTotal = order.selling_price * order.quantity;
  const grandTotal = itemTotal + order.delivery_charge;
  const codDue = Math.max(0, grandTotal - order.advance_payment);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.warn('Unable to access print iframe');
    document.body.removeChild(iframe);
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>ক্যাশ মেমো - ${order.order_number}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hind Siliguri', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 24px;
          background: #fff;
        }
        .invoice-card {
          max-width: 720px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0d9488;
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; }
        .badge { background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
        .section-title { font-size: 11px; text-transform: uppercase; color: #0d9488; font-weight: bold; margin-bottom: 6px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 16px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
        th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        .summary-box { width: 260px; margin-left: auto; font-size: 13px; }
        .summary-line { display: flex; justify-content: space-between; padding: 4px 0; }
        .cod-due { background: #f0fdfa; border: 1.5px solid #0d9488; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 16px; color: #0f766e; margin-top: 8px; display: flex; justify-content: space-between; }
        .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
        @media print {
          body { padding: 0; }
          .invoice-card { border: none; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <h1>${shop.name}</h1>
            <p>Facebook Page: ${shop.fb_page_name} | হেল্পলাইন: ${shop.phone || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <div class="badge">অর্ডার #${order.order_number}</div>
            <p style="font-size: 11px; margin-top: 4px;">তারিখ: ${new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
          </div>
        </div>

        <div class="card">
          <div class="section-title">ডেলিভারি ও কাস্টমার তথ্য / Parcel Slip</div>
          <div class="meta-row"><strong>গ্রাহকের নাম:</strong> <span>${order.customer_name}</span></div>
          <div class="meta-row"><strong>মোবাইল:</strong> <span style="font-family: monospace; font-weight: bold;">${order.phone}</span></div>
          <div class="meta-row"><strong>ডেলিভারি ঠিকানা:</strong> <span>${order.full_address}${order.thana ? ', ' + order.thana : ''}${order.district ? ', ' + order.district : ''}</span></div>
          ${order.notes ? `<div class="meta-row" style="color: #b45309;"><strong>নির্দেশনা:</strong> <span>${order.notes}</span></div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>আইটেম</th>
              <th>ভ্যারিয়েন্ট</th>
              <th style="text-align: center;">পরিমাণ</th>
              <th style="text-align: right;">দর (টাকা)</th>
              <th style="text-align: right;">মোট (টাকা)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${order.product_name}</strong></td>
              <td>${order.variant || 'Standard'}</td>
              <td style="text-align: center;">${order.quantity}</td>
              <td style="text-align: right;">৳${order.selling_price.toLocaleString()}</td>
              <td style="text-align: right; font-weight: bold;">৳${itemTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-line"><span>পণ্যের মূল্য:</span> <span>৳${itemTotal.toLocaleString()}</span></div>
          <div class="summary-line"><span>ডেলিভারি চার্জ:</span> <span>+ ৳${order.delivery_charge.toLocaleString()}</span></div>
          <div class="summary-line" style="font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 4px;">
            <span>মোট বিল:</span> <span>৳${grandTotal.toLocaleString()}</span>
          </div>
          ${order.advance_payment > 0 ? `<div class="summary-line" style="color: #059669;"><span>অগ্রিম জমা (${order.payment_method}):</span> <span>- ৳${order.advance_payment.toLocaleString()}</span></div>` : ''}
          <div class="cod-due">
            <span>ক্যাশ অন ডেলিভারি (বাকি):</span>
            <span>৳${codDue.toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p>আমাদের শপে অর্ডার করার জন্য ধন্যবাদ! পার্সেল চেক করে বুঝে নিন।</p>
          <p style="font-size: 10px; color: #94a3b8;">BikriPilot — F-Commerce Order & Profit Assistant দ্বারা প্রস্তুতকৃত</p>
        </div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);
}
