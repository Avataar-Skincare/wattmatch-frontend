import type { RouteRecord } from 'vite-react-ssg';
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
import BlogIndexPage from './pages/BlogIndexPage';
import BlogPostPage from './pages/BlogPostPage';
import AuctionLivePage from './pages/AuctionLivePage';
import { blogPosts } from './data/blogPosts';

export const routes: RouteRecord[] = [
  { path: '/', Component: HomePage },
  { path: '/renewablesGenerator', Component: GeneratorRegisterPage },
  { path: '/ciBuyer', Component: ConsumerRegisterPage },
  { path: '/about', Component: AboutPage },
  { path: '/how-it-works', Component: HowItWorksPage },
  { path: '/for-ci', Component: ForCIPage },
  { path: '/for-generators', Component: ForGeneratorsPage },
  { path: '/faq', Component: FAQPage },
  { path: '/contact', Component: ContactPage },
  { path: '/privacy-terms', Component: PrivacyTermsPage },
  { path: '/things-to-know', Component: ThingsToKnowPage },
  { path: '/regulatory-guide', Component: RegulatoryGuidePage },
  { path: '/glossary', Component: GlossaryPage },
  { path: '/savings-calculator', Component: SavingsCalculatorPage },
  { path: '/blog', Component: BlogIndexPage },
  { path: '/auction-live', Component: AuctionLivePage },
  {
    path: '/blog/:slug',
    Component: BlogPostPage,
    getStaticPaths: () => blogPosts.map((post) => `/blog/${post.slug}`),
  },
];
