import { Order } from '../types';

export interface ProfitBreakdown {
  revenue: number;
  productSales: number;
  deliveryCollected: number;
  totalExpenses: number;
  productCost: number;
  courierCost: number;
  packagingCost: number;
  adCost: number;
  paymentFee: number;
  otherCost: number;
  returnCost: number;
  netProfit: number;
  profitMarginPct: number;
}

export interface ReturnLossBreakdown {
  outboundCourierCost: number;
  returnCourierCost: number;
  packagingCost: number;
  otherReturnCosts: number;
  totalReturnLoss: number;
}

/**
 * Calculates profit according to the BikriPilot business rule:
 * profit = product sales + delivery charge collected
 *          - product cost - courier cost - packaging cost
 *          - ad cost - payment fee - other cost - return cost
 */
export function calculateOrderProfit(
  order: Partial<Order> & {
    selling_price: number;
    quantity: number;
    delivery_charge?: number;
    product_cost?: number;
    courier_cost?: number;
    packaging_cost?: number;
    ad_cost?: number;
    other_cost?: number;
    return_courier_cost?: number;
    status?: string;
  }
): ProfitBreakdown {
  const quantity = Number(order.quantity) || 1;
  const unitSellingPrice = Number(order.selling_price) || 0;
  const productSales = unitSellingPrice * quantity;
  const deliveryCollected = Number(order.delivery_charge) || 0;
  const revenue = productSales + deliveryCollected;

  const unitProductCost = Number(order.product_cost) || 0;
  const productCost = unitProductCost * quantity;
  const courierCost = Number(order.courier_cost) || 0;
  const packagingCost = Number(order.packaging_cost) || 0;
  const adCost = Number(order.ad_cost) || 0;
  const otherCost = Number(order.other_cost) || 0;

  // COD or payment fee (if any, typically 0 or 1% COD fee)
  const paymentFee = 0;

  // Return cost is applied if order was returned
  const isReturned = order.status === 'Returned';
  const returnCost = isReturned ? (Number(order.return_courier_cost) || (courierCost * 0.5)) : 0;

  const totalExpenses = productCost + courierCost + packagingCost + adCost + paymentFee + otherCost + returnCost;
  
  // If order is returned, product sales is 0 and customer didn't pay delivery, but delivery loss occurred
  let netProfit: number;
  if (isReturned) {
    // Loss is packaging + outbound courier + return courier + ad cost + other
    netProfit = -(courierCost + returnCost + packagingCost + adCost + otherCost);
  } else if (order.status === 'Cancelled') {
    netProfit = 0;
  } else {
    netProfit = revenue - totalExpenses;
  }

  const profitMarginPct = revenue > 0 && !isReturned ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

  return {
    revenue: isReturned ? 0 : revenue,
    productSales: isReturned ? 0 : productSales,
    deliveryCollected: isReturned ? 0 : deliveryCollected,
    totalExpenses,
    productCost: isReturned ? 0 : productCost,
    courierCost,
    packagingCost,
    adCost,
    paymentFee,
    otherCost,
    returnCost,
    netProfit,
    profitMarginPct,
  };
}

/**
 * Calculates Return Loss for a returned parcel:
 * Outbound courier cost + return courier cost + packaging cost + other return costs
 */
export function calculateReturnLoss(order: Partial<Order>): ReturnLossBreakdown {
  const outboundCourierCost = Number(order.courier_cost) || 0;
  const returnCourierCost = Number(order.return_courier_cost) || Math.round(outboundCourierCost * 0.5);
  const packagingCost = Number(order.packaging_cost) || 0;
  const otherReturnCosts = Number(order.other_cost) || 0;
  const totalReturnLoss = outboundCourierCost + returnCourierCost + packagingCost + otherReturnCosts;

  return {
    outboundCourierCost,
    returnCourierCost,
    packagingCost,
    otherReturnCosts,
    totalReturnLoss,
  };
}

/**
 * Formats BDT with Bangladeshi Taka currency symbol
 * e.g. ৳ ১,২৫০ or ৳ 1,250
 */
export function formatBDT(amount: number, useBengaliDigits: boolean = false): string {
  const rounded = Math.round(amount);
  const formattedEn = rounded.toLocaleString('en-IN');

  if (!useBengaliDigits) {
    return `৳${formattedEn}`;
  }

  const enToBnDigits: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    ',': ',', '-': '-',
  };

  const bnStr = formattedEn.split('').map(c => enToBnDigits[c] || c).join('');
  return `৳${bnStr}`;
}
