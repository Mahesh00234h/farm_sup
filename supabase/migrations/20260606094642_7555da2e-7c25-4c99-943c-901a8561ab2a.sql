
-- 1. Restrict user_roles self-assignment to safe roles only (no veterinary/delivery/admin escalation)
DROP POLICY IF EXISTS "Users can only self-assign non-admin roles" ON public.user_roles;
CREATE POLICY "Users can self-assign basic roles only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('farmer'::app_role, 'consumer'::app_role, 'retailer'::app_role)
);

-- 2. Allow users to delete their own OTP rows
CREATE POLICY "Users can delete their own OTP rows"
ON public.email_otps
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Lock down realtime.messages broadcasts so subscribers can't read other users' streams.
--    Enable RLS and add an authenticated-only baseline policy scoped to the user's own topic.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive own-topic broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated can receive own-topic broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only allow channels that include the user's id as a segment in the topic.
  -- Postgres-changes per-row filtering is still enforced by RLS on the underlying tables.
  topic LIKE ('%' || auth.uid()::text || '%')
);
