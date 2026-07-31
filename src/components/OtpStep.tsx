import { useEffect, useState } from 'react';
import CheckIcon from './icons/CheckIcon';
import { sendOtp, verifyOtp, type OtpChannel } from '../lib/otpApi';

type Status = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified';

function OtpChannelVerifier({
  channel,
  identifier,
  onVerified,
}: {
  channel: OtpChannel;
  identifier: string;
  onVerified: () => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function handleSend() {
    setStatus('sending');
    setError('');
    const result = await sendOtp(channel, identifier);
    if (result.ok) {
      setStatus('sent');
    } else {
      setStatus('idle');
      setError(result.error ?? 'Failed to send code.');
    }
  }

  async function handleVerify() {
    setStatus('verifying');
    setError('');
    const result = await verifyOtp(channel, identifier, code);
    if (result.ok) {
      setStatus('verified');
      onVerified();
    } else {
      setStatus('sent');
      setError(result.error ?? 'Invalid code. Please try again.');
    }
  }

  const label = channel === 'email' ? 'Email' : 'Phone';

  return (
    <div className="field otp-channel">
      <label>{label}: {identifier}</label>
      {status === 'verified' ? (
        <p className="otp-verified">
          <span className="check"><CheckIcon size={14} /></span> Verified
        </p>
      ) : status === 'idle' || status === 'sending' ? (
        <button type="button" className="btn btn-ghost" disabled={status === 'sending' || !identifier} onClick={handleSend}>
          {status === 'sending' ? 'Sending code…' : `Send code to ${label.toLowerCase()}`}
        </button>
      ) : (
        <div className="otp-verify-row">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <button type="button" className="btn btn-ghost" disabled={status === 'verifying' || code.length !== 4} onClick={handleVerify}>
            {status === 'verifying' ? 'Verifying…' : 'Verify'}
          </button>
          <button type="button" className="otp-resend" disabled={status === 'verifying'} onClick={handleSend}>
            Resend
          </button>
        </div>
      )}
      {channel === 'email' && (status === 'sent' || status === 'verifying') && (
        <p className="otp-hint">Don't see it? Check your spam/junk folder.</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function OtpStep({
  email,
  phone,
  onBothVerified,
}: {
  email: string;
  phone: string;
  onBothVerified: () => void;
}) {
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    if (emailVerified && phoneVerified) onBothVerified();
  }, [emailVerified, phoneVerified, onBothVerified]);

  return (
    <div className="otp-step">
      <h3>Verify your contact details</h3>
      <p className="sub">We'll send a 4-digit code to confirm both your email and phone.</p>
      <OtpChannelVerifier channel="email" identifier={email} onVerified={() => setEmailVerified(true)} />
      <OtpChannelVerifier channel="phone" identifier={phone} onVerified={() => setPhoneVerified(true)} />
    </div>
  );
}
