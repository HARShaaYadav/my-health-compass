
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  extracted_text TEXT,
  medicines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions FOR DELETE USING (auth.uid() = user_id);

-- Medical reports table
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT,
  report_type TEXT,
  results JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.medical_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.medical_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.medical_reports FOR DELETE USING (auth.uid() = user_id);

-- Medicine reminders table
CREATE TABLE public.medicine_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  times TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminders" ON public.medicine_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.medicine_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.medicine_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.medicine_reminders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.medicine_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Health history timeline entries
CREATE TABLE public.health_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('report', 'visit', 'prescription', 'symptom', 'note')),
  title TEXT NOT NULL,
  detail TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.health_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.health_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.health_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.health_entries FOR DELETE USING (auth.uid() = user_id);

-- Chat conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Symptom check results
CREATE TABLE public.symptom_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.symptom_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own checks" ON public.symptom_checks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checks" ON public.symptom_checks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE
  USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
