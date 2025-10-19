-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoted_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_style_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_payload_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE captured_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_to_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_capture_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE json2video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_model_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_wizards ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagineer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE infographic_visual_type_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user_name from auth context
CREATE OR REPLACE FUNCTION get_user_name()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT user_name 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_superadmin, FALSE)
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Blog Posts Policies
CREATE POLICY "Users can view their own posts" ON blog_posts
  FOR SELECT USING (
    user_name = get_user_name() OR 
    is_superadmin() OR
    status = 'published'
  );

CREATE POLICY "Users can insert their own posts" ON blog_posts
  FOR INSERT WITH CHECK (user_name = get_user_name());

CREATE POLICY "Users can update their own posts" ON blog_posts
  FOR UPDATE USING (user_name = get_user_name());

CREATE POLICY "Users can delete their own posts" ON blog_posts
  FOR DELETE USING (user_name = get_user_name());

-- Content Variants Policies
CREATE POLICY "Users can manage their own content variants" ON content_variants
  FOR ALL USING (user_name = get_user_name());

-- Custom Content Templates Policies
CREATE POLICY "Users can manage their own templates" ON custom_content_templates
  FOR ALL USING (user_name = get_user_name());

-- Image Library Items Policies
CREATE POLICY "Users can view their own images" ON image_library_items
  FOR SELECT USING (user_name = get_user_name() OR is_superadmin());

CREATE POLICY "Users can insert their own images" ON image_library_items
  FOR INSERT WITH CHECK (user_name = get_user_name());

CREATE POLICY "Users can update their own images" ON image_library_items
  FOR UPDATE USING (user_name = get_user_name());

CREATE POLICY "Users can delete their own images" ON image_library_items
  FOR DELETE USING (user_name = get_user_name());

-- YouTube Videos Policies
CREATE POLICY "Users can manage their own YouTube videos" ON youtube_videos
  FOR ALL USING (user_name = get_user_name());

-- TikTok Videos Policies
CREATE POLICY "Users can manage their own TikTok videos" ON tiktok_videos
  FOR ALL USING (user_name = get_user_name());

-- Generated Videos Policies
CREATE POLICY "Users can manage their own generated videos" ON generated_videos
  FOR ALL USING (user_name = get_user_name());

-- Amazon Product Videos Policies
CREATE POLICY "Users can manage their own Amazon videos" ON amazon_product_videos
  FOR ALL USING (user_name = get_user_name());

-- Promoted Products Policies
CREATE POLICY "Users can manage their own promoted products" ON promoted_products
  FOR ALL USING (user_name = get_user_name());

-- App Products Policies (admin/superadmin only)
CREATE POLICY "Superadmins can manage app products" ON app_products
  FOR ALL USING (is_superadmin());

-- Product Style Templates Policies
CREATE POLICY "Users can manage their own product templates" ON product_style_templates
  FOR ALL USING (user_name = get_user_name());

-- Integration Credentials Policies
CREATE POLICY "Users can manage their own credentials" ON integration_credentials
  FOR ALL USING (user_name = get_user_name());

-- CRM Credentials Policies
CREATE POLICY "Users can manage their own CRM credentials" ON crm_credentials
  FOR ALL USING (user_name = get_user_name());

-- Webhook Received Policies
CREATE POLICY "Users can view their own webhooks" ON webhook_received
  FOR SELECT USING (user_name = get_user_name() OR is_superadmin());

CREATE POLICY "Users can update their own webhooks" ON webhook_received
  FOR UPDATE USING (user_name = get_user_name());

CREATE POLICY "Service role can insert webhooks" ON webhook_received
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Webhook Payload Templates Policies
CREATE POLICY "Users can manage their own webhook templates" ON webhook_payload_templates
  FOR ALL USING (user_name = get_user_name());

-- Scheduled Posts Policies
CREATE POLICY "Users can manage their own scheduled posts" ON scheduled_posts
  FOR ALL USING (user_name = get_user_name());

-- Editor Workflows Policies
CREATE POLICY "Users can manage their own workflows" ON editor_workflows
  FOR ALL USING (user_name = get_user_name());

-- Workflow Run Status Policies
CREATE POLICY "Users can view their own workflow runs" ON workflow_run_status
  FOR SELECT USING (user_name = get_user_name());

