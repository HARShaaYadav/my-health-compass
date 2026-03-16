
-- Consultations/bookings table
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doctor_name text NOT NULL,
  specialty text NOT NULL,
  appointment_time timestamptz NOT NULL,
  fee text,
  status text NOT NULL DEFAULT 'booked',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultations" ON public.consultations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consultations" ON public.consultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consultations" ON public.consultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own consultations" ON public.consultations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
