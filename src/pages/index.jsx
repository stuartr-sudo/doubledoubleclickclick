import Layout from "./Layout.jsx";

import Editor from "./Editor";

import Webhooks from "./Webhooks";

import Dashboard from "./Dashboard";

import YouTubeManager from "./YouTubeManager";

import ProductManager from "./ProductManager";

import SitemapManager from "./SitemapManager";

import Content from "./Content";

import UserManagement from "./UserManagement";

import CtaManager from "./CtaManager";

import EmailFormManager from "./EmailFormManager";

import VideoLibrary from "./VideoLibrary";

import WaitlistManager from "./WaitlistManager";

import Contact from "./Contact";

import PrivacyPolicy from "./PrivacyPolicy";

import TermsOfService from "./TermsOfService";

import Airtable from "./Airtable";

import Topics from "./Topics";

import LandingPageManager from "./LandingPageManager";

import HTMLStudio from "./HTMLStudio";

import UsernameManager from "./UsernameManager";

import SchedulingDashboard from "./SchedulingDashboard";

import AmazonImport from "./AmazonImport";

import AmazonTestimonials from "./AmazonTestimonials";

import OnboardingWizardBuilder from "./OnboardingWizardBuilder";

import OnboardingWizard from "./OnboardingWizard";

import OnboardingPortal from "./OnboardingPortal";

import SunoStudio from "./SunoStudio";

import InvoiceBuilder from "./InvoiceBuilder";

import ServiceCatalog from "./ServiceCatalog";

import WavespeedStudio from "./WavespeedStudio";

import MidjourneyApiDocs from "./MidjourneyApiDocs";

import VideoProducer from "./VideoProducer";

import VideoProjects from "./VideoProjects";

import VideoStudio from "./VideoStudio";

import BrandGuidelinesManager from "./BrandGuidelinesManager";

import FeatureManagement from "./FeatureManagement";

import EditorWorkflowManager from "./EditorWorkflowManager";

import SalesPage from "./SalesPage";

import SalesPageManager from "./SalesPageManager";

import ProductStyleTemplateManager from "./ProductStyleTemplateManager";

import AppProductManager from "./AppProductManager";

import Pages from "./Pages";

import PagesSetup from "./PagesSetup";

import AdminLLM from "./AdminLLM";

import AdminSEO from "./AdminSEO";

import AdminTestData from "./AdminTestData";

import AdminLLMSettings from "./AdminLLMSettings";

import AccountSettings from "./AccountSettings";

import TiktokAIGenerator from "./TiktokAIGenerator";

import YoutubeAIGenerator from "./YoutubeAIGenerator";

import Pricing from "./Pricing";

import TokenPacketsTopUp from "./TokenPacketsTopUp";

import ContentStructureBuilder from "./ContentStructureBuilder";

import CustomTemplateManager from "./CustomTemplateManager";

import FaqEndpointAdmin from "./FaqEndpointAdmin";

import TestimonialLibrary from "./TestimonialLibrary";

import DoubleClickTutorials from "./DoubleClickTutorials";

import ImageLibrary from "./ImageLibrary";

import PostPayment from "./post-payment";

import PricingFaqManager from "./PricingFaqManager";

import Welcome from "./Welcome";

import OnboardingStepManager from "./OnboardingStepManager";

import AffiliateManager from "./AffiliateManager";

import AffiliateSignup from "./AffiliateSignup";

import AffiliateLogin from "./AffiliateLogin";

import AffiliateDashboard from "./AffiliateDashboard";

import AffiliatePackManager from "./AffiliatePackManager";

import ProductLibrary from "./ProductLibrary";

import Affiliate from "./Affiliate";

import Media from "./Media";

import DashboardBannerManager from "./DashboardBannerManager";

import Educational from "./Educational";

import WordPressPublishLogs from "./WordPressPublishLogs";

import InfographicExamplesAdmin from "./InfographicExamplesAdmin";

import GettingStarted from "./GettingStarted";

import Login from "./Login";

import TokenTest from "./TokenTest";

