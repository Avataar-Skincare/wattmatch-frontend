import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { glossaryTerms } from '../data/content';

export default function GlossaryPage() {
  return (
    <div className="content-page">
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Resources</span>
            <h1>Common industry terms, explained</h1>
            <p>
              The vocabulary you'll run into while evaluating a switch to renewable power — in plain
              language.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <Reveal className="glossary-grid">
              {glossaryTerms.map((t) => (
                <div className="glossary-item" key={t.term}>
                  <div className="glossary-term">
                    <strong>{t.term}</strong>
                    {t.abbr && <span className="abbr">{t.abbr}</span>}
                  </div>
                  <p>{t.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
