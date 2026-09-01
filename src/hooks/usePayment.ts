import { useCallback, useEffect, useRef, useState } from 'react';
import { loadRazorpayCheckoutScript, type RazorpayCheckoutOptions } from '../lib/razorpayCheckout';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

export type PaymentStatus =
  | 'idle'
  | 'creating_order'
  | 'awaiting_payment'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'cancelled'
  // The order-creation call 409'd because this tender+purpose(+payer) was already paid for by an
  // earlier attempt — not a failure at all, just stale client state. Callers should treat this the
  // same as a successful payment (re-fetch/re-download whatever the purchase unlocks) rather than
  // showing an error.
  | 'already_paid'
  // Razorpay's handler fired (the checkout modal reported success) but /api/payment/verify never
  // gave a definite answer after retrying — a network/timeout problem, not a declined payment. The
  // backend's webhook may still fulfil this independently of whether this call ever resolves, so
  // this is deliberately NOT lumped in with 'failed': it must not tell the user their payment failed
  // when it may well have gone through.
  | 'verify_unconfirmed';

// Distinguishes "the payment itself was declined" (safe to blame on the card/method, invites a
// plain retry) from "something on our end/network had a problem" (nothing charged for THIS attempt,
// invites a retry with reassurance instead of implying the user did something wrong). Only
// meaningful when status === 'failed'.
export type PaymentErrorKind = 'card' | 'system' | null;

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

// startPayment's return value. A discriminated union rather than PaymentResult|null so callers can
// branch on exactly what happened without racing the hook's own `status` state — setState calls made
// from inside async callbacks are not guaranteed to be visible to a caller the instant the awaited
// promise resolves, so control flow must never depend on reading `status` right after `await
// startPayment(...)`. This return value is the single source of truth for that instead.
export type PaymentOutcome =
  | ({ outcome: 'success' } & PaymentResult)
  | { outcome: 'already_paid' }
  | { outcome: 'verify_unconfirmed' }
  | { outcome: 'cancelled' }
  | { outcome: 'failed' };

const PENDING_PAYMENT_PREFIX = 'wattmatch:pending-payment:';

function pendingPaymentKey(purpose: PaymentPurpose, tenderId: number): string {
  return `${PENDING_PAYMENT_PREFIX}${purpose}:${tenderId}`;
}

// Set right before the Razorpay modal opens, cleared on every terminal outcome below (success,
// failure, or cancellation) — but deliberately NOT cleared for 'verify_unconfirmed" (see startPayment),
// since that outcome means we genuinely don't know whether this attempt will complete.
// If a page finds this still set on mount, the last attempt for that tender+purpose never reached a
// terminal state in this browser — most likely the tab was closed or refreshed between paying and
// /api/payment/verify resolving — so it's worth warning before letting the same fee be paid again.
// Best-effort only (private browsing / disabled storage just means the warning never shows, same as
// this app's other sessionStorage/localStorage use).
export function hasPendingPayment(purpose: PaymentPurpose, tenderId: number): boolean {
  try {
    return sessionStorage.getItem(pendingPaymentKey(purpose, tenderId)) !== null;
  } catch {
    return false;
  }
}

function markPendingPayment(purpose: PaymentPurpose, tenderId: number): void {
  try {
    sessionStorage.setItem(pendingPaymentKey(purpose, tenderId), String(Date.now()));
  } catch {
    // best-effort
  }
}

