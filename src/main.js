import { USERS } from './config.js';
import { getSessionUser, login, logout } from './auth.js';
import {
  fetchProfile,
  fetchPosts,
  fetchAllComments,
  fetchPost,
  fetchComments,
  createPost,
  createComment,
  deletePost,
  deleteComment,
} from './api.js';

const app = document.getElementById('app');
let currentUser = null;
let profile = null;
let allPosts = [];
let allComments = [];

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'value') node.value = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const child of kids) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query] = raw.split('?');
  return { path, params: new URLSearchParams(query || '') };
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function previewText(content) {
  const clean = (content || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '(空文章)';
  return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean;
}

function burstHearts() {
  const layer = document.getElementById('hearts-layer') || createHeartsLayer();
  const heartChars = ['❤', '💕', '💖', '💗', '🩷'];
  const count = 18;
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'float-heart';
    heart.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
    heart.style.left = `${10 + Math.random() * 80}%`;
    heart.style.bottom = '-20px';
    heart.style.fontSize = `${16 + Math.random() * 22}px`;
    heart.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    heart.style.animationDelay = `${Math.random() * 0.6}s`;
    layer.appendChild(heart);
    setTimeout(() => heart.remove(), 5200);
  }
}

function createHeartsLayer() {
  const layer = document.createElement('div');
  layer.id = 'hearts-layer';
  layer.className = 'hearts-layer';
  document.body.appendChild(layer);
  return layer;
}
async function render() {
  currentUser = await getSessionUser();
  if (!currentUser) {
    renderLogin();
    return;
  }

  try {
    profile = await fetchProfile(currentUser.id);
  } catch (error) {
    await logout();
    renderLogin();
    return;
  }

  if (!profile) {
    renderMissingProfile();
    return;
  }

  const { path, params } = parseRoute();
  if (path === '/write') renderWrite();
  else if (path === '/post') renderPost(params.get('id'));
  else renderList();
}

function renderLogin() {
  app.innerHTML = '';
  app.append(
    el('div', { class: 'login-card' }, [
      el('h1', { class: 'login-title', text: 'scj&zzh ❤' }),
      el('p', { class: 'login-sub', text: '只属于我们俩的悄悄话' }),
      el('input', { id: 'login-nickname', class: 'input', type: 'text', placeholder: '你是谁呀', onkeydown: (e) => { if (e.key === 'Enter') doLogin(); } }),
        
      el('input', { id: 'login-password', class: 'input', type: 'password', placeholder: '还记得密码不', onkeydown: (e) => { if (e.key === 'Enter') doLogin(); } }),
      el('button', { class: 'btn block', text: '进来', onclick: doLogin }),
      el('div', { id: 'login-error', class: 'error' }),
    ])
  );
}

async function doLogin() {
  const nickname = document.getElementById('login-nickname').value;
  const password = document.getElementById('login-password').value;
  const errBox = document.getElementById('login-error');
  errBox.textContent = '';
  if (!password) {
    errBox.textContent = '请输入密码';
    return;
  }
  const { error } = await login(nickname, password);
  if (error) {
    errBox.textContent = error.message;
    return;
  }
  await render();
}

function renderMissingProfile() {
  app.innerHTML = '';
  app.append(
    el('main', { class: 'container' }, [
      el('p', { text: '账号资料没配置好。请先在 Supabase 运行 supabase/schema.sql，并按 README 创建两个带 nickname 的用户。' }),
      el('button', {
        class: 'btn',
        text: '退出登录',
        onclick: async () => {
          await logout();
          location.hash = '/';
          await render();
        },
      }),
    ])
  );
}

function renderHeader(active) {
  return el('header', { class: 'header' }, [
    el('a', { href: '#/', class: 'brand' }, [
    'scj&zzh ',
    el('span', { class: 'heart-btn', text: '❤', onclick: (e) => { e.preventDefault(); e.stopPropagation(); burstHearts(); } }),
  ]),
    el('nav', { class: 'nav' }, [
      el('a', { href: '#/', class: active === 'list' ? 'active' : '', text: '悄悄话' }),
      el('a', { href: '#/write', class: active === 'write' ? 'active' : '', text: '写给你' }),
      el('span', { class: 'who', text: '❤ ' + profile.nickname }),
      el('button', { class: 'link', text: '离开', onclick: doLogout }),
    ]),
  ]);
}

async function doLogout() {
  await logout();
  location.hash = '/';
  await render();
}

