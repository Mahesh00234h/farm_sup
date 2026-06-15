
CREATE TABLE public.email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_otps_user ON public.email_otps(user_id, purpose, consumed_at);
CREATE INDEX idx_email_otps_email ON public.email_otps(email);

GRANT SELECT ON public.email_otps TO authenticated;
GRANT ALL ON public.email_otps TO service_role;

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OTP rows"
  ON public.email_otps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
