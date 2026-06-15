-- Veterinary Doctor Profiles (additional info for vets)
CREATE TABLE public.vet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license_number TEXT NOT NULL,
  specialization TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee DECIMAL(10, 2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  certificate_url TEXT,
  rating DECIMAL(2, 1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_consultations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vet_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  disease_detection_id UUID REFERENCES public.disease_detections(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  consultation_type TEXT NOT NULL DEFAULT 'chat' CHECK (consultation_type IN ('chat', 'video', 'in_person')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  prescription TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  fee_paid DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chat messages for consultations
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;

-- Vet profiles RLS policies
CREATE POLICY "Anyone can view verified vet profiles"
  ON public.vet_profiles FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Vets can view their own profile"
  ON public.vet_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vets can update their own profile"
  ON public.vet_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Vets can insert their own profile"
  ON public.vet_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vet profiles"
  ON public.vet_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Consultations RLS policies
CREATE POLICY "Farmers can view their own consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Vets can view their consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = vet_id);

CREATE POLICY "Farmers can create consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Vets can update their consultations"
  ON public.consultations FOR UPDATE
  USING (auth.uid() = vet_id);

CREATE POLICY "Farmers can update their consultations"
  ON public.consultations FOR UPDATE
  USING (auth.uid() = farmer_id);

-- Chat messages RLS policies
CREATE POLICY "Consultation participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
      AND (c.farmer_id = auth.uid() OR c.vet_id = auth.uid())
    )
  );

CREATE POLICY "Consultation participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
      AND (c.farmer_id = auth.uid() OR c.vet_id = auth.uid())
    )
  );

CREATE POLICY "Senders can update their own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Trigger for updated_at
CREATE TRIGGER update_vet_profiles_updated_at
  BEFORE UPDATE ON public.vet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();