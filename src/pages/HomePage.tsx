import Header from '../components/Header';
import Seo from '../components/Seo';
import Hero from '../components/Hero';
import StatStrip from '../components/StatStrip';
import WhySwitch from '../components/WhySwitch';
import Guarantee from '../components/Guarantee';
import Replace from '../components/Replace';
import HowItWorks from '../components/HowItWorks';
import PersonaCI from '../components/PersonaCI';
import PersonaGenerators from '../components/PersonaGenerators';
import PressSection from '../components/PressSection';
import Team from '../components/Team';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Seo
        title="Matching C&I renewables buyers with the right suppliers"
        description="Wattmatch is a neutral marketplace connecting C&I electricity buyers with vetted RE generators across India."
        path="/"
      />
      <Header />
      <main id="top">
        <Hero />
        <StatStrip />
        <WhySwitch />
        <Guarantee />
        <Replace />
        <PressSection />
        <HowItWorks />
        <PersonaCI />
        <PersonaGenerators />
        <Team />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
