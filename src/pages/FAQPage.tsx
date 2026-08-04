import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { faqItems } from '../data/content';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="content-page">
      <Seo
        title="FAQ"
        description="Answers to the questions we hear most from C&I buyers, generators, and anyone trying to understand how Wattmatch works."
        path="/faq"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">FAQ</span>
            <h1>Questions we hear the most</h1>
            <p>
              From C&amp;I buyers, generators, and everyone trying to understand how the marketplace
              actually works.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <Reveal className="faq-list">
              {faqItems.map((item, i) => (
                <div className={`faq-item${openIndex === i ? ' open' : ''}`} key={item.q}>
                  <button
                    className="faq-q"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    aria-expanded={openIndex === i}
                  >
                    {item.q}
                    <span className="faq-icon" aria-hidden="true">+</span>
                  </button>
                  <div className="faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="contact">
          <div className="wrap">
            <h2>Still have a question?</h2>
            <p>We're happy to talk through your specific situation.</p>
            <Link to="/contact" className="btn btn-solar">Contact us <span className="btn-arrow">→</span></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
