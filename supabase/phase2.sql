alter table public.memories alter column user_id set default auth.uid();
alter table public.tasks alter column user_id set default auth.uid();
