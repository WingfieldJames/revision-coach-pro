
CREATE TABLE public.user_brain_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_summary TEXT NOT NULL DEFAULT '',
  subjects_detected JSONB DEFAULT '[]'::jsonb,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_brain_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brain profile"
  ON public.user_brain_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own brain profile"
  ON public.user_brain_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
