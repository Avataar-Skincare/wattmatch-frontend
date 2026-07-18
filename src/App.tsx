import Header from './components/Header';
import Hero from './components/Hero';
import StatStrip from './components/StatStrip';
import WhySwitch from './components/WhySwitch';
import Guarantee from './components/Guarantee';
import Replace from './components/Replace';
import HowItWorks from './components/HowItWorks';
import PersonaCI from './components/PersonaCI';
import PersonaGenerators from './components/PersonaGenerators';
import Team from './components/Team';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <StatStrip />
        <WhySwitch />
        <Guarantee />
        <Replace />
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

export default App;
