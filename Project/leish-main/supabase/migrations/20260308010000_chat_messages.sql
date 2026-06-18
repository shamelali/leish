-- Migration: Add chat/messaging system
-- Enables customer-artist communication within the platform

-- 1. Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete restrict,
  receiver_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (length(content) <= 2000),
  read_at timestamptz,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Prevent self-messaging
  constraint no_self_message check (sender_id != receiver_id)
);

-- 2. Create index for efficient conversation queries
create index if not exists idx_messages_conversation 
  on public.messages(sender_id, receiver_id, created_at desc);

create index if not exists idx_messages_receiver_unread
  on public.messages(receiver_id, read_at) where read_at is null;

create index if not exists idx_messages_created_at
  on public.messages(created_at desc);

-- 3. Enable RLS
alter table public.messages enable row level security;

-- 4. RLS Policies
create policy "messages: participants can view"
  on public.messages for select
  using (
    auth.uid() = sender_id 
    or auth.uid() = receiver_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "messages: authenticated can insert"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.profiles
      where profiles.id = receiver_id
    )
  );

create policy "messages: sender can update (soft delete)"
  on public.messages for update
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

-- 5. Function to mark messages as read
create or replace function public.mark_messages_as_read(
  p_sender_id uuid,
  p_receiver_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.messages
  set read_at = now()
  where sender_id = p_sender_id
    and receiver_id = p_receiver_id
    and read_at is null;
end;
$$;

-- 6. Function to get unread message count
create or replace function public.get_unread_message_count(p_user_id uuid)
returns table (
  sender_id uuid,
  sender_name text,
  unread_count bigint
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  return query
  select 
    m.sender_id,
    p.full_name as sender_name,
    count(*) as unread_count
  from public.messages m
  join public.profiles p on p.id = m.sender_id
  where m.receiver_id = p_user_id
    and m.read_at is null
    and m.is_deleted = false
  group by m.sender_id, p.full_name;
end;
$$;

-- 7. Function to get conversation list for a user
create or replace function public.get_conversations(p_user_id uuid)
returns table (
  conversation_partner_id uuid,
  conversation_partner_name text,
  conversation_partner_avatar text,
  last_message_content text,
  last_message_at timestamptz,
  unread_count bigint
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  return query
  with last_messages as (
    select distinct on (
      case when sender_id = p_user_id then receiver_id else sender_id end
    )
      case when sender_id = p_user_id then receiver_id else sender_id end as partner_id,
      content as last_content,
      created_at as last_at,
      sender_id as last_sender_id
    from public.messages
    where (sender_id = p_user_id or receiver_id = p_user_id)
      and is_deleted = false
    order by 
      case when sender_id = p_user_id then receiver_id else sender_id end,
      created_at desc
  ),
  unread_counts as (
    select 
      sender_id as partner_id,
      count(*) as cnt
    from public.messages
    where receiver_id = p_user_id
      and read_at is null
      and is_deleted = false
    group by sender_id
  )
  select 
    lm.partner_id as conversation_partner_id,
    p.full_name as conversation_partner_name,
    p.avatar_url as conversation_partner_avatar,
    lm.last_content as last_message_content,
    lm.last_at as last_message_at,
    coalesce(uc.cnt, 0) as unread_count
  from last_messages lm
  join public.profiles p on p.id = lm.partner_id
  left join unread_counts uc on uc.partner_id = lm.partner_id
  order by lm.last_at desc;
end;
$$;

-- 8. Trigger to update updated_at
create or replace function public.update_messages_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger messages_updated_at
  before update on public.messages
  for each row
  execute function public.update_messages_updated_at();

-- 9. Comments for documentation
comment on table public.messages is 'Chat messages between customers and artists/MUAs';
comment on column public.messages.content is 'Message text, max 2000 characters';
comment on column public.messages.read_at is 'Timestamp when message was read by receiver';
comment on column public.messages.is_deleted is 'Soft delete flag';
