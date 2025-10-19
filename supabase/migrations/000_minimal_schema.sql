-- Minimal schema for authentication - run this first
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types safely
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Profiles (extends auth.users) - ESSENTIAL for authentication
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT UNIQUE,
  full_name TEXT,
  assigned_usernames TEXT[] DEFAULT '{}',
  token_balance INTEGER DEFAULT 20,
  plan_price_id TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  role user_role DEFAULT 'user',
  completed_tutorial_ids TEXT[] DEFAULT '{}',
  topics_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for user_profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_name, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