async function renderList() {
  app.innerHTML = '';
  app.append(renderHeader('list'));

  const main = el('main', { class: 'container' });
  main.append(
    el('div', { class: 'filters' }, [
      el('input', { id: 'search-input', class: 'input search', type: 'text', placeholder: '搜一句悄悄话…' }),
      el('select', { id: 'month-select', class: 'input select' }),
    ])
  );
  main.append(el('a', { href: '#/write', class: 'btn block', text: '写一句悄悄话' }));

  const list = el('div', { id: 'post-list', class: 'post-list' }, [
    el('p', { class: 'muted', text: '加载中…' }),
  ]);
  main.append(list);
  app.append(main);

  try {
    const [posts, comments] = await Promise.all([fetchPosts(), fetchAllComments()]);
    allPosts = posts;
    allComments = comments;
    buildMonthOptions(posts);
    renderFilteredList();
  } catch (error) {
    document.getElementById('post-list').textContent = `加载失败：${error.message}`;
  }
}

function buildMonthOptions(posts) {
  const select = document.getElementById('month-select');
  const search = document.getElementById('search-input');
  const months = [...new Set(posts.map((p) => (p.created_at || '').slice(0, 7)))].sort().reverse();
  select.innerHTML = '';
  select.append(el('option', { value: '', text: '全部月份' }));
  for (const month of months) {
    select.append(el('option', { value: month, text: monthLabel(month) }));
  }
  select.onchange = () => renderFilteredList();
  search.oninput = () => renderFilteredList();
}

function renderFilteredList() {
  const list = document.getElementById('post-list');
  const keyword = document.getElementById('search-input').value.trim().toLowerCase();
  const month = document.getElementById('month-select').value;

  const filtered = allPosts.filter((post) => {
    const inMonth = !month || (post.created_at || '').startsWith(month);
    const inKeyword = !keyword || postMatches(post, keyword);
    return inMonth && inKeyword;
  });

  list.innerHTML = '';
  if (!filtered.length) {
    const tip = keyword
      ? `没有找到关于「${keyword}」的悄悄话 💭`
      : '这个月份还没有悄悄话 🌙';
    list.append(el('p', { class: 'empty', text: tip }));
    return;
  }

  for (const post of filtered) {
    list.append(
      el('a', { href: `#/post?id=${post.id}`, class: 'post-item' }, [
        el('div', { class: 'post-preview', text: matchPreview(post, keyword) }),
        el('div', { class: 'post-meta', text: `${post.nickname} · ${formatTime(post.created_at)}` }),
      ])
    );
  }
}

function monthLabel(month) {
  const [year, mon] = month.split('-');
  return `${year}年${Number(mon)}月`;
}

function snippetPreview(content, keyword) {
  const text = (content || '').replace(/\s+/g, ' ').trim();
  if (!text) return '(空)';
  if (!keyword) {
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  }
  const lower = text.toLowerCase();
  const index = lower.indexOf(keyword);
  if (index === -1) {
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  }
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + keyword.length + 40);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
function renderWrite() {
  app.innerHTML = '';
  app.append(renderHeader('write'));
  app.append(
    el('main', { class: 'container narrow' }, [
      el('h2', { text: '写给你的悄悄话' }),
      el('textarea', { id: 'write-content', class: 'input area', rows: 14, placeholder: '把想说的话写在这里…' }),
      el('button', { class: 'btn', text: '说给你听', onclick: doPublish }),
      el('div', { id: 'write-error', class: 'error' }),
    ])
  );
}

async function doPublish() {
  const content = document.getElementById('write-content').value.trim();
  const errBox = document.getElementById('write-error');
  errBox.textContent = '';
  if (!content) {
    errBox.textContent = '先写点什么吧';
    return;
  }
  try {
    await createPost(content, currentUser.id, profile.nickname);
    location.hash = '/';
    await render();
  } catch (error) {
    errBox.textContent = `发布失败：${error.message}`;
  }
}

async function renderPost(id) {
  app.innerHTML = '';
  app.append(renderHeader('list'));
  const main = el('main', { class: 'container narrow' });
  app.append(main);

  if (!id) {
    main.append(el('p', { text: '缺少文章编号' }));
    return;
  }

  try {
    const post = await fetchPost(id);
    if (!post) {
      main.append(el('p', { text: '文章不存在或已删除' }));
      return;
    }

    const article = el('article', { class: 'post' }, [
      el('div', { class: 'post-meta', text: `${post.nickname} · ${formatTime(post.created_at)}` }),
      el('div', { class: 'post-content', text: post.content }),
    ]);
    if (profile.is_admin) {
      article.append(
        el('div', { class: 'post-tools' }, [
          el('button', { class: 'link danger', text: '删除文章', onclick: () => doDeletePost(post.id) }),
        ])
      );
    }
    main.append(article);

    main.append(el('h3', { text: '悄悄回应' }));
    main.append(
      el('div', { class: 'comment-form' }, [
        el('textarea', { id: 'comment-content', class: 'input area', rows: 3, placeholder: '回一句悄悄话…' }),
        el('button', {
          class: 'btn',
          text: '回应',
          onclick: () =>
            doAddComment(
              post.id,
              null,
              document.getElementById('comment-content').value,
              document.getElementById('comment-error')
            ),
        }),
        el('div', { id: 'comment-error', class: 'error' }),
      ])
    );

    const commentList = el('div', { class: 'comment-list' });
    main.append(commentList);
    await loadComments(post.id, commentList);
  } catch (error) {
    main.append(el('p', { text: `加载失败：${error.message}` }));
  }
}

