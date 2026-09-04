import { supabase } from './supabase.js';

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, nickname, content, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPost(id) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, nickname, content, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, parent_id, nickname, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createPost(content, userId, nickname) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ content, user_id: userId, nickname })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createComment({ postId, parentId, content, userId, nickname }) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      parent_id: parentId || null,
      content,
      user_id: userId,
      nickname,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, parent_id, nickname, content, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}