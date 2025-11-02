# Mini Next.js Page Router

> 一个约 700 行代码的 TypeScript 简化版 Next.js Page Router 实现，用于深入理解 Next.js 的核心架构和工作原理。

[English](./README.md) | 中文文档

## 🎯 学习目标

通过简易代码实现 Next.js Page Router 核心功能，理解现代 SSR 框架的工作原理：

- ✅ 基于文件系统的路由系统
- ✅ SSR（服务端渲染）和 SSG（静态生成）
- ✅ React 服务端渲染和客户端 hydrate
- ✅ 数据获取 API（getStaticProps、getServerSideProps、getStaticPaths）
- ✅ 客户端路由导航（SPA 体验）
- ✅ 嵌套动态路由（多级参数）
- ✅ 完整 TypeScript 类型支持

## 📁 项目结构

```
mini-nextjs-page-router/
├── types/
│   └── index.ts              # TypeScript 类型定义
├── build/
│   ├── index.ts              # 构建流程编排器
│   ├── scan-pages.ts         # 页面扫描器（文件 → 路由映射）
│   ├── generate-routes.ts    # 路由清单生成器
│   └── render-static.ts      # SSG 预渲染引擎
├── server/
│   ├── index.ts              # Express HTTP 服务器
│   ├── router.ts             # 路由匹配引擎
│   ├── render-ssr.tsx        # 服务端渲染
│   └── render-ssg.ts         # 静态文件服务
├── client/
│   ├── index.tsx             # 客户端入口 & hydration
│   ├── router.tsx            # 客户端路由器
│   └── link.tsx              # Link 组件（带预取功能）
├── pages/                    # 你的页面（自动路由映射）
│   ├── index.tsx             # / (SSR)
│   ├── about.tsx             # /about (SSG)
│   ├── terms.tsx             # /terms (SSG)
│   ├── blog/
│   │   ├── [id].tsx          # /blog/:id (动态 SSG)
│   │   └── [category]/
│   │       └── [id].tsx      # /blog/:category/:id (嵌套动态)
│   └── product/
│       └── [id].tsx          # /product/:id (动态路由)
└── .next/                    # 构建输出
    ├── manifest.json         # 路由清单
    ├── static/               # 预渲染的 HTML/JSON + 客户端 bundles
    └── server/               # 服务端模块

**关键文件**：
- `tsconfig.json` - TypeScript 配置（严格模式）
- `vite.config.ts` - Vite 构建配置
- `package.json` - 依赖和脚本
```

**文档**：
- `MINI_NEXTJS_ARCHITECTURE.md` - 详细架构说明
- `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md` - Next.js 性能优化对比

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 启动服务器
npm start
```

访问 http://localhost:3000

**体验功能**：
- `/` - SSR（每次刷新数据更新）
- `/about` - SSG（预渲染静态页面）
- `/blog/tech/1` - 嵌套动态路由
- `/blog/1`, `/blog/2`, `/blog/3` - 动态路由
- `/product/1` - 无 getStaticProps 的动态路由

> 点击链接体验客户端路由（无页面刷新）

### 🎬 运行效果

**首页（SSR）** - `http://localhost:3000/`
```
🏠 Mini Next.js Page Router
服务器时间: 2025-11-02T13:44:33.623Z  ← 每次刷新都会更新！
访问计数: 1

导航链接:
→ 关于
→ 条款
→ 博客文章
```

**关于页面（SSG）** - `http://localhost:3000/about`
```
📖 关于本项目
构建时间: 2025-11-02T13:40:11.712Z  ← 构建时固定
项目信息: 教育性实现

本页面在构建时预渲染！
```

**博客文章（动态 SSG）** - `http://localhost:3000/blog/tech/1`
```
📝 博客文章
分类: tech
ID: 1
标题: Understanding TypeScript Generics
内容: [文章内容...]

← 返回首页
```

**浏览器开发者工具控制台**：
```
[Mini Next.js] 开始 Hydration...
[Mini Next.js] 页面: /about
[Mini Next.js] Props: { buildTime: "...", projectInfo: "..." }
[Mini Next.js] 加载组件: /about
[Mini Next.js] Hydration 完成!
[Router] 初始化路由，pathname: /about
```

