// Dynamic loader for Razorpay's checkout script — never hardcoded into index.html, since most page
// loads on this site never trigger a payment at all. Guards against double-injection (StrictMode's
// double-invoked effects, or two components mounting a payment flow at once) by caching the loading
// promise itself, not just checking for an existing <script> tag after the fact.

const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

// Fired when Razorpay itself reports a failed attempt (card declined, bank timeout, etc.) — distinct
// from the user simply closing the modal (modal.ondismiss) and from our own /verify call failing.
// error.description is Razorpay's own human-readable reason, safe to show directly.
export interface RazorpayPaymentFailedResponse {
  error: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
  };
}

export interface RazorpayCheckoutInstance {
  open: () => void;
  close: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayPaymentFailedResponse) => void) => void;
}

let loadPromise: Promise<void> | null = null;

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script')));
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // allow a retry on a later attempt instead of permanently failing
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}
