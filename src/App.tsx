import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GeneratorRegisterPage from './pages/GeneratorRegisterPage';
import ConsumerRegisterPage from './pages/ConsumerRegisterPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ForCIPage from './pages/ForCIPage';
import ForGeneratorsPage from './pages/ForGeneratorsPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import PrivacyTermsPage from './pages/PrivacyTermsPage';
import ThingsToKnowPage from './pages/ThingsToKnowPage';
import RegulatoryGuidePage from './pages/RegulatoryGuidePage';
import GlossaryPage from './pages/GlossaryPage';
import SavingsCalculatorPage from './pages/SavingsCalculatorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/renewablesGenerator" element={<GeneratorRegisterPage />} />
        <Route path="/ciBuyer" element={<ConsumerRegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/for-ci" element={<ForCIPage />} />
        <Route path="/for-generators" element={<ForGeneratorsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-terms" element={<PrivacyTermsPage />} />
        <Route path="/things-to-know" element={<ThingsToKnowPage />} />
        <Route path="/regulatory-guide" element={<RegulatoryGuidePage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/savings-calculator" element={<SavingsCalculatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
