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
import AuctionPage from './pages/AuctionPage';
import AdminVettingDashboardPage from './pages/AdminVettingDashboardPage';
import GeneratorBidSubmissionPage from './pages/GeneratorBidSubmissionPage';
import BuyerTenderConsolePage from './pages/BuyerTenderConsolePage';
import AdminConsolePage from './pages/AdminConsolePage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RfsDocumentPurchasePage from './pages/RfsDocumentPurchasePage';
import PublicTendersPage from './pages/PublicTendersPage';
import TenderDetailsPage from './pages/TenderDetailsPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import PricingPage from './pages/PricingPage';
import RootProviders from './components/RootProviders';
import DashboardShell from './components/DashboardShell';
import { blogPosts } from './data/blogPosts';

export const routes: RouteRecord[] = [
  {
    Component: RootProviders,
    children: [
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
      { path: '/auction', Component: AuctionPage },
      { path: '/login', Component: LoginPage },
      { path: '/reset-password', Component: ResetPasswordPage },
      // Three role-scoped branches under the shared shell — one login, redirected to whichever of
      // these actually matches the account's type; the wrong-role case redirects sideways instead
      // of erroring (see DashboardShell).
      {
        Component: () => <DashboardShell allow={['buyer']} />,
        children: [{ path: '/buyer-console', Component: BuyerTenderConsolePage }],
      },
      {
        Component: () => <DashboardShell allow={['admin']} />,
        children: [
          { path: '/admin-console', Component: AdminConsolePage },
          { path: '/admin-vetting', Component: AdminVettingDashboardPage },
        ],
      },
      {
        Component: () => <DashboardShell allow={['generator']} />,
        children: [{ path: '/submit-bid', Component: GeneratorBidSubmissionPage }],
      },
      { path: '/rfs-document-purchase', Component: RfsDocumentPurchasePage },
      { path: '/tenders', Component: PublicTendersPage },
      { path: '/tender-details', Component: TenderDetailsPage },
      { path: '/complete-profile', Component: CompleteProfilePage },
      { path: '/privacy', Component: PrivacyPolicyPage },
      { path: '/terms', Component: TermsOfServicePage },
      { path: '/refund-policy', Component: RefundPolicyPage },
      { path: '/pricing', Component: PricingPage },
      {
        path: '/blog/:slug',
        Component: BlogPostPage,
        getStaticPaths: () => blogPosts.map((post) => `/blog/${post.slug}`),
      },
    ],
  },
];
