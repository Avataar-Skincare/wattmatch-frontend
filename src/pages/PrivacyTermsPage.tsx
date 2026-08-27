import { Navigate } from 'react-router-dom';

// Superseded by the separate /privacy and /terms pages (Razorpay's KYC review expects them
// reachable independently, not as one combined document). Kept as a redirect so old links and
// bookmarks to /privacy-terms still resolve.
export default function PrivacyTermsPage() {
  return <Navigate to="/privacy" replace />;
}
