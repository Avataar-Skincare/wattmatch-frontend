import { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './icons/LogoMark';
import { navLinks } from '../data/content';

export default function Header({ minimal = false }: { minimal?: boolean }) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

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
        <a href="#top" className="logo">
          <LogoMark src="https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/watt-logo-1.webp" />
        </a>
        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </div>
        <div className="nav-cta">
          <a href="#for-ci" className="btn btn-ghost">I buy power</a>
          <a href="#for-generators" className="btn btn-solar">I generate power</a>
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
          <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>
        ))}
        <a href="#for-ci" className="btn btn-ghost" onClick={closeMenu}>I buy power</a>
        <a href="#for-generators" className="btn btn-solar" onClick={closeMenu}>I generate power</a>
      </div>
    </header>
  );
}
