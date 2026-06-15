-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a proper policy that uses auth.uid() - notifications will be inserted via edge function with service role
-- Edge functions using service_role key bypass RLS entirely, so we don't need a permissive policy
-- Instead, allow users to insert their own notifications (for client-side use if needed)
CREATE POLICY "Users can create their own notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);