import UIShowcase from "./UIShowcase";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Editor: Editor,
    
    Webhooks: Webhooks,
    
    Dashboard: Dashboard,
    
    YouTubeManager: YouTubeManager,
    
    ProductManager: ProductManager,
    
    SitemapManager: SitemapManager,
    
    Content: Content,
    
    UserManagement: UserManagement,
    
    CtaManager: CtaManager,
    
    EmailFormManager: EmailFormManager,
    
    VideoLibrary: VideoLibrary,
    
    WaitlistManager: WaitlistManager,
    
    Contact: Contact,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
    Airtable: Airtable,
    
    Topics: Topics,
    
    LandingPageManager: LandingPageManager,
    
    HTMLStudio: HTMLStudio,
    
    UsernameManager: UsernameManager,
    
    SchedulingDashboard: SchedulingDashboard,
    
    AmazonImport: AmazonImport,
    
    AmazonTestimonials: AmazonTestimonials,
    
    OnboardingWizardBuilder: OnboardingWizardBuilder,
    
    OnboardingWizard: OnboardingWizard,
    
    OnboardingPortal: OnboardingPortal,
    
    SunoStudio: SunoStudio,
    
    InvoiceBuilder: InvoiceBuilder,
    
    ServiceCatalog: ServiceCatalog,
    
    WavespeedStudio: WavespeedStudio,
    
    MidjourneyApiDocs: MidjourneyApiDocs,
    
    VideoProducer: VideoProducer,
    
    VideoProjects: VideoProjects,
    
    VideoStudio: VideoStudio,
    
    BrandGuidelinesManager: BrandGuidelinesManager,
    
    FeatureManagement: FeatureManagement,
    
    EditorWorkflowManager: EditorWorkflowManager,
    
    SalesPage: SalesPage,
    
    SalesPageManager: SalesPageManager,
    
    ProductStyleTemplateManager: ProductStyleTemplateManager,
    
    AppProductManager: AppProductManager,
    
    Pages: Pages,
    
    PagesSetup: PagesSetup,
    
    AdminLLM: AdminLLM,
    
    AdminSEO: AdminSEO,

    AdminTestData: AdminTestData,
    
    AdminLLMSettings: AdminLLMSettings,
    
    AccountSettings: AccountSettings,
    
    TiktokAIGenerator: TiktokAIGenerator,
    
    YoutubeAIGenerator: YoutubeAIGenerator,
    
    Pricing: Pricing,
    
    TokenPacketsTopUp: TokenPacketsTopUp,
    
    ContentStructureBuilder: ContentStructureBuilder,
    
    CustomTemplateManager: CustomTemplateManager,
    
    FaqEndpointAdmin: FaqEndpointAdmin,
    
    TestimonialLibrary: TestimonialLibrary,
    
    DoubleClickTutorials: DoubleClickTutorials,
    
    ImageLibrary: ImageLibrary,
    
    PostPayment: PostPayment,
    
    PricingFaqManager: PricingFaqManager,
    
    Welcome: Welcome,
    
    OnboardingStepManager: OnboardingStepManager,
    
    AffiliateManager: AffiliateManager,
    
    AffiliateSignup: AffiliateSignup,
    
    AffiliateLogin: AffiliateLogin,
    
    AffiliateDashboard: AffiliateDashboard,
    
    AffiliatePackManager: AffiliatePackManager,
    
    ProductLibrary: ProductLibrary,
    
    Affiliate: Affiliate,
    
    Media: Media,
    
    DashboardBannerManager: DashboardBannerManager,
    
    Educational: Educational,
    
    WordPressPublishLogs: WordPressPublishLogs,
    
    InfographicExamplesAdmin: InfographicExamplesAdmin,
    
    GettingStarted: GettingStarted,
    
    TokenTest: TokenTest,
    
    UIShowcase: UIShowcase,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Bypass Layout for /login
    if (location.pathname === '/login') {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
            </Routes>
        );
    }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Editor />} />
                
                
                <Route path="/Editor" element={<Editor />} />
                
                <Route path="/Webhooks" element={<Webhooks />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/YouTubeManager" element={<YouTubeManager />} />
                
                <Route path="/ProductManager" element={<ProductManager />} />
                
                <Route path="/SitemapManager" element={<SitemapManager />} />
                
                <Route path="/Content" element={<Content />} />
                
                <Route path="/UserManagement" element={<UserManagement />} />
                
                <Route path="/CtaManager" element={<CtaManager />} />
                
                <Route path="/EmailFormManager" element={<EmailFormManager />} />
                
                <Route path="/VideoLibrary" element={<VideoLibrary />} />
                
                <Route path="/WaitlistManager" element={<WaitlistManager />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/Airtable" element={<Airtable />} />
                
                <Route path="/Topics" element={<Topics />} />
                
                <Route path="/LandingPageManager" element={<LandingPageManager />} />
                
                <Route path="/HTMLStudio" element={<HTMLStudio />} />
                
                <Route path="/UsernameManager" element={<UsernameManager />} />
                
                <Route path="/SchedulingDashboard" element={<SchedulingDashboard />} />
                
                <Route path="/AmazonImport" element={<AmazonImport />} />
                
                <Route path="/AmazonTestimonials" element={<AmazonTestimonials />} />
                
                <Route path="/OnboardingWizardBuilder" element={<OnboardingWizardBuilder />} />
                
                <Route path="/OnboardingWizard" element={<OnboardingWizard />} />
                
                <Route path="/OnboardingPortal" element={<OnboardingPortal />} />
                
                <Route path="/SunoStudio" element={<SunoStudio />} />
                
                <Route path="/InvoiceBuilder" element={<InvoiceBuilder />} />
                
                <Route path="/ServiceCatalog" element={<ServiceCatalog />} />
                
                <Route path="/WavespeedStudio" element={<WavespeedStudio />} />
                
                <Route path="/MidjourneyApiDocs" element={<MidjourneyApiDocs />} />
                
                <Route path="/VideoProducer" element={<VideoProducer />} />
                
                <Route path="/VideoProjects" element={<VideoProjects />} />
                
                <Route path="/VideoStudio" element={<VideoStudio />} />
                
                <Route path="/BrandGuidelinesManager" element={<BrandGuidelinesManager />} />
                
                <Route path="/FeatureManagement" element={<FeatureManagement />} />
                
                <Route path="/EditorWorkflowManager" element={<EditorWorkflowManager />} />
                
                <Route path="/SalesPage" element={<SalesPage />} />
                
                <Route path="/SalesPageManager" element={<SalesPageManager />} />
                
                <Route path="/ProductStyleTemplateManager" element={<ProductStyleTemplateManager />} />
                
                <Route path="/AppProductManager" element={<AppProductManager />} />
                
                <Route path="/Pages" element={<Pages />} />
                
                <Route path="/PagesSetup" element={<PagesSetup />} />
                
                <Route path="/AdminLLM" element={<AdminLLM />} />
                
                <Route path="/AdminSEO" element={<AdminSEO />} />

                <Route path="/AdminTestData" element={<AdminTestData />} />

                <Route path="/AccountSettings" element={<AccountSettings />} />
                
                <Route path="/TiktokAIGenerator" element={<TiktokAIGenerator />} />
                
                <Route path="/YoutubeAIGenerator" element={<YoutubeAIGenerator />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/TokenPacketsTopUp" element={<TokenPacketsTopUp />} />
                
                <Route path="/ContentStructureBuilder" element={<ContentStructureBuilder />} />
                
                <Route path="/CustomTemplateManager" element={<CustomTemplateManager />} />
                
                <Route path="/FaqEndpointAdmin" element={<FaqEndpointAdmin />} />
                
                <Route path="/TestimonialLibrary" element={<TestimonialLibrary />} />
                
                <Route path="/DoubleClickTutorials" element={<DoubleClickTutorials />} />
                
                <Route path="/ImageLibrary" element={<ImageLibrary />} />
                
                <Route path="/post-payment" element={<PostPayment />} />
                
                <Route path="/PricingFaqManager" element={<PricingFaqManager />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/OnboardingStepManager" element={<OnboardingStepManager />} />
                
                <Route path="/AffiliateManager" element={<AffiliateManager />} />
                
                <Route path="/AffiliateSignup" element={<AffiliateSignup />} />
                
                <Route path="/AffiliateLogin" element={<AffiliateLogin />} />
                
                <Route path="/AffiliateDashboard" element={<AffiliateDashboard />} />
                
                <Route path="/AffiliatePackManager" element={<AffiliatePackManager />} />
                
                <Route path="/ProductLibrary" element={<ProductLibrary />} />
                
                <Route path="/Affiliate" element={<Affiliate />} />
                
                <Route path="/Media" element={<Media />} />
                
                <Route path="/DashboardBannerManager" element={<DashboardBannerManager />} />
                
                <Route path="/Educational" element={<Educational />} />
                
                <Route path="/WordPressPublishLogs" element={<WordPressPublishLogs />} />
                
                <Route path="/InfographicExamplesAdmin" element={<InfographicExamplesAdmin />} />
                
                <Route path="/GettingStarted" element={<GettingStarted />} />
                
                
                <Route path="/TokenTest" element={<TokenTest />} />
                
            </Routes>
        </Layout>
    );
}

export default function App() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}