import app from './appClient';


export const BlogPost = app.entities.BlogPost;

export const WebhookReceived = app.entities.WebhookReceived;

export const AvailablePage = app.entities.AvailablePage;

export const YouTubeVideo = app.entities.YouTubeVideo;

export const PromotedProduct = app.entities.PromotedProduct;

export const ImageLibraryItem = app.entities.ImageLibraryItem;

export const Sitemap = app.entities.Sitemap;

export const CallToAction = app.entities.CallToAction;

export const EmailCaptureForm = app.entities.EmailCaptureForm;

export const CapturedEmail = app.entities.CapturedEmail;

export const TikTokVideo = app.entities.TikTokVideo;

export const GeneratedVideo = app.entities.GeneratedVideo;

export const LandingPageContent = app.entities.LandingPageContent;

export const WaitlistEntry = app.entities.WaitlistEntry;

export const ContactMessage = app.entities.ContactMessage;

export const Username = app.entities.Username;

export const ScheduledPost = app.entities.ScheduledPost;

export const Testimonial = app.entities.Testimonial;

export const ContentVariant = app.entities.ContentVariant;

export const IntegrationCredential = app.entities.IntegrationCredential;

export const OnboardingWizard = app.entities.OnboardingWizard;

export const Invoice = app.entities.Invoice;

export const ServiceItem = app.entities.ServiceItem;

export const VideoProject = app.entities.VideoProject;

export const VideoScene = app.entities.VideoScene;

export const Json2VideoTemplate = app.entities.Json2VideoTemplate;

export const BlogCategory = app.entities.BlogCategory;

export const BrandGuidelines = app.entities.BrandGuidelines;

export const FeatureFlag = app.entities.FeatureFlag;

export const EditorWorkflow = app.entities.EditorWorkflow;

export const WorkflowRunStatus = app.entities.WorkflowRunStatus;

export const SalesPageContent = app.entities.SalesPageContent;

export const ProductStyleTemplate = app.entities.ProductStyleTemplate;

export const AppProduct = app.entities.AppProduct;

export const ShopifyPublishLog = app.entities.ShopifyPublishLog;

export const PageOption = app.entities.PageOption;

export const PageStyle = app.entities.PageStyle;

export const WritingStyle = app.entities.WritingStyle;

export const ContentEndpoint = app.entities.ContentEndpoint;

export const WebPage = app.entities.WebPage;

export const LlmModelLabel = app.entities.LlmModelLabel;

export const LlmSettings = app.entities.LlmSettings;

export const CrmCredential = app.entities.CrmCredential;

export const WebhookPayloadTemplate = app.entities.WebhookPayloadTemplate;

export const CustomContentTemplate = app.entities.CustomContentTemplate;

export const TutorialVideo = app.entities.TutorialVideo;

export const PricingFaq = app.entities.PricingFaq;

export const OnboardingStep = app.entities.OnboardingStep;

export const Affiliate = app.entities.Affiliate;

export const AffiliatePack = app.entities.AffiliatePack;

export const AppSettings = app.entities.AppSettings;

export const AmazonProductVideo = app.entities.AmazonProductVideo;

export const DashboardBanner = app.entities.DashboardBanner;

export const WordPressPublishLog = app.entities.WordPressPublishLog;

export const ImagineerJob = app.entities.ImagineerJob;

export const InfographicVisualTypeExample = app.entities.InfographicVisualTypeExample;

export const BrandSpecifications = app.entities.BrandSpecifications;



// User entity (combines auth methods + entity CRUD for user_profiles)
export const User = {
  ...app.auth,  // Auth methods (me, updateMe, logout, etc.)
  ...app.entities.UserProfile,  // Entity CRUD methods (list, filter, findById, create, update, delete)
};