CREATE POLICY "Service role can manage workflow runs" ON workflow_run_status
  FOR ALL USING (auth.role() = 'service_role');

-- Usernames Policies
CREATE POLICY "Anyone can view available usernames" ON usernames
  FOR SELECT USING (is_available = TRUE);

CREATE POLICY "Users can view their assigned usernames" ON usernames
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Service role can manage usernames" ON usernames
  FOR ALL USING (auth.role() = 'service_role');

-- Testimonials Policies
CREATE POLICY "Users can manage their own testimonials" ON testimonials
  FOR ALL USING (user_name = get_user_name());

-- Contact Messages Policies
CREATE POLICY "Users can view their own contact messages" ON contact_messages
  FOR SELECT USING (user_name = get_user_name());

CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (TRUE);

-- Waitlist Entries Policies (public read/write for signup)
CREATE POLICY "Anyone can view waitlist entries" ON waitlist_entries
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can insert waitlist entries" ON waitlist_entries
  FOR INSERT WITH CHECK (TRUE);

-- Captured Emails Policies
CREATE POLICY "Users can view their own captured emails" ON captured_emails
  FOR SELECT USING (user_name = get_user_name());

CREATE POLICY "Service role can insert captured emails" ON captured_emails
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Call to Actions Policies
CREATE POLICY "Users can manage their own CTAs" ON call_to_actions
  FOR ALL USING (user_name = get_user_name());

-- Email Capture Forms Policies
CREATE POLICY "Users can manage their own email forms" ON email_capture_forms
  FOR ALL USING (user_name = get_user_name());

-- Landing Page Content Policies
CREATE POLICY "Users can view their own landing pages" ON landing_page_content
  FOR SELECT USING (user_name = get_user_name() OR is_published = TRUE);

CREATE POLICY "Users can manage their own landing pages" ON landing_page_content
  FOR INSERT WITH CHECK (user_name = get_user_name());

CREATE POLICY "Users can update their own landing pages" ON landing_page_content
  FOR UPDATE USING (user_name = get_user_name());

CREATE POLICY "Users can delete their own landing pages" ON landing_page_content
  FOR DELETE USING (user_name = get_user_name());

-- Sales Page Content Policies
CREATE POLICY "Users can view their own sales pages" ON sales_page_content
  FOR SELECT USING (user_name = get_user_name() OR is_published = TRUE);

CREATE POLICY "Users can manage their own sales pages" ON sales_page_content
  FOR ALL USING (user_name = get_user_name());

-- Web Pages Policies
CREATE POLICY "Users can manage their own web pages" ON web_pages
  FOR ALL USING (user_name = get_user_name());

-- Invoices Policies
CREATE POLICY "Users can manage their own invoices" ON invoices
  FOR ALL USING (user_name = get_user_name());

-- Service Items Policies
CREATE POLICY "Users can manage their own service items" ON service_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = service_items.invoice_id 
      AND invoices.user_name = get_user_name()
    )
  );

-- Video Projects Policies
CREATE POLICY "Users can manage their own video projects" ON video_projects
  FOR ALL USING (user_name = get_user_name());

-- Video Scenes Policies
CREATE POLICY "Users can manage their own video scenes" ON video_scenes
  FOR ALL USING (user_name = get_user_name());

-- JSON2Video Templates Policies
CREATE POLICY "Users can manage their own JSON2Video templates" ON json2video_templates
  FOR ALL USING (user_name = get_user_name());

-- Brand Guidelines Policies
CREATE POLICY "Users can manage their own brand guidelines" ON brand_guidelines
  FOR ALL USING (user_name = get_user_name());

-- Brand Specifications Policies
CREATE POLICY "Users can manage their own brand specifications" ON brand_specifications
  FOR ALL USING (user_name = get_user_name());

-- Feature Flags Policies (superadmin only)
CREATE POLICY "Superadmins can manage feature flags" ON feature_flags
  FOR ALL USING (is_superadmin());

CREATE POLICY "Anyone can view feature flags" ON feature_flags
  FOR SELECT USING (TRUE);