async function doAddComment(postId, parentId, content, errBox) {
  const text = (content || '').trim();
  if (errBox) errBox.textContent = '';
  if (!text) {
    if (errBox) errBox.textContent = '先写点什么吧';
    return;
  }
  try {
    await createComment({
      postId,
      parentId,
      content: text,
      userId: currentUser.id,
      nickname: profile.nickname,
    });
    await render();
  } catch (error) {
    if (errBox) errBox.textContent = `发表失败：${error.message}`;
  }
}

async function loadComments(postId, list) {
  list.innerHTML = '';
  try {
    const comments = await fetchComments(postId);
    if (!comments.length) {
      list.append(el('p', { class: 'empty', text: '还没有回应' }));
      return;
    }
    const childrenByParent = {};
    for (const c of comments) {
      if (c.parent_id) {
        if (!childrenByParent[c.parent_id]) childrenByParent[c.parent_id] = [];
        childrenByParent[c.parent_id].push(c);
      }
    }
    const topLevel = comments.filter((c) => !c.parent_id);
    for (const c of topLevel) {
      list.append(renderComment(c, childrenByParent, postId));
    }
  } catch (error) {
    list.textContent = `评论加载失败：${error.message}`;
  }
}

function renderComment(comment, childrenByParent, postId) {
  const node = el('div', { class: 'comment' }, [
    el('div', { class: 'comment-meta', text: `${comment.nickname} · ${formatTime(comment.created_at)}` }),
    el('div', { class: 'comment-content', text: comment.content }),
    el('div', { class: 'comment-actions' }, [
      el('button', { class: 'link', text: '回一句', onclick: () => toggleReply(node, postId, comment.id) }),
      profile.is_admin
        ? el('button', { class: 'link danger', text: '删除', onclick: () => doDeleteComment(comment.id) })
        : null,
    ]),
  ]);

  const replyBox = el('div', { class: 'reply-box hidden' });
  node.append(replyBox);

  const children = childrenByParent[comment.id] || [];
  if (children.length) {
    const wrap = el('div', { class: 'comment-children' });
    for (const child of children) {
      wrap.append(renderComment(child, childrenByParent, postId));
    }
    node.append(wrap);
  }

  return node;
}

function toggleReply(node, postId, parentId) {
  const box = node.querySelector('.reply-box');
  box.classList.toggle('hidden');
  if (box.classList.contains('hidden')) {
    box.innerHTML = '';
    return;
  }
  const area = el('textarea', { class: 'input area', rows: 2, placeholder: '回一句…' });
  const err = el('div', { class: 'error' });
  const btn = el('button', {
    class: 'btn small',
    text: '送出回应',
    onclick: () => doAddComment(postId, parentId, area.value, err),
  });
  box.innerHTML = '';
  box.append(area, btn, err);
}

async function doDeletePost(id) {
  if (!confirm('确定删掉这篇悄悄话吗？')) return;
  try {
    await deletePost(id);
    location.hash = '/';
    await render();
  } catch (error) {
    alert(`删除失败：${error.message}`);
  }
}

async function doDeleteComment(id) {
  if (!confirm('确定删掉这条回应吗？')) return;
  try {
    await deleteComment(id);
    await render();
  } catch (error) {
    alert(`删除失败：${error.message}`);
  }
}

window.addEventListener('hashchange', () => render());
render();

function postMatches(post, keyword) {
  if (!keyword) return true;
  if ((post.content || '').toLowerCase().includes(keyword)) return true;
  return allComments.some((c) => c.post_id === post.id && (c.content || '').toLowerCase().includes(keyword));
}

function matchPreview(post, keyword) {
  if (!keyword) return snippetPreview(post.content, null);
  if ((post.content || '').toLowerCase().includes(keyword)) {
    return snippetPreview(post.content, keyword);
  }
  const comment = allComments.find((c) => c.post_id === post.id && (c.content || '').toLowerCase().includes(keyword));
  if (comment) {
    return `「${comment.nickname}的回应」${snippetPreview(comment.content, keyword)}`;
  }
  return snippetPreview(post.content, null);
}