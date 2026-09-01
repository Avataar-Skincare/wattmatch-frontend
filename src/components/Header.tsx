import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './icons/LogoMark';
import { navLinks } from '../data/content';
import { useAuth, HOME_BY_TYPE, LABEL_BY_TYPE } from '../lib/authContext';

const tenderLinks = [
  { href: '/tenders?view=live', label: 'Live' },
  { href: '/tenders?view=archived', label: 'Archive' },
  { href: '/tenders?view=completed', label: 'Tender Results' },
];

export default function Header({ minimal = false }: { minimal?: boolean }) {
  const [open, setOpen] = useState(false);
  const [tendersOpen, setTendersOpen] = useState(false);
  const { auth, hydrated, logout } = useAuth();
  // Before the client-only localStorage read resolves (see authContext.tsx), fall back to the
  // logged-out CTAs — that's what SSG's server-rendered pass shows too, so there's no mismatch.
  const loggedIn = hydrated && auth;

  const closeMenu = () => setOpen(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const tendersRef = useRef<HTMLDivElement>(null);

  // Every page mounts its own Header, so this fires on each navigation —
  // without it the new page keeps the previous page's scroll offset
  // (e.g. landing just above the footer if the link that was clicked sat low on the page).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Escape closes the mobile menu and returns focus to the button that opened it — otherwise a
  // keyboard user has to tab through the entire underlying page to escape it.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // The Tenders dropdown already opens on hover/focus-within via CSS (untouched below); this adds
  // click/keyboard operability on top of that — the trigger used to be a plain <span>, which a
  // keyboard user cannot activate or reliably reach at all (visibility:hidden on the closed panel
  // removes its links from the tab order until something else already reveals it).
  useEffect(() => {
    if (!tendersOpen) return;
    function handleClick(e: MouseEvent) {
      if (tendersRef.current && !tendersRef.current.contains(e.target as Node)) setTendersOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTendersOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [tendersOpen]);

  if (minimal) {
    return (
      <header>
        <nav>
          <Link to="/" className="logo">
            <LogoMark src="https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/watt-logo-1.webp" />
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header>
      <nav>
        <Link to="/" className="logo">
          <LogoMark src="https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/watt-logo-1.webp" />
        </Link>
        <div className="nav-links">
          {navLinks.slice(0, 2).map((link) => (
            <Link key={link.href} to={link.href}>{link.label}</Link>
          ))}
          <div className={`nav-dropdown${tendersOpen ? ' open' : ''}`} ref={tendersRef}>
            <button
              type="button"
              className="nav-dropdown-trigger"
              aria-haspopup="true"
              aria-expanded={tendersOpen}
              onClick={() => setTendersOpen((o) => !o)}
            >
              Tenders
            </button>
            <div className="nav-dropdown-panel">
              {tenderLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setTendersOpen(false)}>{link.label}</Link>
              ))}
            </div>
          </div>
          {navLinks.slice(2).map((link) => (
            <Link key={link.href} to={link.href}>{link.label}</Link>
          ))}
        </div>
        <div className="nav-cta">
          {loggedIn ? (
            <>
              <span>{LABEL_BY_TYPE[auth.type]} account</span>
              <Link to={HOME_BY_TYPE[auth.type]} className="btn btn-ghost">Dashboard</Link>
              <button type="button" className="btn btn-ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/for-ci" className="btn btn-ghost">I buy power</Link>
              <Link to="/for-generators" className="btn btn-solar">I generate power</Link>
            </>
          )}
        </div>
        <button
          ref={burgerRef}
          className="burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span></span>
        </button>
      </nav>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {navLinks.slice(0, 2).map((link) => (
          <Link key={link.href} to={link.href} onClick={closeMenu}>{link.label}</Link>
        ))}
        <span className="mobile-menu-group-label">Tenders</span>
        {tenderLinks.map((link) => (
          <Link key={link.href} to={link.href} className="mobile-menu-sublink" onClick={closeMenu}>{link.label}</Link>
        ))}
        {navLinks.slice(2).map((link) => (
          <Link key={link.href} to={link.href} onClick={closeMenu}>{link.label}</Link>
        ))}
        {loggedIn ? (
          <>
            <Link to={HOME_BY_TYPE[auth.type]} className="btn btn-ghost" onClick={closeMenu}>Dashboard</Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { logout(); closeMenu(); }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost" onClick={closeMenu}>Log in</Link>
            <Link to="/for-ci" className="btn btn-ghost" onClick={closeMenu}>I buy power</Link>
            <Link to="/for-generators" className="btn btn-solar" onClick={closeMenu}>I generate power</Link>
          </>
        )}
      </div>
    </header>
  );
}
