import LogoMark from './icons/LogoMark';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="logo" style={{ color: 'var(--white)' }}>
            <LogoMark />
            Wattmatch
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
