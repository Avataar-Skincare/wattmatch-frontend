import LogoMark from './icons/LogoMark';
import { navLinks } from '../data/content';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="logo" style={{ color: 'var(--white)' }}>
            <LogoMark />
            Wattmatch
          </div>
          <div className="foot-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Wattmatch. All rights reserved.</span>
          <span>Built for India's C&amp;I solar transition.</span>
        </div>
      </div>
    </footer>
  );
}
