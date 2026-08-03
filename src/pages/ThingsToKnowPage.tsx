import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { thingsToKnow } from '../data/content';

export default function ThingsToKnowPage() {
  return (
    <div className="content-page">
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Resources</span>
            <h1>Things to know before switching to renewable power</h1>
            <p>
              A plain-language primer on the decisions and terminology you'll encounter — whether or
              not you use Wattmatch.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <Reveal className="journey-list">
              {thingsToKnow.map((item, i) => (
                <div className="journey-item" key={item.title}>
                  <span className="journey-num">{i + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </Reveal>
            <Reveal className="legal-notice" style={{ maxWidth: 760, margin: '32px auto 0' }}>
              New to the terminology? Our{' '}
              <Link to="/glossary" style={{ textDecoration: 'underline' }}>Glossary of Terms</Link>{' '}
              defines PPA, wheeling, banking, RCO, CUF and more in plain language.
            </Reveal>
          </div>
        </section>

        <section className="contact">
          <div className="wrap">
            <h2>Don't want to manage this yourself?</h2>
            <p>See how Wattmatch handles the admin burden of a 15-year renewables relationship for you.</p>
            <Link to="/for-ci" className="btn btn-solar">See how Wattmatch helps <span className="btn-arrow">→</span></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
