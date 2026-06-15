-- Remove SELECT on email_otps; only service role (verify-email-otp edge function) needs to read these.
DROP POLICY IF EXISTS "Users can view their own OTPs" ON public.email_otps;
DROP POLICY IF EXISTS "Users can select their own otps" ON public.email_otps;
DROP POLICY IF EXISTS "Users can read their own email otps" ON public.email_otps;
DROP POLICY IF EXISTS "Users can view own email otps" ON public.email_otps;

-- Remove INSERT on notifications from authenticated users; only service role / edge functions
-- (e.g. send-push-notification) should create notifications.
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;