-- Supabase grants function execution to API roles independently of the PUBLIC role.
-- Only signed-in learners may call the economy RPCs; both functions also reject a null auth.uid().
revoke execute on function public.refresh_daily_hearts() from anon;
revoke execute on function public.record_learning_result(text, text, text, boolean, jsonb, text, boolean, smallint) from anon;
grant execute on function public.refresh_daily_hearts() to authenticated;
grant execute on function public.record_learning_result(text, text, text, boolean, jsonb, text, boolean, smallint) to authenticated;
