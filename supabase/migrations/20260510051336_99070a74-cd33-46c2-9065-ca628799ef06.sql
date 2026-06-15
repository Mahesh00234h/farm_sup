CREATE TABLE public.suggestion_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID,
  suggestion_type TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  action TEXT NOT NULL CHECK (action IN ('shown','clicked','dismissed')),
  score INTEGER,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestion_interactions_user_created ON public.suggestion_interactions(user_id, created_at DESC);

ALTER TABLE public.suggestion_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
ON public.suggestion_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
ON public.suggestion_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);