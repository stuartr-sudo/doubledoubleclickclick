-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived', 'scheduled');
CREATE TYPE webhook_status AS ENUM ('received', 'processing', 'completed', 'failed', 'published', 'editing');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE integration_type AS ENUM ('airtable', 'wordpress', 'shopify', 'notion', 'google_drive', 'stripe', 'webhook');

-- User Profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT UNIQUE,
  full_name TEXT,
  assigned_usernames TEXT[] DEFAULT '{}',
  token_balance INTEGER DEFAULT 20,
  plan_price_id TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  role user_role DEFAULT 'user',
  completed_tutorial_ids TEXT[] DEFAULT '{}',
  topics_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core Content Tables
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  status content_status DEFAULT 'draft',
  user_name TEXT NOT NULL,
  processing_id TEXT,
  priority TEXT DEFAULT 'medium',
  flash_status TEXT,
  flashed_at TIMESTAMPTZ,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  variant_content TEXT,
  variant_type TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE custom_content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_content TEXT,
  template_type TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Media Tables
CREATE TABLE image_library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  alt_text TEXT,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  channel_title TEXT,
  duration TEXT,
  view_count INTEGER,
  like_count INTEGER,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tiktok_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  author_name TEXT,
  view_count INTEGER,
  like_count INTEGER,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  prompt TEXT,
  model TEXT,
  status job_status DEFAULT 'pending',
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE amazon_product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_asin TEXT,
  video_url TEXT,
  title TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Product Tables
CREATE TABLE promoted_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_url TEXT,
  button_url TEXT,
  price TEXT,
  sku TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  stripe_price_id TEXT UNIQUE,
  plan_key TEXT,
  features TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_style_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Tables
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_type integration_type NOT NULL,
  credential_data JSONB NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crm_type TEXT NOT NULL,
  credential_data JSONB NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_received (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content TEXT,
  status webhook_status DEFAULT 'received',
  webhook_data JSONB,
  processing_id TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_payload_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduling Tables
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status job_status DEFAULT 'pending',
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE editor_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  workflow_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_run_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES editor_workflows(id) ON DELETE CASCADE,
  status job_status DEFAULT 'pending',
  run_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- User Management Tables
CREATE TABLE usernames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  assigned_to UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  referral_source TEXT,
  status TEXT DEFAULT 'pending',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE captured_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  source TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- CMS Tables
CREATE TABLE call_to_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  button_text TEXT,
  button_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_capture_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  placeholder_text TEXT,
  button_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE landing_page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_title TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  slug TEXT UNIQUE,
  is_published BOOLEAN DEFAULT FALSE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_title TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  slug TEXT UNIQUE,
  is_published BOOLEAN DEFAULT FALSE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE web_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  meta_description TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Invoicing Tables
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'draft',
  due_date DATE,
  stripe_payment_intent_id TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Video Tables
CREATE TABLE video_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE video_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES video_projects(id) ON DELETE CASCADE,
  scene_data JSONB,
  order_index INTEGER,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE json2video_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Tables
CREATE TABLE brand_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  guidelines_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brand_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specifications_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- System Tables
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE llm_model_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE llm_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  settings_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dashboard_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  banner_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tutorial_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  tutorial_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pricing_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Tables
CREATE TABLE onboarding_wizards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  wizard_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wizard_id UUID REFERENCES onboarding_wizards(id) ON DELETE CASCADE,
  step_title TEXT NOT NULL,
  step_data JSONB,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Tables
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  unique_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  pack_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Publishing Tables
CREATE TABLE shopify_publish_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  shopify_id TEXT,
  status TEXT,
  error_message TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wordpress_publish_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  wordpress_id TEXT,
  status TEXT,
  error_message TEXT,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Page Tables
CREATE TABLE available_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_name TEXT NOT NULL,
  page_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES available_pages(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  option_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES available_pages(id) ON DELETE CASCADE,
  style_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE writing_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  style_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_name TEXT NOT NULL,
  endpoint_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sitemaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sitemap_url TEXT NOT NULL,
  sitemap_data JSONB,
  status TEXT DEFAULT 'pending',
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Category Tables
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Job Tables
CREATE TABLE imagineer_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_data JSONB,
  status job_status DEFAULT 'pending',
  result_data JSONB,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Example Tables
CREATE TABLE infographic_visual_type_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visual_type TEXT NOT NULL,
  example_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  user_name TEXT NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Tables
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_user_name ON blog_posts(user_name);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_created_date ON blog_posts(created_date);
CREATE INDEX idx_blog_posts_updated_date ON blog_posts(updated_date);
CREATE INDEX idx_blog_posts_processing_id ON blog_posts(processing_id);

CREATE INDEX idx_image_library_items_user_name ON image_library_items(user_name);
CREATE INDEX idx_image_library_items_source ON image_library_items(source);

CREATE INDEX idx_webhook_received_user_name ON webhook_received(user_name);
CREATE INDEX idx_webhook_received_status ON webhook_received(status);
CREATE INDEX idx_webhook_received_processing_id ON webhook_received(processing_id);

CREATE INDEX idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);

CREATE INDEX idx_usernames_username ON usernames(username);
CREATE INDEX idx_usernames_assigned_to ON usernames(assigned_to);

CREATE INDEX idx_integration_credentials_user_name ON integration_credentials(user_name);
CREATE INDEX idx_integration_credentials_type ON integration_credentials(integration_type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$ language 'plpgsql';
