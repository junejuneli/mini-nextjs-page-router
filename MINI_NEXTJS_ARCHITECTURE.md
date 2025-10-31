# Mini Next.js Page Router 架构文档

> 简易实现 Next.js Page Router 核心原理

---

## 项目结构

```
mini-nextjs/
├── build/                    # 构建系统
│   ├── index.js             # 构建入口，协调流程
│   ├── scan-pages.js        # 扫描 pages 目录
│   ├── generate-routes.js   # 生成路由清单
│   └── render-static.js     # 预渲染 SSG 页面
│
├── server/                   # 服务端运行时
│   ├── index.js             # Express HTTP 服务器
│   ├── router.js            # 路由匹配器
│   ├── render-ssr.js        # SSR 渲染器
│   └── render-ssg.js        # SSG 文件服务
│
├── client/                   # 客户端运行时
│   ├── index.jsx            # hydrate + 导航入口
│   ├── router.jsx           # Router 类 + useRouter
│   └── link.jsx             # Link 组件
│
├── pages/                    # 页面目录（用户代码）
│   ├── index.jsx            # / (SSR 示例)
│   ├── about.jsx            # /about (SSG 示例)
│   ├── terms.jsx            # /terms (纯静态)
│   └── blog/
│       └── [id].jsx         # /blog/:id (动态路由 SSG)
│
├── .next/                    # 构建输出
│   ├── manifest.json        # 路由清单
│   └── static/
│       ├── *.html           # 预渲染的 HTML
│       ├── *.json           # 预渲染的数据
│       └── *.js             # 客户端 JS chunks
│
├── vite.config.js           # Vite 配置
└── package.json
```

---

## 核心架构

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Build System │────▶│ Server       │────▶│ Client       │
│ (构建时)      │     │ (运行时)      │     │ (浏览器)      │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │                    │
  扫描页面              路由匹配             hydrate + 导航
  生成路由              SSR/SSG              代码分割
  预渲染 HTML           注入数据              内存缓存
```

---

## 1. 构建系统 (Build)

### 核心流程

```javascript
// 1. 扫描 pages 目录
scanPages('pages/')
  → 识别文件：index.jsx, about.jsx, blog/[id].jsx
  → 转换路由：/, /about, /blog/:id

// 2. 生成路由清单
generateRoutes(pages)
  → manifest.json: { routes: [...], buildTime: '...' }

// 3. 构建客户端代码（Vite）
vite build
  → .next/static/client.js          (主入口 + React)
  → .next/static/index-xxx.js       (首页组件 chunk)
  → .next/static/about-xxx.js       (About 组件 chunk)
  → .next/static/_id_-xxx.js        (动态路由 chunk)

// 4. 预渲染 SSG 页面
for (route in manifest.routes) {
  if (route.hasGetServerSideProps) continue  // SSR 页面跳过

  // 调用 getStaticProps / getStaticPaths
  const props = await getStaticProps()

  // 渲染 HTML
  const html = ReactDOMServer.renderToString(<Page {...props} />)

  // 保存文件
  fs.writeFileSync(`${path}.html`, html)
  fs.writeFileSync(`${path}.json`, JSON.stringify(props))
}
```

### 渲染模式决策规则

#### 静态路由（如 `/about`）
| 导出函数 | 渲染模式 | 说明 |
|---------|---------|------|
| 无任何函数 | SSG（纯静态） | 构建时生成，无数据 |
| `getStaticProps` | SSG（带数据） | 构建时调用获取数据 |
| `getServerSideProps` | SSR | 每次请求时运行 |

#### 动态路由（如 `/blog/[id]`）
| 导出函数组合 | 渲染模式 | 行为 |
|------------|---------|------|
| `getStaticPaths` + `getStaticProps` | SSG | 构建时生成指定路径（常见） |
| `getStaticPaths`（无 `getStaticProps`）| SSG | 构建时生成，使用空 props |
| 仅 `getServerSideProps` | SSR | 每次请求动态渲染，**不需要** `getStaticPaths` |
| 无任何函数 | SSR（fallback） | 构建时跳过，运行时动态渲染 |

#### 关键规则
- ✅ **动态路由 + SSG**：必须有 `getStaticPaths`，`getStaticProps` 可选
- ✅ **动态路由 + SSR**：只需 `getServerSideProps`，不需要 `getStaticPaths`
- ❌ **不能混用**：同一页面不能同时导出 `getServerSideProps` 和 `getStaticPaths`

### Manifest 注入
```javascript
// 服务端将路由清单注入到 __NEXT_DATA__
const nextData = {
  page: '/',
  props: { pageProps: {...} },
  manifest: [  // ✅ 客户端路由映射
    { path: '/', componentPath: '/index.jsx', isDynamic: false },
    { path: '/blog/:id', componentPath: '/blog/[id].jsx', isDynamic: true }
  ]
}
```

---

## 2. 服务端运行时 (Server)

### 请求处理流程

```javascript
// 1. 接收请求
GET /blog/123