-- LLM Model Labels Policies (superadmin only)
CREATE POLICY "Superadmins can manage LLM model labels" ON llm_model_labels
  FOR ALL USING (is_superadmin());

CREATE POLICY "Anyone can view LLM model labels" ON llm_model_labels
  FOR SELECT USING (is_active = TRUE);

-- LLM Settings Policies
CREATE POLICY "Users can manage their own LLM settings" ON llm_settings
  FOR ALL USING (user_name = get_user_name());

-- Dashboard Banners Policies
CREATE POLICY "Users can manage their own dashboard banners" ON dashboard_banners
  FOR ALL USING (user_name = get_user_name());

-- Tutorial Videos Policies
CREATE POLICY "Users can manage their own tutorial videos" ON tutorial_videos
  FOR ALL USING (user_name = get_user_name());

-- Pricing FAQs Policies (public read)
CREATE POLICY "Anyone can view pricing FAQs" ON pricing_faqs
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Superadmins can manage pricing FAQs" ON pricing_faqs
  FOR ALL USING (is_superadmin());

-- Onboarding Wizards Policies
CREATE POLICY "Users can manage their own onboarding wizards" ON onboarding_wizards
  FOR ALL USING (user_name = get_user_name());

-- Onboarding Steps Policies
CREATE POLICY "Users can manage their own onboarding steps" ON onboarding_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM onboarding_wizards 
      WHERE onboarding_wizards.id = onboarding_steps.wizard_id 
      AND onboarding_wizards.user_name = get_user_name()
    )
  );

-- Affiliates Policies (superadmin only)
CREATE POLICY "Superadmins can manage affiliates" ON affiliates
  FOR ALL USING (is_superadmin());

CREATE POLICY "Affiliates can view their own data" ON affiliates
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Affiliate Packs Policies (superadmin only)
CREATE POLICY "Superadmins can manage affiliate packs" ON affiliate_packs
  FOR ALL USING (is_superadmin());

-- Shopify Publish Logs Policies
CREATE POLICY "Users can view their own Shopify logs" ON shopify_publish_logs
  FOR SELECT USING (user_name = get_user_name());

CREATE POLICY "Service role can insert Shopify logs" ON shopify_publish_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- WordPress Publish Logs Policies
CREATE POLICY "Users can view their own WordPress logs" ON wordpress_publish_logs
  FOR SELECT USING (user_name = get_user_name());

CREATE POLICY "Service role can insert WordPress logs" ON wordpress_publish_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Available Pages Policies
CREATE POLICY "Users can manage their own available pages" ON available_pages
  FOR ALL USING (user_name = get_user_name());

-- Page Options Policies
CREATE POLICY "Users can manage their own page options" ON page_options
  FOR ALL USING (user_name = get_user_name());

-- Page Styles Policies
CREATE POLICY "Users can manage their own page styles" ON page_styles
  FOR ALL USING (user_name = get_user_name());

-- Writing Styles Policies
CREATE POLICY "Users can manage their own writing styles" ON writing_styles
  FOR ALL USING (user_name = get_user_name());

-- Content Endpoints Policies
CREATE POLICY "Users can manage their own content endpoints" ON content_endpoints
  FOR ALL USING (user_name = get_user_name());

-- Sitemaps Policies
CREATE POLICY "Users can manage their own sitemaps" ON sitemaps
  FOR ALL USING (user_name = get_user_name());

-- Blog Categories Policies
CREATE POLICY "Users can manage their own blog categories" ON blog_categories
  FOR ALL USING (user_name = get_user_name());

-- Imagineer Jobs Policies
CREATE POLICY "Users can view their own imagineer jobs" ON imagineer_jobs
  FOR SELECT USING (user_name = get_user_name());

CREATE POLICY "Service role can manage imagineer jobs" ON imagineer_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Infographic Visual Type Examples Policies
CREATE POLICY "Users can manage their own infographic examples" ON infographic_visual_type_examples
  FOR ALL USING (user_name = get_user_name());

-- App Settings Policies (superadmin only)
CREATE POLICY "Superadmins can manage app settings" ON app_settings
  FOR ALL USING (is_superadmin());

CREATE POLICY "Anyone can view app settings" ON app_settings
  FOR SELECT USING (TRUE);
