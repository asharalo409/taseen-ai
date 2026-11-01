-- Taseen AI database schema. Run ONCE in Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- Connected accounts. Credentials are stored ENCRYPTED. Server-only table.
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  permission_level text not null default 'read'
    check (permission_level in ('read', 'suggest', 'approve')),
  encrypted_credentials text,
  status text not null default 'disconnected',
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- Actions waiting for the owner's approval.
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'executed', 'failed')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.tasks enable row level security;
alter table public.integrations enable row level security;
alter table public.approvals enable row level security;
alter table public.activity_log enable row level security;

-- Owner can read own chat data (writes go through the server)
create policy "own conversations read" on public.conversations
  for select using (auth.uid() = user_id);
create policy "own messages read" on public.messages
  for select using (auth.uid() = user_id);

-- Owner can fully manage memories and tasks
create policy "own memories all" on public.memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks all" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Approvals & activity: read only from browser; changes only via server
create policy "own approvals read" on public.approvals
  for select using (auth.uid() = user_id);
create policy "own activity read" on public.activity_log
  for select using (auth.uid() = user_id);

-- integrations: NO policies on purpose -> browser can never read credentials.
