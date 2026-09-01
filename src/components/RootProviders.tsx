import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../lib/authContext';

// Chrome/Firefox both let mouse-wheel scroll silently change a focused <input type="number">'s
// value — a page-scroll gesture over a numeric field (capacity, org id, fees, etc.) becomes an
// accidental edit. Fixed once, globally, here rather than adding an onWheel to every one of the ~20
// number inputs scattered across the app (AdminConsolePage, registration forms, bid submission,
// ...): blurring the field on wheel lets the scroll fall through to the page as normal, with no
// value change, and covers every number input including ones added later.
function blurFocusedNumberInputOnWheel() {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === 'number') {
    active.blur();
  }
}

// Pathless layout route wrapping every page in the shared auth context — see routes.tsx. Adding
// providers here (rather than in main.tsx) keeps this composable with vite-react-ssg's own routing
// setup instead of fighting it.
export default function RootProviders() {
  useEffect(() => {
    document.addEventListener('wheel', blurFocusedNumberInputOnWheel, { passive: true });
    return () => document.removeEventListener('wheel', blurFocusedNumberInputOnWheel);
  }, []);

  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