// 2. 路由匹配
matchRoute('/blog/123')
  → 找到路由：{ path: '/blog/:id', renderType: 'ssg' }
  → 提取参数：{ id: '123' }

// 3. 根据渲染类型处理
if (renderType === 'ssg') {
  // 读取预渲染的 HTML
  return fs.readFileSync('.next/static/blog/123.html')
}
else if (renderType === 'ssr') {
  // 动态渲染
  const props = await getServerSideProps({ params: { id: '123' } })
  const html = ReactDOMServer.renderToString(<Page {...props} />)
  return html
}

// 4. 客户端导航 API
if (req.query._next_data === '1') {
  // 返回 JSON 数据（不返回 HTML）
  return res.json({ pageProps, query, page })
}
```

### 双重响应模式
- **首次访问** → 返回完整 HTML（SEO + 首屏性能）
- **客户端导航** → 返回 JSON 数据（SPA 体验）

---

## 3. 客户端运行时 (Client)

### 3.1 首次加载（hydrate）

```javascript
// 1. 读取服务端注入的数据
const nextData = JSON.parse(document.getElementById('__NEXT_DATA__').textContent)

// 2. 使用 import.meta.glob 加载页面组件
const pageModules = import.meta.glob('../pages/**/*.jsx')
// Vite 构建时转换为：
// {
//   '../pages/index.jsx': () => import('./index-xxx.js'),
//   '../pages/about.jsx': () => import('./about-xxx.js')
// }

// 3. 根据 manifest 查找对应组件
const route = manifest.find(r => r.path === nextData.page)
const loader = pageModules[`../pages${route.componentPath}`]
const PageComponent = await loader()

// 4. React hydrate
const globalRoot = hydrateRoot(
  document.getElementById('__next'),
  <RouterProvider>
    <PageComponent {...nextData.props.pageProps} />
  </RouterProvider>
)
```

### 3.2 客户端导航

```javascript
// 用户点击 Link
<Link href="/about">关于</Link>

// 1. 拦截点击事件
onClick(e) {
  e.preventDefault()
  router.push('/about')
}

// 2. 获取数据（带缓存）
fetchPageData('/about')
  → 检查缓存：cache.has('/about') ? return cached
  → 检查进行中的请求：prefetchPromises.has('/about') ? await promise
  → 发起请求：fetch('/about?_next_data=1').then(json)
  → 缓存结果：cache.set('/about', { data, timestamp })

// 3. 加载页面组件
const route = manifest.find(r => r.path === '/about')
const loader = pageModules['../pages/about.jsx']
const PageComponent = await loader()  // 代码分割，按需加载

// 4. 更新 DOM（复用 root）
globalRoot.render(
  <RouterProvider>
    <PageComponent {...data.pageProps} />
  </RouterProvider>
)

// 5. 更新浏览器 URL
window.history.pushState({}, '', '/about')
```

### 3.3 预取优化

```javascript
// 鼠标悬停 Link
<Link href="/about" prefetch={true}>

onMouseEnter() {
  router.prefetch('/about')  // 后台预取数据
}

// 预取机制
prefetch(url) {
  fetchPageData(url)  // 使用同一个缓存系统
    → 如果已缓存 → 直接返回
    → 如果正在请求 → 等待同一个 Promise
    → 否则 → 发起新请求并缓存
}

