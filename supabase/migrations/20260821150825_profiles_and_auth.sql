-- Migration: Add profiles table and Supabase Auth integration
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  first_name VARCHAR(100) NOT NULL DEFAULT '',
  last_name VARCHAR(100) NOT NULL DEFAULT '',
  middle_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  avatar_url VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_write" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_all_authenticated" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin'::text, 'admin'::text]) OR auth.uid() IS NULL);

CREATE POLICY "profiles_admin_write" ON public.profiles
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin'::text, 'admin'::text]));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing users into auth.users where they don't already exist
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin
)
SELECT
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, u.password_hash,
  u.email_verified_at, '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('first_name', u.first_name, 'last_name', u.last_name,
    'middle_name', u.middle_name, 'date_of_birth', u.date_of_birth,
    'gender', u.gender, 'avatar_url', u.avatar_url),
  u.created_at, u.updated_at, false
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id)
LIMIT 100;

-- Mirror users into profiles table
INSERT INTO public.profiles (id, email, first_name, last_name, middle_name, date_of_birth, gender, avatar_url, is_active)
SELECT id, email, first_name, last_name, middle_name, date_of_birth, gender, avatar_url, is_active
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
LIMIT 100;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.profiles TO service_role;