**点击链接时**（客户端导航）：
```
[Link] 导航到 /blog/1
[Router] 获取页面数据: /blog/1?_next_data=1
[Router] 接收数据: {"props": {...}, "page": "/blog/:id"}
[Router] 加载组件: /blog/:id
[Router] 渲染页面组件
[Router] 导航完成!
✨ 无页面刷新 - 即时切换！
```

## 💡 核心概念

### SSR（服务端渲染）
```tsx
// pages/index.tsx - 每次请求时运行
import type { GetServerSidePropsResult } from '../types/index.js'

export async function getServerSideProps(): Promise<GetServerSidePropsResult> {
  return { props: { data: await fetchData() } }
}
```

### SSG（静态生成）
```tsx
// pages/about.tsx - 构建时运行一次
import type { GetStaticPropsResult } from '../types/index.js'

export async function getStaticProps(): Promise<GetStaticPropsResult> {
  return { props: { data: await fetchData() } }
}
```

### 动态路由
```tsx
// pages/blog/[id].tsx
import type { GetStaticPathsResult } from '../../types/index.js'

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  return { paths: [{ params: { id: '1' } }], fallback: false }
}
```

### 嵌套动态路由 ✨
```tsx
// pages/blog/[category]/[id].tsx
import type { GetStaticPathsResult } from '../../../types/index.js'

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  return {
    paths: [{ params: { category: 'tech', id: '1' } }],
    fallback: false
  }
}
```

### 客户端导航
```tsx
import Link from '../client/link.js'

<Link href="/about">关于</Link>  // 无页面刷新
```

## 🔍 工作原理

### 1️⃣ 构建流程 (npm run build)

```
┌─────────────────────────────────────────────────────────────────┐
│                        构建管道                                    │
└─────────────────────────────────────────────────────────────────┘

步骤 1: 扫描 Pages 目录
pages/index.tsx        → 路由: /            (SSR)
pages/about.tsx        → 路由: /about       (SSG)
pages/blog/[id].tsx    → 路由: /blog/:id    (动态 SSG)
              ↓
         [PageMetadata[]]

步骤 2: 生成路由清单
{
  routes: [
    {
      page: '/blog/:id',
      pattern: '^/blog/([^/]+)$',    // 匹配正则表达式
      paramNames: ['id'],
      renderType: 'SSG'
    },
    ...
  ]
}
              ↓
    manifest.json (路由配置)

步骤 3: 构建客户端 Bundle (Vite)
client/index.tsx  →  .next/static/client.js
pages/*.tsx       →  .next/static/[page].js (代码分割)
              ↓
    客户端 JavaScript bundles

步骤 4: 预渲染 SSG 页面
对每个带 getStaticProps 的 SSG 路由:
  1. 动态导入页面模块
  2. 调用 getStaticProps() → 获取 props 数据
  3. 渲染组件为 HTML 字符串
  4. 注入数据到 <script id="__NEXT_DATA__">
  5. 保存 .html 和 .json 文件
              ↓
    .next/static/about.html + about.json
```

**构建输出**：
```
.next/
├── manifest.json              # 路由定义
├── static/
│   ├── client.js             # 客户端运行时 (147KB)
│   ├── about.html            # 预渲染 HTML
│   ├── about.json            # 页面 props 数据
│   ├── blog/1.html           # 动态路由预渲染
│   └── ...
```

---

### 2️⃣ 服务器请求处理

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP 请求流程                                  │
└─────────────────────────────────────────────────────────────────┘

浏览器请求: GET /blog/tech/1
              ↓
┌──────────────────────────────┐
│  Express 服务器 (server/index.ts)                               │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  路由匹配器 (server/router.ts)                                  │
│  - 使用正则表达式匹配清单                                         │
│  - 提取参数: { category: 'tech', id: '1' }                      │
└──────────────────────────────┘
              ↓
        是 SSG 路由?
         /        \
       是          否
        ↓           ↓
