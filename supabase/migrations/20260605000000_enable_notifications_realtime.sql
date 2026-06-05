-- Enable Realtime for the notifications table so client-side
-- NotificationBell can subscribe to INSERT events for live push.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add to the default Supabase Realtime publication.
-- If the publication does not exist yet (fresh project), this is a no-op.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;
