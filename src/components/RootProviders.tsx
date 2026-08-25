import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../lib/authContext';

// Pathless layout route wrapping every page in the shared auth context — see routes.tsx. Adding
// providers here (rather than in main.tsx) keeps this composable with vite-react-ssg's own routing
// setup instead of fighting it.
export default function RootProviders() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
