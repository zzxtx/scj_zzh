-- =============================================================
-- 创建完两个账号后，运行这段，把两人的昵称和管理员身份写进去。
-- 如果改了 src/config.js 里的邮箱，这里也要改成一样的。
-- 可重复执行，重复运行会更新成这里写的值。
-- =============================================================

insert into public.profiles (id, nickname, is_admin)
select id, 'zzh', true
from auth.users
where email = 'zzh@scj.local'
on conflict (id) do update
set nickname = excluded.nickname,
    is_admin = excluded.is_admin;

insert into public.profiles (id, nickname, is_admin)
select id, 'scj', false
from auth.users
where email = 'scj@zzh.local'
on conflict (id) do update
set nickname = excluded.nickname,
    is_admin = excluded.is_admin;