┌────────────────┐  ┌────────────────┐
│ render-ssg.ts  │  │ render-ssr.tsx │
│ 读取 HTML 文件  │  │ 每次请求时     │
│ 从 .next/      │  │ 动态渲染       │
└────────────────┘  └────────────────┘
        ↓               ↓
   返回嵌入 __NEXT_DATA__ 的 HTML
        ↓
   浏览器接收 HTML
```

**SSG 路由** (例如 `/about`):
```typescript
// 读取预生成的文件
.next/static/about.html → 返回给浏览器 (⚡ 快速!)
```

**SSR 路由** (例如 `/` - 首页):
```typescript
// 按需渲染
1. 导入 pages/index.tsx
2. 调用 getServerSideProps({ req, res })
3. renderToString(<IndexPage props={data} />)
4. 注入到 HTML 模板中，包含 __NEXT_DATA__
5. 返回新鲜的 HTML (📊 动态!)
```

---

### 3️⃣ 客户端 Hydration

```
┌─────────────────────────────────────────────────────────────────┐
│                    浏览器初始加载                                  │
└─────────────────────────────────────────────────────────────────┘

1. 浏览器接收 HTML
   <div id="root">
     <h1>关于页面</h1>  <!-- 服务端渲染 -->
   </div>
   <script id="__NEXT_DATA__">
     {"props": {"buildTime": "..."}, "page": "/about"}
   </script>
   <script src="/static/client.js"></script>

              ↓

2. client.js 执行 (client/index.tsx)
   - 解析 HTML 中的 __NEXT_DATA__
   - 获取页面: "/about"
   - 获取 props: {buildTime: "..."}

              ↓

3. 动态导入
   const modules = import.meta.glob('../pages/**/*.tsx')
   const pagePath = './pages/about.tsx'
   const { default: PageComponent } = await modules[pagePath]()

              ↓

4. Hydration
   import { hydrateRoot } from 'react-dom/client'
   hydrateRoot(
     document.getElementById('root'),
     <PageComponent {...props} />
   )
   ✨ React 将事件监听器附加到现有 DOM!

              ↓

5. 设置路由器
   - 初始化客户端路由器
   - 监听链接点击
   - 准备好 SPA 导航! 🚀
```

---

### 4️⃣ 客户端导航 (SPA)

```
┌─────────────────────────────────────────────────────────────────┐
│                    客户端导航                                      │
└─────────────────────────────────────────────────────────────────┘

用户点击: <Link href="/blog/1">博客文章 1</Link>
              ↓
┌──────────────────────────────┐
│  Link 组件 (client/link.tsx)                                    │
│  - 阻止默认 <a> 行为                                              │
│  - 调用 router.push('/blog/1')                                  │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  客户端路由器 (client/router.tsx)                                │
└──────────────────────────────┘
              ↓
    数据已缓存?
      /      \
     是       否 → 获取: GET /blog/1?_next_data=1
      ↓       ↓
   使用缓存  服务器返回 JSON:
              {
                "props": {"id": "1", "title": "..."},
                "page": "/blog/:id"
              }
              ↓
         缓存响应
              ↓
┌──────────────────────────────┐
│  动态导入组件                                                      │
│  import('../pages/blog/[id].tsx')                               │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  更新 DOM (React 渲染)                                            │
│  root.render(<BlogPost {...props} />)                           │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  更新浏览器 URL                                                    │
│  window.history.pushState({}, '', '/blog/1')                    │
└──────────────────────────────┘
              ↓
    ✅ 页面无刷新更新!
