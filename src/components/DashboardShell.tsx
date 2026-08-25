import { Outlet, Navigate, Link } from 'react-router-dom';
import Footer from './Footer';
import { useAuth, type OrgType } from '../lib/authContext';

const HOME_BY_TYPE: Record<OrgType, string> = {
  buyer: '/buyer-console',
  generator: '/submit-bid',
  admin: '/admin-console',
};

const LABEL_BY_TYPE: Record<OrgType, string> = {
  buyer: 'Buyer',
  generator: 'Generator',
  admin: 'Admin',
};

// One shared shell for every logged-in page — replaces each console's own copy-pasted login form
// and its own <Header minimal/>. Also the route guard: redirects to /login if no one's logged in,
// or to the caller's OWN dashboard if they're logged in as the wrong role for this branch (e.g. a
// generator token hitting /admin-console) — never a blank 403, always somewhere useful.
export default function DashboardShell({ allow }: { allow: OrgType[] }) {
  const { auth, hydrated, logout } = useAuth();

  // Wait for the client-only localStorage read (see authContext.tsx) — during SSG's server-rendered
  // pass, and for the first client render before it resolves, we genuinely don't know yet whether
  // someone's logged in. Rendering nothing briefly beats redirecting a logged-in visitor to /login.
  if (!hydrated) return null;
  if (!auth) return <Navigate to="/login" replace />;
  if (!allow.includes(auth.type)) return <Navigate to={HOME_BY_TYPE[auth.type]} replace />;

  return (
    <div className="content-page">
      <header>
        <nav>
          <Link to="/" className="logo">Wattmatch</Link>
          <div className="nav-links">
            <Link to={HOME_BY_TYPE[auth.type]}>Dashboard</Link>
            {auth.type === 'admin' && <Link to="/admin-vetting">Vetting</Link>}
          </div>
          <div className="nav-cta">
            <span>{LABEL_BY_TYPE[auth.type]} account</span>
            <button type="button" className="btn btn-outline" onClick={logout}>
              Log out
            </button>
          </div>
        </nav>
      </header>
      <Outlet />
      <Footer />
    </div>
  );
}
