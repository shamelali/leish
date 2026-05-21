-- Restrict is_admin() to authenticated users only
-- The function is SECURITY DEFINER, so anon role should not be able to call it

revoke execute on function public.is_admin() from public, anon;

grant execute on function public.is_admin() to authenticated;