// 点击时瞬间导航
onClick() {
  router.push('/about')  // 使用预取的缓存数据，0 延迟
}
```

### 关键实现

**Global Root 复用**：
```javascript
// ✅ 正确：整个应用生命周期只创建一次
let globalRoot = hydrateRoot(...)  // 首次hydrate
globalRoot.render(...)             // 导航时复用

// ❌ 错误：每次导航都创建新 root
createRoot(...).render(...)  // 丢失状态，内存泄漏
```

**缓存策略**：
```javascript
class Router {
  cache = new Map()              // 数据缓存
  prefetchPromises = new Map()   // 请求去重

  fetchPageData(url) {
    if (cache.has(url)) return cached        // 命中缓存
    if (prefetchPromises.has(url)) return await promise  // 合并请求
    // 发起新请求...
  }
}
```

**代码分割**：
- Vite 的 `import.meta.glob()` 在构建时转换为静态映射
- 每个页面编译为独立 chunk
- 导航时按需加载

---

## 4. 数据获取 API

### getStaticProps (SSG)
```javascript
// 构建时执行
export async function getStaticProps(context) {
  const data = await fetchData()
  return { props: { data } }
}
```

### getServerSideProps (SSR)
```javascript
// 每次请求时执行
export async function getServerSideProps(context) {
  const { params, req, res, query } = context
  const data = await fetchData()
  return { props: { data } }
}
```

### getStaticPaths (Dynamic SSG)
```javascript
// 构建时执行，生成动态路由的所有路径
export async function getStaticPaths() {
  const paths = [
    { params: { id: '1' } },
    { params: { id: '2' } }
  ]
  return { paths }
}

