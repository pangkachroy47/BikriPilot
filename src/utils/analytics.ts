/**
 * BikriPilot Standard Analytics & Error Telemetry Engine
 * Supports standard Meta Pixel, DOM custom events, and Server-side telemetry
 */

export interface AnalyticsEventPayloads {
  ViewContent: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
  };
  Lead: {
    source?: string;
    customer_phone?: string;
    shop_id?: string;
  };
  InitiateCheckout: {
    order_id?: string;
    value?: number;
    currency?: string;
    num_items?: number;
  };
  Purchase: {
    order_id: string;
    order_number: string;
    value: number;
    currency: string;
    customer_phone?: string;
    payment_method?: string;
    estimated_profit?: number;
  };
  AIOrderCaptured: {
    shop_id?: string;
    model: string;
    success: boolean;
    confidence_score?: number;
    duration_ms?: number;
  };
  OrderCreated: {
    order_id: string;
    order_number: string;
    selling_price: number;
    net_profit: number;
    profit_margin_pct: number;
    payment_method: string;
  };
  OrderStatusUpdated: {
    order_id: string;
    previous_status: string;
    new_status: string;
  };
  InvoiceDownloaded: {
    order_number: string;
    format: 'pdf' | 'print';
  };
  SubscriptionUpgrade: {
    plan_name: string;
    amount: number;
    payment_method: string;
    transaction_id: string;
  };
  ProductCreated: {
    product_name: string;
    selling_price: number;
    stock: number;
  };
}

/**
 * Tracks an analytics event across DOM, Meta Pixel, and Server API
 */
export function trackEvent<T extends keyof AnalyticsEventPayloads>(
  eventName: T,
  payload: AnalyticsEventPayloads[T],
  shopId?: string
) {
  // 1. Dispatch custom DOM event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(`bikripilot:${eventName}`, {
        detail: { eventName, payload, timestamp: Date.now() },
      })
    );

    // Call window.fbq if available (Meta Pixel)
    if (typeof (window as any).fbq === 'function') {
      try {
        (window as any).fbq('track', eventName, payload);
      } catch (e) {
        console.debug('Pixel error:', e);
      }
    }
  }

  // 2. Transmit to server analytics endpoint asynchronously
  fetch('/api/track-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, payload, shopId }),
  }).catch(() => {
    // Non-blocking telemetry
  });
}

/**
 * Transmits uncaught client error telemetry to production backend
 */
export function logClientError(error: Error | any, errorInfo?: any, shopId?: string) {
  const errorData = {
    message: error?.message || String(error),
    stack: error?.stack,
    componentStack: errorInfo?.componentStack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    shopId,
  };

  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData),
  }).catch(() => {
    // Non-blocking telemetry
  });
}