function clearPendingPayment(purpose: PaymentPurpose, tenderId: number): void {
  try {
    sessionStorage.removeItem(pendingPaymentKey(purpose, tenderId));
  } catch {
    // best-effort
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A non-JSON body only happens for an infra-level failure (gateway timeout/WAF page) — every
// application-level response here is valid JSON — so this turns that rare case into one friendly
// message instead of leaking a raw "Unexpected token '<'..." parser error to someone mid-payment.
async function parseJsonResponse(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    throw new Error('Something went wrong contacting the payment server — please try again.');
  }
}

// True for the backend's transient "a request for this is already being processed" 409 (concurrent
// in-flight request holding the lock) — as opposed to a terminal "already purchased/paid" 409, which
// means an earlier attempt already completed. See routes/payments.ts's LockContentionError handling.
function isContention409(message: string | undefined): boolean {
  return /already being processed/i.test(message ?? '');
}

const ORDER_CONTENTION_RETRY_DELAY_MS = 1000;
const VERIFY_RETRY_DELAYS_MS = [500, 1500];

// Encapsulates the entire checkout flow end to end: create the order server-side, load the
// checkout script, open the Razorpay modal (passing order_id only — never amount, since the order
// already locks the price server-side), and verify the result. Every payment-triggering page in
// this app should go through this hook rather than talking to Razorpay or /api/payment/* directly.
export function usePayment() {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<PaymentErrorKind>(null);

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

  // Synchronous re-entrancy guard, checked and set before any await — a double-click or a second
  // Enter-triggered submit event fires this callback twice back-to-back, both times before React
  // has re-rendered the disabled button, so the `isProcessing` state below arrives too late to stop
  // the second call on its own. This ref catches it immediately instead.
  const isBusyRef = useRef(false);

  const isProcessing = status === 'creating_order' || status === 'awaiting_payment' || status === 'verifying';

  const startPayment = useCallback(async (input: StartPaymentInput): Promise<PaymentOutcome> => {
    if (isBusyRef.current) return { outcome: 'failed' };
    isBusyRef.current = true;

    setError(null);
    setErrorKind(null);
    setStatus('creating_order');

    if (!RAZORPAY_KEY_ID) {
      isBusyRef.current = false;
      setStatus('failed');
      setErrorKind('system');
      setError('Payment is not configured (VITE_RAZORPAY_KEY_ID missing).');
      return { outcome: 'failed' };
    }

    const isRfsDocument = input.purpose === 'rfs_document';

    async function requestOrder(): Promise<{ status: number; data: any }> {
      const orderRes = await fetch(`${API_BASE}/api/payment/orders${isRfsDocument ? '/rfs-document' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isRfsDocument ? {} : { Authorization: `Bearer ${(input as { token: string }).token}` }),
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
      const data = await parseJsonResponse(orderRes);
      return { status: orderRes.status, data };
    }

    try {
      // Up to one automatic retry, and only for the transient "already being processed" 409 — a
      // concurrent request (another tab, a near-simultaneous double-click that got past the ref
      // guard above on a fresh mount, etc.) is actively creating the real order right now, so waiting
      // a moment and asking again is very likely to succeed. A terminal "already purchased" 409 is
      // handled separately below and never retried.
      let attempt = await requestOrder();
      if (!attempt.data.success && attempt.status === 409 && isContention409(attempt.data.error)) {
        await sleep(ORDER_CONTENTION_RETRY_DELAY_MS);
        if (!isMountedRef.current) {
          isBusyRef.current = false;
          return { outcome: 'failed' };
        }
        attempt = await requestOrder();
      }

      if (!attempt.data.success) {
        if (attempt.status === 409 && !isContention409(attempt.data.error)) {
          // Terminal: an earlier attempt already completed this exact purchase.
          isBusyRef.current = false;
          setStatus('already_paid');
          return { outcome: 'already_paid' };
        }
        // Anything else here (validation error, contention that didn't clear after one retry,
        // tender not found, 5xx) is a pre-payment, infra/system-side problem — nothing has been
        // charged yet.
        setErrorKind('system');
        throw new Error(attempt.data.error || 'Failed to create payment order');
      }

      const orderData = attempt.data;

      await loadRazorpayCheckoutScript();
      if (!isMountedRef.current) {
        isBusyRef.current = false;
        return { outcome: 'failed' };
      }

      setStatus('awaiting_payment');
      markPendingPayment(input.purpose, input.tenderId);

      const result = await new Promise<PaymentOutcome>((resolve) => {
        // Razorpay can call both `handler` (via payment.failed's own dismiss) and `modal.ondismiss`
        // for the same attempt — this makes sure only the first outcome we see actually applies.
        let settled = false;
        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

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

              let verifyData: any = null;
              let networkFailure = false;
              for (let i = 0; i <= VERIFY_RETRY_DELAYS_MS.length; i++) {
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
                  verifyData = await parseJsonResponse(verifyRes);
                  networkFailure = false;
                  break;
                } catch (err) {
                  networkFailure = true;
                  verifyData = { success: false, error: err instanceof Error ? err.message : 'Payment verification failed' };
                  if (i < VERIFY_RETRY_DELAYS_MS.length) {
                    await sleep(VERIFY_RETRY_DELAYS_MS[i]);
                    if (!isMountedRef.current) return;
                  }
                }
              }

              if (!isMountedRef.current) return;

              if (networkFailure) {
                // Verify never got a definite answer after retrying — this is NOT the same as a
                // failed payment. The checkout modal already reported success, and the backend's
                // webhook can fulfil this independently of this call, so the pending-payment marker
                // is deliberately left in place rather than cleared: a later reload should still warn
                // before letting this same fee be paid again.
                setStatus('verify_unconfirmed');
                setError(
                  "We couldn't confirm your payment because of a connection problem. If you were charged, it will still be processed automatically — check back in a minute, or reload this page later to see your updated status."
                );
                return settle(() => resolve({ outcome: 'verify_unconfirmed' }));
              }

              if (!verifyData.success) {
                clearPendingPayment(input.purpose, input.tenderId);
                setStatus('failed');
                setErrorKind('system');
                setError(verifyData.error || 'Payment verification failed');
                return settle(() => resolve({ outcome: 'failed' }));
              }

              clearPendingPayment(input.purpose, input.tenderId);
              setStatus('success');
              settle(() =>
                resolve({ outcome: 'success', paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id })
              );
            })();
          },
          modal: {
            ondismiss: () => {
              if (!isMountedRef.current) return;
              settle(() => {
                clearPendingPayment(input.purpose, input.tenderId);
                setStatus('cancelled');
                resolve({ outcome: 'cancelled' });
              });
            },
          },
        };

        // eslint-disable-next-line new-cap
        const rzp = new window.Razorpay(options);
        // Razorpay's own report of a declined/failed attempt (bad card, bank timeout, etc.) — kept
        // distinct from modal.ondismiss (a plain "closed without paying") and from our /verify call
        // failing, since the guidance shown to the user differs for each.
        rzp.on('payment.failed', (resp) => {
          if (!isMountedRef.current) return;
          settle(() => {
            clearPendingPayment(input.purpose, input.tenderId);
            setStatus('failed');
            setErrorKind('card');
            setError(resp.error?.description || 'Your payment did not go through — please try again.');
            resolve({ outcome: 'failed' });
          });
        });
        rzp.open();
      });

      isBusyRef.current = false;
      return result;
    } catch (err) {
      clearPendingPayment(input.purpose, input.tenderId);
      isBusyRef.current = false;
      if (isMountedRef.current) {
        setStatus('failed');
        setErrorKind((prev) => prev ?? 'system');
        setError(err instanceof Error ? err.message : 'Payment failed');
      }
      return { outcome: 'failed' };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setErrorKind(null);
  }, []);

  return { status, error, errorKind, isProcessing, startPayment, reset };
}
