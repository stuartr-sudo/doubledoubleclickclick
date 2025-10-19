-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_name, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to auto-assign username
CREATE OR REPLACE FUNCTION public.auto_assign_username(
  preferred_user_name TEXT,
  display_name TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  base_name TEXT;
  candidate_name TEXT;
  final_name TEXT;
  counter INTEGER := 1;
BEGIN
  -- Clean the preferred username
  base_name := lower(trim(preferred_user_name));
  base_name := regexp_replace(base_name, '[^a-z0-9-_]', '-', 'g');
  base_name := regexp_replace(base_name, '^-+|-$', '', 'g');
  base_name := substring(base_name from 1 for 24);
  
  IF base_name = '' THEN
    base_name := 'user';
  END IF;
  
  candidate_name := base_name;
  
  -- Try to find an available username
  LOOP
    -- Check if username is available
    IF NOT EXISTS (
      SELECT 1 FROM public.usernames 
      WHERE username = candidate_name AND is_available = FALSE
    ) THEN
      -- Check if it exists in usernames table
      IF EXISTS (SELECT 1 FROM public.usernames WHERE username = candidate_name) THEN
        -- Update existing record
        UPDATE public.usernames 
        SET is_available = FALSE, assigned_to = auth.uid(), updated_date = NOW()
        WHERE username = candidate_name;
      ELSE
        -- Create new record
        INSERT INTO public.usernames (username, display_name, is_available, assigned_to)
        VALUES (candidate_name, COALESCE(display_name, candidate_name), FALSE, auth.uid());
      END IF;
      
      -- Update user profile
      UPDATE public.user_profiles
      SET user_name = candidate_name,
          assigned_usernames = array_append(
            COALESCE(assigned_usernames, ARRAY[]::TEXT[]), 
            candidate_name
          )
      WHERE id = auth.uid();
      
      final_name := candidate_name;
      EXIT;
    ELSE
      -- Try next variation
      counter := counter + 1;
      candidate_name := base_name || '-' || counter;
      
      -- Prevent infinite loop
      IF counter > 1000 THEN
        RAISE EXCEPTION 'Unable to find available username';
      END IF;
    END IF;
  END LOOP;
  
  RETURN final_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and consume tokens
CREATE OR REPLACE FUNCTION public.check_and_consume_tokens(
  feature_name TEXT,
  token_cost INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- Get current token balance
  SELECT token_balance INTO current_balance
  FROM public.user_profiles
  WHERE id = user_id;
  
  -- Check if user has enough tokens
  IF current_balance < token_cost THEN
    RETURN FALSE;
  END IF;
  
  -- Consume tokens
  UPDATE public.user_profiles
  SET token_balance = token_balance - token_cost,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add tokens (for payments, etc.)
CREATE OR REPLACE FUNCTION public.add_tokens(
  user_id UUID,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET token_balance = token_balance + amount,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user profile with extended data
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  profile JSON;
BEGIN
  SELECT json_build_object(
    'id', up.id,
    'email', au.email,
    'user_name', up.user_name,
    'full_name', up.full_name,
    'assigned_usernames', up.assigned_usernames,
    'token_balance', up.token_balance,
    'plan_price_id', up.plan_price_id,
    'is_superadmin', up.is_superadmin,
    'role', up.role,
    'completed_tutorial_ids', up.completed_tutorial_ids,
    'topics_completed_at', up.topics_completed_at,
    'created_at', up.created_at,
    'updated_at', up.updated_at
  )
  INTO profile
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.id
  WHERE up.id = user_id;
  
  RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default app products
INSERT INTO public.app_products (name, description, price, plan_key, features, is_active)
VALUES 
  ('Free Trial', 'Basic features to get started', 0.00, 'free_trial', ARRAY['5 images', 'Basic editor', '1 workspace'], TRUE),
  ('Growth', 'Perfect for growing businesses', 29.00, 'growth', ARRAY['100 images', 'Advanced editor', '5 workspaces', 'AI features'], TRUE),
  ('Brand', 'For established brands', 99.00, 'brand', ARRAY['1000 images', 'Premium editor', 'Unlimited workspaces', 'All AI features', 'Priority support'], TRUE),
  ('Agency', 'For agencies and teams', 299.00, 'agency', ARRAY['Unlimited images', 'Agency features', 'Team management', 'White-label options', 'Dedicated support'], TRUE);

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, description)
VALUES 
  ('ai_image_generation', TRUE, 'Enable AI image generation features'),
  ('ai_video_generation', TRUE, 'Enable AI video generation features'),
  ('airtable_integration', TRUE, 'Enable Airtable integration'),
  ('webhook_system', TRUE, 'Enable webhook processing system'),
  ('affiliate_system', TRUE, 'Enable affiliate program'),
  ('brand_guidelines', TRUE, 'Enable brand guidelines features');

-- Insert default LLM model labels
INSERT INTO public.llm_model_labels (model_name, label, is_active)
VALUES 
  ('gpt-4', 'GPT-4', TRUE),
  ('gpt-4-turbo', 'GPT-4 Turbo', TRUE),
  ('gpt-3.5-turbo', 'GPT-3.5 Turbo', TRUE),
  ('claude-3-opus', 'Claude 3 Opus', TRUE),
  ('claude-3-sonnet', 'Claude 3 Sonnet', TRUE),
  ('claude-3-haiku', 'Claude 3 Haiku', TRUE);

-- Insert default app settings
INSERT INTO public.app_settings (setting_name, setting_value, description)
VALUES 
  ('default_token_balance', '20', 'Default token balance for new users'),
  ('max_file_size_mb', '10', 'Maximum file size in MB'),
  ('supported_image_types', '["image/jpeg", "image/png", "image/gif", "image/webp"]', 'Supported image file types'),
  ('supported_video_types', '["video/mp4", "video/webm", "video/quicktime"]', 'Supported video file types'),
  ('rate_limit_per_minute', '60', 'Rate limit per minute for API calls'),
  ('webhook_timeout_seconds', '30', 'Webhook processing timeout in seconds');
