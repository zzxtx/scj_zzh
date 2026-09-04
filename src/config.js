// ===== 1. 在这里填上你的 Supabase 信息 =====
// 位置：Supabase 项目 → Project Settings → API
export const SUPABASE_URL = 'https://pgfshysjxwbkbhecjvrs.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZnNoeXNqeHdia2JoZWNqdnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDk1MTYsImV4cCI6MjEwNDA4NTUxNn0.vjBJM48Bf-LUEPwNcaHGk8kf9HIEfF3dkIogWVnq2Wo';

// ===== 2. 两位成员的账号信息 =====
// nickname：登录页面显示的名字，要和 supabase/setup_users.sql 里的昵称一致。
// email：登录用的“假邮箱”，不需要真的能收邮件，但必须在 Supabase
//        里按这个邮箱创建用户。两个人不能重复。
export const USERS = [
  { nickname: 'zzh', email: 'zzh@scj.local' },
  { nickname: 'scj', email: 'scj@zzh.local' },
];