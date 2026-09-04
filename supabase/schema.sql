-- =============================================================
-- 在 Supabase 的 SQL Editor 里整段运行一次即可。
-- 注意顺序：先运行这里，再创建两个账号（否则 profile 不会自动生成）。
-- 可重复执行（重复运行会先删除旧策略再重建）。
-- =============================================================

-- 1) 用户资料表：登录后自动生成一行（nickname / 是否管理员）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '匿名',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) 文章表：只有正文
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 3) 评论表：支持楼中楼回复
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  nickname text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 4) 新用户创建时，自动写入 profile（nickname / is_admin 来自 user_metadata）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', '匿名'),
    coalesce((new.raw_user_meta_data ->> 'is_admin')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) 开启行级安全
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- 6) 重建权限策略
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "posts_select" on public.posts;
create policy "posts_select"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
  on public.posts for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "comments_select" on public.comments;
create policy "comments_select"
  on public.comments for select
  to authenticated
  using (true);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "comments_delete_admin" on public.comments;
create policy "comments_delete_admin"
  on public.comments for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );