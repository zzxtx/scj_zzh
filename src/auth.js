import { supabase } from './supabase.js';
import { USERS } from './config.js';

export async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}

export async function login(nickname, password) {
  const name = (nickname || '').trim().toLowerCase();
  const entry = USERS.find((u) => u.nickname.toLowerCase() === name);
  if (!entry) {
    return { error: new Error('没有这个名字，检查一下拼写') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: entry.email,
    password,
  });

  if (error) {
    return { error: new Error(translateLoginError(error)) };
  }
  return { data };
}

export async function logout() {
  await supabase.auth.signOut();
}

function translateLoginError(error) {
  const message = error?.message || '';
  if (message.includes('Invalid login credentials')) return '昵称或密码不对';
  if (message.includes('Email not confirmed')) return '账号还没确认，请在 Supabase 里确认';
  return message;
}