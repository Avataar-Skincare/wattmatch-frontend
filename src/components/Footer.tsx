import { Link } from 'react-router-dom';
import LogoMark from './icons/LogoMark';
import { resourceLinks, legalLinks } from '../data/content';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="logo" style={{ color: 'var(--white)' }}>
            <LogoMark src="https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/watt-logo-2.webp" />
          </div>
        </div>
        <div className="foot-links">
          {resourceLinks.map((link) => (
            <Link key={link.href} to={link.href}>{link.label}</Link>
          ))}
          {legalLinks.map((link) => (
            <Link key={link.href} to={link.href}>{link.label}</Link>
          ))}
        </div>
        <div className="foot-bottom">
          <span>© 2026 Wattmatch Energy Private Limited. All rights reserved.</span>
          <span>Built for India's C&amp;I solar transition.</span>
        </div>
      </div>
    </footer>
  );
}
