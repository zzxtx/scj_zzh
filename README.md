# 两个人的博客

一个只给两个人用的小博客：登录后自动记住身份，互相发文、评论、回复；只有博主能删除内容。整体 0 元。

## 技术组成

- 网站：Vite + 原生 JS，部署到腾讯 EdgeOne Pages（免费）
- 数据与登录：Supabase 免费版（存文章、评论、账号和密码）

## 一、准备工作

1. 注册 EdgeOne Pages 账号。
2. 注册 Supabase 账号，创建一个新项目（免费计划即可）。
3. 本地安装 Node.js（18 或更高版本）。

## 二、配置 Supabase

1. 打开 Supabase 项目 → 左侧 `Project Settings` → `API`，复制两样东西：
   - `Project URL`（形如 `https://xxxx.supabase.co`）
   - `anon public` key
2. 打开本项目里的 `src/config.js`，把这两样填进去。
3. 建表：打开 Supabase 左侧 `SQL Editor`，新建查询，把 `supabase/schema.sql` 的**全部内容**粘贴进去，点 Run。
4. 创建两个账号（这就是给两个人“设好密码”；**必须先完成第 3 步再创建**）：
   - 左侧 `Authentication` → `Users` → `Add user`。
   - 第一个账号：
     - Email：`you@friends.local`（和 `config.js` 里第一条一致）
     - Password：你自己设的密码
     - 勾选 `Auto Confirm User`
   - 第二个账号：
     - Email：`friend@friends.local`
     - Password：给朋友的密码
     - 勾选 `Auto Confirm User`
   - 想改昵称/邮箱，就把 `config.js` 的 `USERS` 和 `supabase/setup_users.sql` 一起改成一样的。
5. 设置昵称和管理员：在 `SQL Editor` 新建查询，把 `supabase/setup_users.sql` 的**全部内容**粘贴进去，点 Run。这一步会把“你”设成管理员（能删除内容），把“朋友”设成普通成员。
6. 可选：左侧 `Authentication` → `Sign In / Providers` → `Email`，把 `Confirm email` 关掉。

> 提示：如果 Supabase 不接受 `.local` 结尾的邮箱，可以换成任意不会误发邮件的地址，比如 `you123@blog.local`，并在 `config.js` 和 `setup_users.sql` 里保持一致。

## 三、本地预览

在项目目录里运行：

```bash
npm install
npm run dev
```

浏览器打开提示的地址（一般是 `http://localhost:5173`），用上面创建的两个账号登录试试。

## 四、部署到 EdgeOne Pages

方式 A（推荐，之后改代码自动更新）：把整个项目文件夹推送到一个 GitHub 仓库，然后在 EdgeOne Pages 新建项目并连接该仓库。

方式 B（手动上传）：先运行 `npm run build`，把生成的 `dist` 文件夹上传到 EdgeOne Pages。

构建配置（方式 A 需要）：

- 构建命令：`npm run build`
- 输出目录：`dist`

部署完成后拿到网站地址，发给朋友，并告诉他：他的昵称和密码。

## 五、日常使用

- 登录页选自己的昵称、输密码，之后每次打开都会自动保持登录。
- 首页是文章列表，点进去可以评论；评论下面有“回复”，支持楼中楼。
- 顶部“写文章”只有一个正文输入框，发布即可。
- 只有第一个账号（管理员）能看到“删除文章 / 删除评论”按钮。

## 六、常见问题

- **登录提示“昵称或密码不对”**：检查 `config.js` 里的邮箱是否和 Supabase 创建用户时完全一致，密码是否输对。
- **提示“账号资料没配置好”**：说明 `schema.sql` 或 `setup_users.sql` 没运行，或邮箱对不上。
- **国内访问 Supabase 偶尔慢**：免费版对两个人够用；如果明显卡顿，可在 Supabase 绑定自己的域名，或以后再迁移到腾讯云开发。