```

**关键优势**：
- ⚡ 无完整页面重载
- 🎯 只获取 JSON 数据（不是 HTML）
- 💾 缓存响应，实现即时前进/后退
- 🔄 平滑过渡

> 详见 `MINI_NEXTJS_ARCHITECTURE.md` 了解实现细节

## 📖 学习路径

1. **运行项目** - 体验基本功能
2. **阅读架构文档** - `MINI_NEXTJS_ARCHITECTURE.md`
3. **追踪请求流程** - 使用 DevTools 观察 SSR/SSG
4. **理解构建过程** - 检查 `.next/` 输出文件
5. **理解客户端导航** - 观察控制台日志
6. **修改和实验** - 添加新页面，修改逻辑

**实验建议**：
- 添加新的 SSG 页面
- 创建嵌套动态路由 `/products/[brand]/[id]`
- 对比 SSR 和 SSG 的构建输出

## 🆚 与真实 Next.js 的对比

| 功能 | Mini Next.js | 真实 Next.js |
|------|-------------|-------------|
| 代码量 | ~700 行 | 500K+ 行 |
| 核心路由 | ✅ | ✅ + 中间件 + App Router |
| SSR/SSG | ✅ | ✅ + ISR + Streaming |
| 客户端路由 | ✅ 基础 | ✅ + 智能预取 |
| 嵌套动态路由 | ✅ | ✅ + Catch-all |
| 性能优化 | ⚠️ 基础 | ✅ Image/Font/Script 优化 |

> 详见 `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md`

## 💡 你将学到什么

**核心原理**：
- 文件系统路由如何映射到 URL
- SSR 和 SSG 实现的区别
- React 服务端渲染和客户端 hydration 机制
- SPA 客户端导航的工作原理

**技术栈**：TypeScript + Vite + Express + React 18 + ESM

---

## 🔷 TypeScript 特性

本项目展示了 Next.js 风格框架的 TypeScript 最佳实践：

### 类型安全的数据获取

```typescript
// 类型安全的 SSG
interface AboutProps {
  buildTime: string
  projectInfo: string
}

export async function getStaticProps(): Promise<GetStaticPropsResult<AboutProps>> {
  return {
    props: {
      buildTime: new Date().toISOString(),
      projectInfo: '教育性实现'
    }
  }
}

export default function About({ buildTime, projectInfo }: AboutProps) {
  return <div>{buildTime}</div>  // ✅ 完全类型化!
}
```

### 类型安全的动态路由

```typescript
// 类型安全的参数提取
interface BlogPostProps {
  category: string
  id: string
  title: string
}

export async function getStaticProps({
  params
}: GetStaticPropsContext): Promise<GetStaticPropsResult<BlogPostProps>> {
  // params 是 Record<string, string>
  const { category, id } = params

  return {
    props: {
      category,  // ✅ 类型检查
      id,
      title: `${category} 文章 ${id}`
    }
  }
}
```

### 类型安全的路由器

```typescript
// 带类型化事件的客户端路由器
const router = useRouter()

router.on('routeChangeStart', (url: string) => {
  console.log('导航到:', url)
})

router.on('routeChangeComplete', (url: string) => {
  console.log('导航完成:', url)
})
```

### 核心类型定义

所有类型集中在 `types/index.ts`:

```typescript
// 页面模块结构
interface PageModule<T = any> {
  default: React.ComponentType<T>
  getStaticProps?: (context: GetStaticPropsContext) => Promise<GetStaticPropsResult<T>>
  getServerSideProps?: (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<T>>
  getStaticPaths?: () => Promise<GetStaticPathsResult>
}

// 路由匹配
interface Route {
  page: string
  routePath: string
  pattern: string
  paramNames: string[]
  renderType: 'SSG' | 'SSR' | 'STATIC'
}

// 还有更多...
```

**优势**：
- 🎯 所有 props 和函数的 IntelliSense
- 🛡️ 编译时错误检测
- 📝 自文档化代码
- 🔄 安全重构

## 📝 教育性说明

这是一个**教育项目**，专注于核心概念，省略了生产环境的复杂性：
- ✅ 完整的 TypeScript 支持和严格类型检查
- ❌ 没有图片/字体优化
- ❌ 没有 HMR（热模块替换）
- ❌ 没有 ISR（增量静态再生）
- ❌ 没有 App Router / 中间件
- ❌ 没有全面的错误处理

**目标**：用最少的类型安全代码理解 Next.js 核心机制

## 📚 参考文档

- **架构**：[MINI_NEXTJS_ARCHITECTURE.md](./MINI_NEXTJS_ARCHITECTURE.md) - 详细技术架构
- **性能**：[NEXTJS_PERFORMANCE_OPTIMIZATIONS.md](./NEXTJS_PERFORMANCE_OPTIMIZATIONS.md) - Next.js 优化对比

## 📄 许可证

MIT

---

**祝学习愉快! 🎉**

通过理解核心原理，为学习和使用 Next.js 打下坚实基础。
