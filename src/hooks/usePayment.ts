import { useCallback, useEffect, useRef, useState } from 'react';
import { loadRazorpayCheckoutScript, type RazorpayCheckoutOptions } from '../lib/razorpayCheckout';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

export type PaymentStatus = 'idle' | 'creating_order' | 'awaiting_payment' | 'verifying' | 'success' | 'failed' | 'cancelled';

export type PaymentPurpose = 'rfs_document' | 'bid_processing';

interface Prefill {
  name?: string;
  email?: string;
  contact?: string;
}

// Two distinct shapes, matching the two order-creation routes on the backend — rfs_document is
// account-less (payer details typed into the form), everything else is an authenticated org action
// (an org bearer token, no payer details needed).
export type StartPaymentInput =
  | {
      purpose: 'rfs_document';
      tenderId: number;
      payerName: string;
      payerEmail: string;
      company: string;
      designation: string;
      mobile: string;
      isGenerator: boolean;
      consentGiven: true;
      notes?: Record<string, string>;
      prefill?: Prefill;
    }
  | { purpose: 'bid_processing'; tenderId: number; token: string; prefill?: Prefill };

export interface PaymentResult {
  paymentId: string;
  orderId: string;
}

// Encapsulates the entire checkout flow end to end: create the order server-side, load the
// checkout script, open the Razorpay modal (passing order_id only — never amount, since the order
// already locks the price server-side), and verify the result. Every payment-triggering page in
// this app should go through this hook rather than talking to Razorpay or /api/payment/* directly.
export function usePayment() {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Guards against setState-after-unmount if a user navigates away mid-flow (e.g. while the
  // checkout modal is open) — not a literal script-tag removal, since the script itself is a
  // shared, cheap-to-keep-loaded global resource other components may still need.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isProcessing = status === 'creating_order' || status === 'awaiting_payment' || status === 'verifying';

  const startPayment = useCallback(async (input: StartPaymentInput): Promise<PaymentResult | null> => {
    setError(null);
    setStatus('creating_order');

    if (!RAZORPAY_KEY_ID) {
      setStatus('failed');
      setError('Payment is not configured (VITE_RAZORPAY_KEY_ID missing).');
      return null;
    }

    try {
      const isRfsDocument = input.purpose === 'rfs_document';
      const orderRes = await fetch(`${API_BASE}/api/payment/orders${isRfsDocument ? '/rfs-document' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isRfsDocument ? {} : { Authorization: `Bearer ${input.token}` }),
        },
        body: JSON.stringify(
          isRfsDocument
            ? {
                tenderId: input.tenderId,
                payerName: input.payerName,
                payerEmail: input.payerEmail,
                company: input.company,
                designation: input.designation,
                mobile: input.mobile,
                isGenerator: input.isGenerator,
                consentGiven: input.consentGiven,
                notes: input.notes,
              }
            : { purpose: input.purpose, tenderId: input.tenderId }
        ),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Failed to create payment order');

      await loadRazorpayCheckoutScript();
      if (!isMountedRef.current) return null;

      setStatus('awaiting_payment');

      const result = await new Promise<PaymentResult | null>((resolve) => {
        const options: RazorpayCheckoutOptions = {
          key: orderData.keyId,
          order_id: orderData.orderId,
          currency: orderData.currency,
          name: 'Wattmatch',
          prefill: input.prefill,
          handler: (response) => {
            void (async () => {
              if (!isMountedRef.current) return;
              setStatus('verifying');
              try {
                const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (!isMountedRef.current) return;
                if (!verifyData.success) {
                  setStatus('failed');
                  setError(verifyData.error || 'Payment verification failed');
                  return resolve(null);
                }
                setStatus('success');
                resolve({ paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id });
              } catch (err) {
                if (!isMountedRef.current) return;
                setStatus('failed');
                setError(err instanceof Error ? err.message : 'Payment verification failed');
                resolve(null);
              }
            })();
          },
          modal: {
            ondismiss: () => {
              if (!isMountedRef.current) return;
              setStatus('cancelled');
              resolve(null);
            },
          },
        };

        // eslint-disable-next-line new-cap
        new window.Razorpay(options).open();
      });

      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Payment failed');
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, isProcessing, startPayment, reset };
}
