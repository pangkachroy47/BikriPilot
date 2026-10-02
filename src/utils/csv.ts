import { Customer, Order, Product } from '../types';

/**
 * Exports data to CSV with UTF-8 BOM so Microsoft Excel renders Bangla characters correctly
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          const val = row[header] ?? '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  // Prefix with \uFEFF for UTF-8 Byte Order Mark
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a simple CSV text file into array of key-value objects
 */
export function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === headers.length) {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h.trim()] = values[idx]?.trim() || '';
      });
      result.push(obj);
    }
  }

  return result;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Order Export Helper
export function exportOrdersCsv(orders: Order[]) {
  const rows = orders.map(o => ({
    'অর্ডার নম্বর (Order #)': o.order_number,
    'গ্রাহকের নাম (Customer)': o.customer_name,
    'মোবাইল (Phone)': o.phone,
    'জেলা (District)': o.district,
    'থানা/এলাকা (Thana)': o.thana,
    'সম্পূর্ণ ঠিকানা (Address)': o.full_address,
    'পণ্য (Product)': o.product_name,
    'ভ্যারিয়েন্ট (Variant)': o.variant,
    'পরিমাণ (Qty)': o.quantity,
    'বিক্রয় মূল্য (Price)': o.selling_price,
    'ডেলিভারি চার্জ (Delivery)': o.delivery_charge,
    'অগ্রিম পরিশোধ (Advance)': o.advance_payment,
    'পেমেন্ট মেথড (Payment)': o.payment_method,
    'পণ্য খরচ (Cost)': o.product_cost,
    'কুরিয়ার খরচ (Courier)': o.courier_cost,
    'প্যাকেজিং (Packaging)': o.packaging_cost,
    'বিজ্ঞাপন খরচ (Ad Cost)': o.ad_cost,
    'নিট লাভ (Profit)': o.calculated_profit,
    'স্ট্যাটাস (Status)': o.status,
    'তারিখ (Date)': new Date(o.created_at).toLocaleDateString('bn-BD'),
  }));
  exportToCsv('BikriPilot_Orders', rows);
}

// Customers Export Helper
export function exportCustomersCsv(customers: Customer[]) {
  const rows = customers.map(c => ({
    'গ্রাহকের নাম': c.name,
    'মোবাইল নম্বর': c.phone,
    'জেলা': c.district,
    'থানা': c.thana,
    'ঠিকানা': c.full_address,
    'মোট অর্ডার': c.total_orders,
    'ডেলিভার্ড': c.delivered_orders,
    'রিটার্ন': c.returned_orders,
    'মোট কেনাকাটা (টাকা)': c.total_sales,
    'মোট অর্জিত লাভ (টাকা)': c.estimated_profit,
  }));
  exportToCsv('BikriPilot_Customers', rows);
}

// Products Export Helper
export function exportProductsCsv(products: Product[]) {
  const rows = products.map(p => ({
    'পণ্যের নাম': p.name,
    'SKU কোড': p.sku,
    'ভ্যারিয়েন্ট': p.variant,
    'বিক্রয় মূল্য (টাকা)': p.selling_price,
    'ক্রয় মূল্য/খরচ (টাকা)': p.cost_price,
    'মজুদ (Stock)': p.stock,
    'সম্ভাব্য একক লাভ (টাকা)': p.selling_price - p.cost_price,
  }));
  exportToCsv('BikriPilot_Products', rows);
}