// 为每个路径调用 getStaticProps
export async function getStaticProps({ params }) {
  const data = await fetchData(params.id)
  return { props: { data } }
}
```

---

## 5. 与真实 Next.js 对比

| 功能分类 | Mini Next.js | 真实 Next.js | 说明 |
|---------|-------------|--------------|------|
| **路由系统** |
| 文件系统路由 | ✅ | ✅ | |
| 动态路由 `[id]` | ✅ | ✅ | |
| 嵌套动态路由 `[cat]/[id]` | ✅ | ✅ | 已实现 ✨ |
| Catch-all `[...slug]` | ❌ | ✅ | 未实现 |
| Optional catch-all `[[...slug]]` | ❌ | ✅ | 未实现 |
| API 路由 `pages/api/*` | ❌ | ✅ | 未实现 |
| 路由组 (Route Groups) | ❌ | ✅ (App Router) | 未实现 |
| 中间件 (Middleware) | ❌ | ✅ | 未实现 |
| **渲染模式** |
| SSR (getServerSideProps) | ✅ | ✅ | |
| SSG (getStaticProps) | ✅ | ✅ | |
| 动态 SSG (getStaticPaths) | ✅ | ✅ | |
| ISR (Incremental Static Regeneration) | ❌ | ✅ | 未实现 `revalidate` |
| On-demand Revalidation | ❌ | ✅ | 未实现 `res.revalidate()` |
| Fallback 模式 | ❌ | ✅ | 未实现 `fallback: true/blocking` |
| Static by Default | ✅ | ✅ | |
| **布局与组件** |
| 自定义 _app.jsx | ❌ | ✅ | 未实现全局应用包裹 |
| 自定义 _document.jsx | ❌ | ✅ | 未实现自定义 HTML 结构 |
| Layout 组件 | ❌ | ✅ (App Router) | 未实现持久化布局 |
| Head 组件 | ❌ | ✅ | 未实现动态 meta 标签 |
| Script 组件 | ❌ | ✅ | 未实现脚本优化 |
| Image 组件 | ❌ | ✅ | 未实现图片优化 |
| **客户端路由** |
| Link 组件 | ✅ | ✅ | |
| router.push() | ✅ | ✅ | |
| router.replace() | ✅ | ✅ | |
| router.prefetch() | ✅ | ✅ | |
| router.back() / forward() | ❌ | ✅ | 未实现浏览器导航 |
| router.reload() | ❌ | ✅ | 未实现页面刷新 |
| router.events | ⚠️ | ✅ | 部分实现（3个事件） |
| Shallow Routing | ❌ | ✅ | 未实现浅层路由 |
| 滚动位置恢复 | ❌ | ✅ | 未实现 |
| **性能优化** |
| 代码分割 | ✅ | ✅ | 使用 Vite/Webpack |
| 预取 (Prefetch) | ✅ | ✅ | |
| 内存缓存 | ✅ | ✅ | |
| 请求去重 | ✅ | ✅ | |
| 缓存过期策略 | ❌ | ✅ | 未实现 Stale-While-Revalidate |
| 视口内自动预取 | ❌ | ✅ | 未实现 IntersectionObserver |
| 资源预加载提示 | ❌ | ✅ | 未实现 `<link rel="preload">` |
| Fast Refresh (HMR) | ❌ | ✅ | 未实现开发热更新 |
| **开发体验** |
| 开发服务器 | ❌ | ✅ | 未实现 dev 模式 |
| TypeScript 支持 | ❌ | ✅ | 未实现 |
| ESLint 集成 | ❌ | ✅ | 未实现 |
| 错误边界 | ❌ | ✅ | 未实现 `pages/_error.jsx` |
| 自定义 404 页面 | ❌ | ✅ | 未实现 `pages/404.jsx` |
| **样式方案** |
| CSS Modules | ❌ | ✅ | 未实现 |
| Sass 支持 | ❌ | ✅ | 未实现 |
| CSS-in-JS | ⚠️ | ✅ | 可自行集成 |
| Tailwind CSS | ⚠️ | ✅ | 可自行集成 |
| **其他功能** |
| 国际化 (i18n) | ❌ | ✅ | 未实现多语言路由 |
| 环境变量 | ❌ | ✅ | 未实现 `.env` 支持 |
| Preview Mode | ❌ | ✅ | 未实现草稿预览 |
| 重定向 & 重写 | ❌ | ✅ | 未实现 `next.config.js` 配置 |
| Base Path | ❌ | ✅ | 未实现子路径部署 |
| Asset Prefix (CDN) | ❌ | ✅ | 未实现 CDN 配置 |
| **构建工具** |
| Webpack | ❌ | ✅ (默认) | 使用 Vite 替代 |
| Turbopack | ❌ | ✅ (可选) | 未实现 |
| SWC | ❌ | ✅ | 未实现（使用 ESBuild） |

**统计**：
- ✅ **已实现**：17 项核心功能
- ⚠️ **部分实现**：3 项
- ❌ **未实现**：44+ 项高级功能

---

## 6. 学习建议

### 理解核心概念
1. **渲染时机**：构建时 vs 运行时 vs 客户端
2. **数据流向**：服务端 → `__NEXT_DATA__` → 客户端
3. **hydrate过程**：静态 HTML → 交互式 React 应用
4. **代码分割**：`import.meta.glob` + 按需加载

### 代码阅读顺序
1. `build/index.js` - 理解构建流程
2. `server/index.js` - 理解请求处理
3. `client/index.jsx` - 理解hydrate与导航
4. 实际运行项目，观察控制台日志

### 扩展方向
- 实现 `_app.jsx` 全局布局
- 添加 ISR (Incremental Static Regeneration)
- ~~支持嵌套动态路由~~ ✅ 已实现
- 实现 Catch-all 路由 `[...slug]`
- 实现 Optional Catch-all 路由 `[[...slug]]`
- 实现缓存过期策略
- 添加错误边界和 404 页面
- 实现 `router.back()` / `router.forward()`
- 支持滚动位置恢复

---

## 7. 核心原理总结

这个 Mini Next.js 用约 700 行代码实现了 Page Router 的核心机制：

**构建时 (Build Time)**：
```
扫描 pages/ 目录 → 生成路由清单 → Vite 构建客户端 → 预渲染 SSG 页面
```

**运行时 (Server Runtime)**：
```
接收请求 → 路由匹配 → SSR 动态渲染 / SSG 读取静态文件 → 返回 HTML/JSON
```

**客户端 (Client Runtime)**：
```
hydrate (Hydration) → 导航拦截 → 数据预取 → 缓存复用 → Root 复用渲染
```

通过这个简化实现，可以深入理解现代 SSR 框架的核心思想，为使用和定制真实的 Next.js 打下坚实基础。
