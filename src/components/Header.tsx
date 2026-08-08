import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './icons/LogoMark';
import { navLinks } from '../data/content';

export default function Header({ minimal = false }: { minimal?: boolean }) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  // Every page mounts its own Header, so this fires on each navigation —
  // without it the new page keeps the previous page's scroll offset
  // (e.g. landing just above the footer if the link that was clicked sat low on the page).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>{link.label}</Link>
          ))}
        </div>
        <div className="nav-cta">
          <Link to="/for-ci" className="btn btn-ghost">I buy power</Link>
          <Link to="/for-generators" className="btn btn-solar">I generate power</Link>
        </div>
        <button
          className="burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span></span>
        </button>
      </nav>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {navLinks.map((link) => (
          <Link key={link.href} to={link.href} onClick={closeMenu}>{link.label}</Link>
        ))}
        <Link to="/for-ci" className="btn btn-ghost" onClick={closeMenu}>I buy power</Link>
        <Link to="/for-generators" className="btn btn-solar" onClick={closeMenu}>I generate power</Link>
      </div>
    </header>
  );
}
