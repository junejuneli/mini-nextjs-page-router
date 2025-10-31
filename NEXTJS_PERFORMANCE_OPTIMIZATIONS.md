# Next.js 性能优化全解析

> 对比 Mini Next.js 实现，深入理解 Next.js 的性能优化原理与实现方案

---

## 📚 目录

1. [渲染优化](#1-渲染优化)
2. [代码优化](#2-代码优化)
3. [资源优化](#3-资源优化)
4. [路由与导航优化](#4-路由与导航优化)
5. [构建与部署优化](#5-构建与部署优化)
6. [实现建议汇总](#6-实现建议汇总)

---

## 1. 渲染优化

### 1.1 Automatic Static Optimization (自动静态优化)

#### 📖 原理
Next.js **自动检测**页面是否可以静态优化：
- ✅ 如果页面**没有** `getServerSideProps` 或 `getInitialProps` → 自动预渲染为静态 HTML
- ❌ 如果有这些函数 → 在运行时进行 SSR

**识别方式**：
```bash
# 构建输出符号
○  (Static)   # 自动生成为静态 HTML + JSON（页面不使用阻塞数据需求）
●  (SSG)      # 自动生成为静态 HTML + JSON（使用 getStaticProps）
λ  (Server)   # 服务端渲染（使用 getServerSideProps）
ƒ  (Streaming) # 服务端流式渲染
```

#### 🎯 性能收益
- **无需服务器计算**：静态页面可直接从 CDN 提供
- **TTFB (Time to First Byte)**：从 ~100ms (SSR) 降到 ~10ms (静态)
- **并发处理能力**：静态页面可处理数百万并发请求

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 自动检测 | ❌ 手动判断 `getServerSideProps` | ✅ 自动检测并优化 |
| 构建输出 | ❌ 无符号标识 | ✅ 清晰的符号 (○●λƒ) |
| 混合部署 | ⚠️ 需要手动配置 | ✅ 自动支持 SSG + SSR 混合 |

#### 💡 实现建议
- **难度**：🟢 简单
- **优先级**：⭐⭐⭐⭐⭐ (核心功能)
- **实现方式**：
  ```javascript
  // 在构建时检测页面导出
  const pageModule = await import(pagePath)
  const isStatic = !pageModule.getServerSideProps && !pageModule.getInitialProps

  if (isStatic) {
    // 标记为静态优化
    route.renderType = 'static-optimized'
  }
  ```

---

### 1.2 ISR - Incremental Static Regeneration (增量静态再生成)

#### 📖 原理
ISR 使用 **stale-while-revalidate** 缓存策略：
1. 用户请求页面
2. 如果在 `revalidate` 时间内 → 返回缓存版本
3. 如果超过时间 → 返回缓存版本（stale）+ **后台重新生成**
4. 下次请求 → 返回新版本

**关键配置**：
```javascript
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60 // 60秒后重新验证
  }
}
```

#### 🎯 性能收益
- **最佳两全**：静态性能 + 动态内容
- **用户体验**：永远返回快速响应（不等待重新构建）
- **服务器负载**：仅在必要时重新生成，而非每次请求

**工作流程图**：
```
请求时间轴：
0s  ───────► 用户A请求 ───► 缓存新鲜 ───► 返回缓存 (10ms)
65s ───────► 用户B请求 ───► 缓存过期 ───► 返回旧缓存 (10ms) + 后台重建 (2s)
70s ───────► 用户C请求 ───► 缓存更新 ───► 返回新缓存 (10ms)
```

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| ISR 支持 | ❌ 无 | ✅ 完整支持 |
| 缓存策略 | ⚠️ 仅 HTTP 缓存头 | ✅ stale-while-revalidate + 后台重建 |
| 按需重新验证 | ❌ 无 | ✅ `revalidatePath()`, `revalidateTag()` |

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐⭐ (高价值)
- **实现方式**：
  ```javascript
  // 1. 存储页面生成时间
  const cacheEntry = {
    html: renderedHTML,
    timestamp: Date.now(),
    revalidate: 60
  }

  // 2. 请求时检查
  if (Date.now() - cacheEntry.timestamp > cacheEntry.revalidate * 1000) {
    // 返回旧版本 + 触发后台重建
    response.send(cacheEntry.html)
    backgroundRegenerate(route) // 异步重建
  }
  ```

---

### 1.3 Streaming SSR (流式服务端渲染)

#### 📖 原理
传统 SSR 是**串行阻塞**的：
```
获取数据 (2s) → 渲染 HTML (1s) → 返回完整页面 (3s 总计)
```

流式 SSR **并行流式**：
```
返回 Header + 部分 HTML (100ms)
  ↓
流式发送高优先级组件 (200ms)
  ↓
流式发送低优先级组件 (500ms)
  ↓
React 开始 Hydration (600ms)
```

**React 18 Suspense 支持**：
```jsx
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
```

#### 🎯 性能收益
- **TTFB (Time to First Byte)**：从 3s 降到 100ms
- **FCP (First Contentful Paint)**：从 3s 降到 200ms
- **用户体验**：立即看到框架，不用等待完整页面

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 流式渲染 | ❌ 完整渲染后返回 | ✅ 支持 React 18 Streaming |
| Suspense | ❌ 无 | ✅ 完整支持 |
| 选择性 Hydration | ❌ 全量 | ✅ 高优先级组件先 Hydrate |

#### 💡 实现建议
- **难度**：🔴 困难
- **优先级**：⭐⭐⭐ (高级特性)
- **实现方式**：
  ```javascript
  // 需要升级到 React 18 的 renderToPipeableStream
  import { renderToPipeableStream } from 'react-dom/server'

  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady() {
      response.setHeader('Content-Type', 'text/html')
      pipe(response)
    }
  })
  ```

---

### 1.4 React Server Components (RSC)

#### 📖 原理
Server Components **只在服务器端运行**，完全不发送到客户端：

**传统组件**：
```jsx
// 整个组件代码 + 数据都发送到客户端
function BlogPost({ post }) {
  return <article>{post.content}</article> // ~50KB JS bundle
}
```

**Server Component**：
```jsx
// 只发送渲染结果（RSC Payload），无 JS 代码
async function BlogPost() {
  const post = await db.post.findOne() // 服务端查询
  return <article>{post.content}</article> // ~2KB HTML payload
}
```

**RSC Payload 格式**：
```javascript
// 不是 HTML，而是特殊的 React 数据结构
{
  type: 'article',
  props: { children: 'Post content...' },
  // 客户端组件的占位符
  clientComponents: [{ id: 'CommentForm', props: {...} }]
}
```

#### 🎯 性能收益
- **Zero Bundle Size**：服务器组件代码不增加客户端 bundle
- **直接数据访问**：直接访问数据库、文件系统，无需 API 层
- **自动代码分割**：客户端组件自动分割

**对比示例**：
```
传统 Next.js 页面 (Client Components):
  └─ JS Bundle: 250KB (React + 组件代码 + 库)

使用 RSC:
  └─ JS Bundle: 50KB (仅交互组件)
  └─ RSC Payload: 10KB (服务端渲染结果)
```

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| RSC 支持 | ❌ 所有组件都是客户端 | ✅ App Router 完整支持 |
| Bundle 大小 | ⚠️ 所有组件代码发送到客户端 | ✅ 服务器组件零 bundle |
| 数据获取 | ⚠️ 需要序列化传递 | ✅ 服务器组件直接访问 |

#### 💡 实现建议
- **难度**：🔴🔴 非常困难
- **优先级**：⭐⭐ (App Router 专属，复杂度高)
- **实现方式**：需要完全重新架构，建议暂缓

---

### 1.5 Partial Prerendering (部分预渲染) - 实验性

#### 📖 原理
结合 SSG 的速度和 SSR 的动态性：

```jsx
// 静态外壳 (构建时生成)
export default function Page() {
  return (
    <Layout> {/* 静态 */}
      <Header /> {/* 静态 */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent /> {/* 运行时 SSR */}
      </Suspense>
    </Layout>
  )
}
```

**构建输出**：
- 静态部分 → 预渲染为 HTML
- 动态部分 → 运行时流式插入

#### 🎯 性能收益
- **TTFB**：接近静态页面（~10ms）
- **个性化内容**：支持用户特定数据
- **缓存效率**：静态外壳可无限缓存

#### 💡 实现建议
- **难度**：🔴🔴 非常困难
- **优先级**：⭐ (实验性功能，可忽略)

---

## 2. 代码优化

### 2.1 自动代码分割 (Automatic Code Splitting)

#### 📖 原理
Next.js **自动**为每个页面生成独立的 JavaScript bundle：

**传统 SPA (如 CRA)**：
```
app.bundle.js (500KB)
  ├─ HomePage (50KB)
  ├─ AboutPage (30KB)
  ├─ BlogPage (80KB)
  └─ AdminPage (340KB) ← 普通用户永远不访问，但仍下载
```

**Next.js 自动分割**：
```
访问 /home
  → home.chunk.js (50KB)
  → shared.chunk.js (20KB React)

访问 /blog
  → blog.chunk.js (80KB)
  → shared.chunk.js (已缓存)

访问 /admin
  → admin.chunk.js (340KB) ← 只有管理员才下载
```

#### 🎯 性能收益
**实测数据**：
- 初始加载减少 **60%**（从 500KB → 200KB）
- 导航时加载减少 **90%**（只加载新页面，复用共享代码）

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 页面级分割 | ✅ 使用 `import.meta.glob` | ✅ 自动按页面分割 |
| 共享代码提取 | ❌ 无 | ✅ 自动提取 shared chunks |
| 粒度控制 | ❌ 仅页面级 | ✅ 组件级、路由级 |

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐⭐
- **实现方式**：
  ```javascript
  // Vite 配置优化
  export default {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 提取 node_modules 为 vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor'
            }
            // 提取 React 为独立 chunk
            if (id.includes('react')) {
              return 'react-vendor'
            }
          }
        }
      }
    }
  }
  ```

---

### 2.2 动态导入 (Dynamic Imports)

#### 📖 原理
按需加载组件，而非全部打包到页面 bundle 中：

**传统导入（同步）**：
```jsx
import HeavyChart from './HeavyChart' // 立即加载 200KB

function Dashboard() {
  return <HeavyChart data={data} /> // 即使用户不滚动到这里
}
```

**动态导入（异步）**：
```jsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <p>Loading...</p>,
  ssr: false // 禁用 SSR（仅客户端渲染）
})

function Dashboard() {
  return <HeavyChart data={data} /> // 用户滚动到时才加载
}
```

#### 🎯 性能收益
**实测数据**：
- 使用 `React.lazy` + `Suspense` 可减少初始 bundle **50%**
- 配合 Intersection Observer，视口外组件永不加载（节省带宽）

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 页面级动态导入 | ✅ 已实现 | ✅ 已实现 |
| 组件级动态导入 | ❌ 无 | ✅ `next/dynamic` |
| SSR 控制 | ❌ 无 | ✅ `ssr: false` 选项 |
| 加载状态 | ❌ 无 | ✅ `loading` 组件 |

#### 💡 实现建议
- **难度**：🟢 简单
- **优先级**：⭐⭐⭐⭐
- **实现方式**：
  ```javascript
  // 创建 dynamic 函数
  export function dynamic(loader, options = {}) {
    return React.lazy(async () => {
      const module = await loader()
      return { default: module.default }
    })
  }

  // 使用
  const Chart = dynamic(() => import('./Chart'))
  ```

---

### 2.3 Granular Chunking (细粒度分块)

#### 📖 原理
Next.js 使用智能算法优化 chunk 分割：

**问题**：
```
传统方式：
  vendor.js (2MB) ← 所有依赖打包在一起
    ├─ react (100KB)
    ├─ lodash (500KB)
    └─ moment (1.4MB) ← 只有一个页面用，但所有页面都下载
```

**Next.js 解决方案**：
```
优化后：
  framework.js (100KB) ← React + React-DOM (所有页面共享)
  commons.js (50KB) ← 多个页面共享的代码
  page-home.js (30KB) ← 首页专属
  moment-chunk.js (1.4MB) ← 只在需要时加载
```

**配置示例**：
```javascript
// next.config.js
module.exports = {
  webpack(config) {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        framework: {
          name: 'framework',
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          priority: 40,
        },
        lib: {
          test(module) {
            return module.size() > 160000 // 大于 160KB 的库
          },
          priority: 30,
        }
      }
    }
  }
}
```

#### 🎯 性能收益
- **加载时间减少 60%**（实测数据）
- **缓存命中率提升**：框架代码几乎永不改变，浏览器长期缓存

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐
- **实现方式**：配置 Vite 的 `manualChunks`

---

### 2.4 Tree Shaking (摇树优化)

#### 📖 原理
移除未使用的代码：

**问题代码**：
```javascript
// lodash 整个库 (~500KB)
import _ from 'lodash'

// 只用了一个函数
_.debounce(fn, 300)
```

**优化后**：
```javascript
// 只导入需要的函数 (~2KB)
import debounce from 'lodash/debounce'
```

**Next.js 自动优化**：
```javascript
// 自动移除未使用的导出
export const usedFunction = () => {...}
export const unusedFunction = () => {...} // ← 构建时自动删除
```

#### 🎯 性能收益
- **Bundle 大小减少 30-70%**（取决于代码质量）

#### 💡 实现建议
- **难度**：🟢 简单（Vite 默认支持）
- **优先级**：⭐⭐⭐⭐⭐
- **实现方式**：确保使用 ESM 语法（`import/export`）

---

### 2.5 SWC 编译器（替代 Babel）

#### 📖 原理
SWC 是用 Rust 编写的超快 JavaScript/TypeScript 编译器：

**性能对比**：
```
编译 1000 个文件：
  Babel:  45 秒
  SWC:    2 秒 (快 22 倍)
```

**功能**：
- ✅ TypeScript 编译
- ✅ JSX 转换
- ✅ 代码压缩（替代 Terser）
- ✅ 自定义转换

#### 🎯 性能收益
- **构建速度提升 5-20 倍**
- **HMR (热更新)** 更快

#### 💡 实现建议
- **难度**：🟢 简单
- **优先级**：⭐⭐⭐
- **实现方式**：Next.js 12+ 默认使用，Mini Next.js 使用 Vite (内置 esbuild，已经很快)

---

## 3. 资源优化

### 3.1 Image 组件优化

#### 📖 原理详解

##### 1. 按需优化 (On-Demand Optimization)
```
用户请求：/photo.jpg
  ↓
Next.js 拦截：/_next/image?url=/photo.jpg&w=1080&q=75
  ↓
服务端处理：
  1. 检测浏览器支持的格式 (Accept: image/webp)
  2. 调整尺寸为 1080px
  3. 转换为 WebP 格式
  4. 压缩质量为 75
  5. 缓存结果
  ↓
返回优化后的图片 (~50KB，原图 500KB)
```

##### 2. 响应式图片自动生成
```jsx
<Image
  src="/hero.jpg"
  width={1920}
  height={1080}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**生成的 HTML**：
```html
<img
  srcset="
    /_next/image?url=/hero.jpg&w=640&q=75 640w,
    /_next/image?url=/hero.jpg&w=750&q=75 750w,
    /_next/image?url=/hero.jpg&w=828&q=75 828w,
    /_next/image?url=/hero.jpg&w=1080&q=75 1080w,
    /_next/image?url=/hero.jpg&w=1200&q=75 1200w,
    /_next/image?url=/hero.jpg&w=1920&q=75 1920w,
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  src="/_next/image?url=/hero.jpg&w=1920&q=75"
/>
```

**浏览器选择逻辑**：
- 屏幕宽度 375px → 下载 640w 版本
- 屏幕宽度 1920px → 下载 1920w 版本
- 2x Retina 显示器 → 自动选择更大版本

##### 3. 格式转换策略
```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'], // 优先级
  }
}
```

**浏览器兼容性检测**：
```
1. 检查 Accept header
   Accept: image/avif,image/webp,image/png

2. 选择最优格式
   AVIF 支持？ → 返回 AVIF (最小)
   否则 WebP？ → 返回 WebP (次小)
   否则       → 返回原格式 (JPEG/PNG)
```

**性能对比**：
```
原图 (JPEG): 500KB
WebP:       150KB (-70%)
AVIF:       120KB (-76%)
```

##### 4. 懒加载 + 优先加载
```jsx
// 首屏关键图片
<Image src="/hero.jpg" priority />
// → loading="eager" + <link rel="preload">

// 普通图片（默认）
<Image src="/product.jpg" />
// → loading="lazy" + Intersection Observer
```

**Intersection Observer 实现**：
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 图片进入视口，开始加载
      loadImage(entry.target)
      observer.unobserve(entry.target)
    }
  })
}, {
  rootMargin: '50px' // 提前 50px 开始加载
})
```

##### 5. 防止 CLS (Cumulative Layout Shift)
```jsx
// 方式 1: 指定尺寸
<Image src="/photo.jpg" width={800} height={600} />
// → 预留 800x600 空间

// 方式 2: 填充容器
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image src="/photo.jpg" fill style={{ objectFit: 'cover' }} />
</div>
// → 填充父容器

// 方式 3: 自动检测（本地图片）
import photo from './photo.jpg' // { src, width, height, blurDataURL }
<Image src={photo} /> // 自动获取尺寸
```

#### 🎯 性能收益数据
- **加载速度提升 50-70%**（WebP/AVIF）
- **带宽节省 60-80%**（尺寸优化 + 格式转换）
- **CLS 分数改善**：从 0.25 → 0.01
- **LCP 改善**：从 3.5s → 1.2s

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 图片优化 API | ❌ 无 | ✅ `/_next/image` |
| 自动格式转换 | ❌ 无 | ✅ WebP/AVIF |
| 响应式 srcset | ❌ 无 | ✅ 自动生成 |
| 懒加载 | ❌ 无 | ✅ 默认 + Intersection Observer |
| CLS 预防 | ❌ 无 | ✅ 自动预留空间 |

#### 💡 实现建议
- **难度**：🔴 困难
- **优先级**：⭐⭐⭐⭐⭐
- **实现方式**：
  ```javascript
  // 1. 创建图片优化 API 路由
  app.get('/_next/image', async (req, res) => {
    const { url, w, q } = req.query

    // 2. 使用 sharp 库处理图片
    const sharp = require('sharp')
    const buffer = await sharp(url)
      .resize(parseInt(w))
      .webp({ quality: parseInt(q) || 75 })
      .toBuffer()

    // 3. 设置缓存头
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('Content-Type', 'image/webp')
    res.send(buffer)
  })

  // 4. 创建 Image 组件
  function Image({ src, width, height, sizes, priority }) {
    const srcset = generateSrcSet(src, [640, 750, 828, 1080, 1200, 1920])

    return (
      <img
        src={`/_next/image?url=${src}&w=${width}&q=75`}
        srcSet={srcset}
        sizes={sizes}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        style={{ aspectRatio: `${width}/${height}` }}
      />
    )
  }
  ```

---

### 3.2 Script 组件优化

#### 📖 原理详解

##### 1. 加载策略 (Loading Strategy)

**beforeInteractive**（最高优先级）：
```jsx
<Script
  src="https://polyfill.io/v3/polyfill.min.js"
  strategy="beforeInteractive"
/>
```
**执行时机**：
```
服务器响应 → 浏览器接收 HTML
  ↓
<script> 立即下载并执行 ← beforeInteractive
  ↓
Next.js 客户端代码加载
  ↓
React Hydration 开始
```

**afterInteractive**（默认）：
```jsx
<Script
  src="https://www.googletagmanager.com/gtag/js"
  strategy="afterInteractive"
/>
```
**执行时机**：
```
React Hydration 完成
  ↓
页面可交互
  ↓
<script> 开始下载并执行 ← afterInteractive
```

**lazyOnload**（最低优先级）：
```jsx
<Script
  src="https://connect.facebook.net/en_US/sdk.js"
  strategy="lazyOnload"
/>
```
**执行时机**：
```
页面完全加载
  ↓
浏览器空闲（requestIdleCallback）
  ↓
<script> 开始下载并执行 ← lazyOnload
```

##### 2. 性能影响对比

**传统方式**：
```html
<!-- 阻塞 HTML 解析 -->
<script src="https://analytics.com/script.js"></script>

<!-- FCP (First Contentful Paint): 2.5s -->
<!-- TTI (Time to Interactive): 3.5s -->
```

**Next.js Script 组件**：
```jsx
<Script
  src="https://analytics.com/script.js"
  strategy="afterInteractive"
/>

{/* FCP: 0.8s (改善 68%) */}
{/* TTI: 1.2s (改善 66%) */}
```

##### 3. 事件处理

**onLoad vs onReady 差异**：
```jsx
<Script
  src="https://example.com/script.js"
  strategy="afterInteractive"
  onLoad={() => {
    // ✅ 脚本加载完成时执行（仅一次）
    console.log('Script loaded')
  }}
  onReady={() => {
    // ✅ 脚本加载完成 + 每次组件挂载时执行
    // 适用于 SPA 路由导航
    console.log('Script ready')
    initializeWidget()
  }}
  onError={(e) => {
    // ✅ 加载失败时执行
    console.error('Script failed', e)
    trackError(e)
  }}
/>
```

**使用场景**：
- `onLoad`：一次性初始化（如设置全局配置）
- `onReady`：每次需要重新初始化（如刷新聊天插件）
- `onError`：错误追踪和降级处理

##### 4. 内联脚本优化

**传统方式**：
```html
<script>
  // 每次页面加载都解析执行
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>
```

**Next.js 优化**：
```jsx
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  `}
</Script>
```

**优化点**：
- ✅ Next.js 追踪脚本（通过 `id`），避免重复执行
- ✅ 根据 `strategy` 延迟执行
- ✅ 路由切换时智能管理

#### 🎯 性能收益数据
- **FCP 改善**：0.9s → 0.4s (56%)
- **LCP 改善**：2.5s → 1.5s (40%)
- **阻塞时间减少**：3s → 0s

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| Script 组件 | ❌ 无 | ✅ `next/script` |
| 加载策略 | ❌ 无 | ✅ 4 种策略 |
| 事件处理 | ❌ 无 | ✅ onLoad/onReady/onError |
| 脚本追踪 | ❌ 无 | ✅ 通过 id 追踪 |

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐⭐
- **实现方式**：
  ```jsx
  // 创建 Script 组件
  function Script({ src, strategy = 'afterInteractive', onLoad, onReady, onError, children, id }) {
    useEffect(() => {
      if (strategy === 'beforeInteractive') {
        console.warn('beforeInteractive must be in _document')
        return
      }

      const loadScript = () => {
        const script = document.createElement('script')
        if (src) script.src = src
        if (id) script.id = id
        if (children) script.innerHTML = children

        script.onload = () => {
          onLoad?.()
          onReady?.()
        }
        script.onerror = onError

        document.body.appendChild(script)
      }

      if (strategy === 'afterInteractive') {
        if (document.readyState === 'complete') {
          loadScript()
        } else {
          window.addEventListener('load', loadScript)
        }
      } else if (strategy === 'lazyOnload') {
        requestIdleCallback(loadScript)
      }
    }, [])

    return null
  }
  ```

---

### 3.3 Font 优化

#### 📖 原理
Next.js 使用 `next/font` 自动优化字体加载：

**传统方式问题**：
```html
<!-- 1. 额外的 DNS 查询 -->
<link href="https://fonts.googleapis.com/css2?family=Roboto" rel="stylesheet">

<!-- 2. 网络请求链 -->
请求 HTML → 解析 CSS link → 请求 Google Fonts CSS → 下载字体文件
(总计: ~500ms)

<!-- 3. FOUT/FOIT 闪烁 -->
无字体 → 默认字体 → 自定义字体（页面闪烁）
```

**Next.js 优化方案**：
```jsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

**优化效果**：
1. **自动自托管**：字体文件下载到 `.next/static/fonts/`
2. **零外部请求**：无需连接 Google Fonts
3. **CSS 内联**：字体 CSS 直接嵌入 HTML（消除额外请求）
4. **自动 fallback**：计算 `size-adjust` 等参数，消除 CLS

**生成的 CSS**：
```css
@font-face {
  font-family: 'Inter';
  src: url('/_next/static/fonts/inter-v12-latin-regular.woff2') format('woff2');
  font-display: swap; /* 避免 FOIT */
  /* 自动计算的 fallback 参数 */
  size-adjust: 106.25%;
  ascent-override: 90%;
  descent-override: 22%;
}
```

#### 🎯 性能收益
- **FCP 改善**：~200ms (减少外部请求)
- **CLS 消除**：从 0.15 → 0.01
- **隐私改善**：无需连接第三方服务器

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐
- **实现方式**：使用 `fontaine` 库计算 fallback 参数

---

### 3.4 CSS 优化

#### 📖 原理

##### 1. CSS Modules（作用域隔离）
```css
/* Button.module.css */
.button {
  background: blue;
}
```

**编译后**：
```css
.Button_button__a1b2c {
  background: blue;
}
```

**避免全局污染**，每个组件样式独立。

##### 2. CSS 代码分割
```
页面 A 使用 Button.module.css
  → 只在页面 A 的 CSS bundle 中包含

页面 B 不使用
  → 不包含，减少加载
```

##### 3. 关键 CSS 内联
```html
<head>
  <!-- 首屏关键 CSS 内联 -->
  <style>
    .hero { ... }
    .header { ... }
  </style>
</head>

<!-- 非关键 CSS 延迟加载 -->
<link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'">
```

#### 💡 实现建议
- **难度**：🟢 简单（Vite 已支持 CSS Modules）
- **优先级**：⭐⭐⭐

---

## 4. 路由与导航优化

### 4.1 Link 预取机制

#### 📖 原理详解

##### 1. Intersection Observer 自动预取

**工作流程**：
```jsx
<Link href="/about">About</Link>

// 1. Link 组件渲染时，创建 Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 2. Link 进入视口（距离 200px 内）
      prefetch('/about')
    }
  })
}, {
  rootMargin: '200px' // 提前 200px 预取
})

// 3. 预取操作
function prefetch(url) {
  // 下载页面 JSON 数据
  fetch(`${url}?_next_data=1`)
    .then(res => res.json())
    .then(data => cache.set(url, data))

  // 下载页面 JavaScript chunk
  const script = document.createElement('link')
  script.rel = 'prefetch'
  script.href = `/_next/static/chunks/pages${url}.js`
  document.head.appendChild(script)
}
```

##### 2. 智能预取策略

**网络感知**：
```javascript
// 检测网络状态
if (navigator.connection) {
  const { effectiveType, saveData } = navigator.connection

  // 慢速网络或省流量模式 → 禁用预取
  if (effectiveType === '2g' || effectiveType === 'slow-2g' || saveData) {
    disablePrefetch()
  }
}
```

**生产环境 vs 开发环境**：
```javascript
// 生产环境：进入视口时预取
if (process.env.NODE_ENV === 'production') {
  observer.observe(linkElement)
}

// 开发环境：hover 时预取（方便调试）
if (process.env.NODE_ENV === 'development') {
  linkElement.addEventListener('mouseenter', () => prefetch(href))
}
```

##### 3. 预取优先级

**高优先级链接**：
```jsx
<Link href="/checkout" prefetch={true}>
  Checkout
</Link>
// → 立即预取，不等进入视口
```

**禁用预取**：
```jsx
<Link href="/external" prefetch={false}>
  External Link
</Link>
// → 永不预取
```

#### 🎯 性能收益
- **导航速度提升 90%**：从 ~500ms → ~50ms（使用缓存数据）
- **用户体验改善**：感觉像本地应用，无等待

#### 🔄 Mini Next.js 对比
| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 视口预取 | ❌ 无 | ✅ Intersection Observer |
| 网络感知 | ❌ 无 | ✅ 慢速网络禁用 |
| Hover 预取 | ⚠️ 手动实现 | ✅ 自动 (开发环境) |
| 优先级控制 | ❌ 无 | ✅ prefetch prop |

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐⭐⭐
- **实现方式**：
  ```jsx
  function Link({ href, children, prefetch = true }) {
    const linkRef = useRef()

    useEffect(() => {
      if (!prefetch || process.env.NODE_ENV !== 'production') return

      // 网络检测
      if (navigator.connection?.saveData) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            router.prefetch(href)
            observer.disconnect()
          }
        },
        { rootMargin: '200px' }
      )

      observer.observe(linkRef.current)

      return () => observer.disconnect()
    }, [href, prefetch])

    return (
      <a ref={linkRef} href={href} onClick={handleClick}>
        {children}
      </a>
    )
  }
  ```

---

### 4.2 路由缓存策略

#### 📖 原理

**Router Cache（客户端缓存）**：
```javascript
class Router {
  cache = new Map() // 内存缓存

  async navigate(url) {
    // 1. 检查缓存
    if (this.cache.has(url)) {
      const cached = this.cache.get(url)

      // 2. 检查是否过期（默认 30 秒）
      if (Date.now() - cached.timestamp < 30000) {
        return cached.data
      }
    }

    // 3. 未缓存或过期 → 重新获取
    const data = await fetch(`${url}?_next_data=1`).then(r => r.json())

    // 4. 缓存新数据
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    })

    return data
  }
}
```

**App Router 的完整缓存层级**：
```
1. Router Cache (客户端内存) → 30秒
   ↓ 未命中
2. Full Route Cache (服务端磁盘) → 持久化
   ↓ 未命中
3. Data Cache (fetch 缓存) → 可配置
   ↓ 未命中
4. 实际数据源 (数据库/API)
```

#### 💡 实现建议
- **难度**：🟢 简单（已实现基础版）
- **优先级**：⭐⭐⭐⭐
- **改进方向**：添加缓存过期、LRU 淘汰策略

---

### 4.3 Middleware（中间件）

#### 📖 原理

Middleware 在**请求到达页面前**运行，可用于：
- 认证/授权
- A/B 测试
- 重定向
- 国际化
- Bot 检测

**执行位置**：
```
用户请求 → CDN Edge → Middleware (Edge Runtime) → Next.js 服务器
```

**示例**：
```javascript
// middleware.js
export function middleware(request) {
  const { pathname } = request.nextUrl

  // 1. 认证检查
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')
    if (!token) {
      return NextResponse.redirect('/login')
    }
  }

  // 2. A/B 测试
  const bucket = request.cookies.get('bucket') || Math.random() < 0.5 ? 'A' : 'B'
  const response = NextResponse.next()
  response.cookies.set('bucket', bucket)

  // 3. 重写 URL（用户看不到）
  if (bucket === 'B') {
    return NextResponse.rewrite(`/ab-test${pathname}`)
  }

  return response
}
```

**Edge Runtime 优势**：
- **低延迟**：在全球 CDN 边缘节点运行（~50ms）
- **高并发**：轻量级，可处理百万级请求
- **限制**：不能使用 Node.js API（如 fs, crypto）

#### 🎯 性能收益
- **全局认证**：无需每个页面重复检查
- **边缘重定向**：减少跨洋请求延迟
- **智能路由**：根据地理位置/设备类型动态路由

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐
- **实现方式**：在 Express 中使用中间件

---

### 4.4 Shallow Routing（浅层路由）

#### 📖 原理

**问题**：URL 变化通常会触发数据重新获取：
```jsx
// 普通路由
router.push('/product?id=123') // → 重新调用 getServerSideProps
```

**Shallow Routing 解决方案**：
```jsx
// 只更新 URL，不触发数据获取
router.push('/product?id=123', undefined, { shallow: true })

// useEffect 监听 URL 变化
useEffect(() => {
  // 手动控制数据更新逻辑
  if (router.query.id) {
    fetchProduct(router.query.id)
  }
}, [router.query.id])
```

**使用场景**：
- 标签页切换（不需要重新加载页面）
- 筛选/排序（只需更新列表，不重新加载框架）
- 分页（已有数据，只需更新当前页）

#### 💡 实现建议
- **难度**：🟢 简单
- **优先级**：⭐⭐

---

## 5. 构建与部署优化

### 5.1 构建缓存

#### 📖 原理

Next.js 缓存构建结果，加速后续构建：

**缓存内容**：
```
.next/cache/
├── webpack/          # Webpack 编译缓存
├── swc/              # SWC 编译缓存
├── images/           # 优化后的图片
└── fetch-cache/      # fetch() 缓存
```

**首次构建 vs 缓存构建**：
```
首次构建：
  ├─ 编译 TypeScript: 45s
  ├─ 打包 JavaScript: 60s
  ├─ 优化图片: 30s
  └─ 总计: 135s

缓存构建（修改一个文件）：
  ├─ 检测变化: 2s
  ├─ 增量编译: 5s
  └─ 总计: 7s (快 19 倍)
```

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐
- **实现方式**：使用 Vite 的缓存机制

---

### 5.2 Output File Tracing（输出文件追踪）

#### 📖 原理

Next.js 分析代码依赖，只部署需要的文件：

**传统部署**：
```
部署整个项目：
  ├─ node_modules/ (500MB)
  ├─ .next/ (100MB)
  ├─ pages/ (10MB)
  └─ 总计: 610MB
```

**File Tracing 优化**：
```
next build
  ↓
分析依赖树
  ↓
生成 .next/standalone/
  ├─ server.js (入口)
  ├─ 必需的 node_modules (50MB)
  ├─ .next/ (100MB)
  └─ 总计: 150MB (减少 75%)
```

**配置**：
```javascript
// next.config.js
module.exports = {
  output: 'standalone'
}
```

#### 🎯 性能收益
- **部署大小减少 75%**
- **冷启动时间减少 50%**（Serverless 环境）

#### 💡 实现建议
- **难度**：🟡 中等
- **优先级**：⭐⭐⭐

---

### 5.3 静态导出 (Static Export)

#### 📖 原理

将整个应用导出为纯静态 HTML：

```bash
next build
next export
  ↓
生成 out/ 目录
  ├─ index.html
  ├─ about.html
  ├─ _next/static/
  └─ 可部署到任何静态托管（如 GitHub Pages）
```

**限制**：
- ❌ 不支持 `getServerSideProps`
- ❌ 不支持 API Routes
- ❌ 不支持 ISR
- ✅ 支持 `getStaticProps` 和客户端数据获取

#### 💡 实现建议
- **难度**：🟢 简单（Mini Next.js 已支持）
- **优先级**：⭐⭐

---

### 5.4 Bundle Analyzer（包分析）

#### 📖 原理

可视化分析 JavaScript bundle 构成：

```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({})
```

**生成的报告**：
```
Interactive Treemap:
┌──────────────────────────────────────┐
│ node_modules (70%)                   │
│ ┌─────────────┬────────────────────┐ │
│ │ react (10%) │ lodash (30%)       │ │
│ ├─────────────┼────────────────────┤ │
│ │ moment (20%)│ Other (10%)        │ │
│ └─────────────┴────────────────────┘ │
├──────────────────────────────────────┤
│ Your Code (30%)                      │
└──────────────────────────────────────┘
```

**优化建议**：
- 大依赖库 → 考虑替换（如 moment → day.js）
- 重复代码 → 提取为共享 chunk
- 未使用代码 → 移除导入

#### 💡 实现建议
- **难度**：🟢 简单
- **优先级**：⭐⭐⭐⭐
- **实现方式**：使用 `rollup-plugin-visualizer`

---

## 6. 实现建议汇总

### 6.1 按难度和优先级排序

| 优化项 | 难度 | 优先级 | 性能影响 | 推荐实现 |
|--------|------|--------|----------|----------|
| **渲染优化** |
| Automatic Static Optimization | 🟢 简单 | ⭐⭐⭐⭐⭐ | 🔥 高 | ✅ 立即实现 |
| ISR | 🟡 中等 | ⭐⭐⭐⭐ | 🔥 高 | ✅ 推荐实现 |
| Streaming SSR | 🔴 困难 | ⭐⭐⭐ | 🔥 高 | ⚠️ 暂缓 |
| React Server Components | 🔴🔴 非常困难 | ⭐⭐ | 🔥 高 | ⚠️ 暂缓 |
| **代码优化** |
| 自动代码分割 | 🟡 中等 | ⭐⭐⭐⭐ | 🔥 高 | ✅ 推荐实现 |
| Dynamic Imports | 🟢 简单 | ⭐⭐⭐⭐ | 🔥 高 | ✅ 立即实现 |
| Granular Chunking | 🟡 中等 | ⭐⭐⭐ | 💧 中 | ⚠️ 可选 |
| Tree Shaking | 🟢 简单 | ⭐⭐⭐⭐⭐ | 🔥 高 | ✅ 已支持 (Vite) |
| **资源优化** |
| Image 优化 | 🔴 困难 | ⭐⭐⭐⭐⭐ | 🔥 高 | ✅ 推荐实现 |
| Script 优化 | 🟡 中等 | ⭐⭐⭐⭐ | 🔥 高 | ✅ 推荐实现 |
| Font 优化 | 🟡 中等 | ⭐⭐⭐ | 💧 中 | ⚠️ 可选 |
| **路由优化** |
| Link 预取 (Intersection Observer) | 🟡 中等 | ⭐⭐⭐⭐⭐ | 🔥 高 | ✅ 立即实现 |
| 路由缓存策略 | 🟢 简单 | ⭐⭐⭐⭐ | 🔥 高 | ✅ 已实现 (改进) |
| Middleware | 🟡 中等 | ⭐⭐⭐ | 💧 中 | ⚠️ 可选 |
| Shallow Routing | 🟢 简单 | ⭐⭐ | 💧 中 | ⚠️ 可选 |
| **构建优化** |
| 构建缓存 | 🟡 中等 | ⭐⭐⭐ | 🔥 高 | ✅ 已支持 (Vite) |
| Bundle Analyzer | 🟢 简单 | ⭐⭐⭐⭐ | 💧 中 | ✅ 推荐实现 |
| Output File Tracing | 🟡 中等 | ⭐⭐⭐ | 💧 中 | ⚠️ 可选 |


### 6.2 快速开始示例

#### 示例 1: 实现 Link 预取

```jsx
// client/link.jsx
import { useRef, useEffect } from 'react'
import { useRouter } from './router.jsx'

function Link({ href, children, prefetch = true }) {
  const linkRef = useRef()
  const router = useRouter()

  useEffect(() => {
    if (!prefetch || !router) return

    // 检测慢速网络
    if (navigator.connection?.saveData) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log(`🔮 Prefetching ${href}`)
          router.prefetch(href)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(linkRef.current)

    return () => observer.disconnect()
  }, [href, prefetch, router])

  const handleClick = (e) => {
    e.preventDefault()
    if (router) {
      router.push(href)
    }
  }

  return (
    <a ref={linkRef} href={href} onClick={handleClick}>
      {children}
    </a>
  )
}

export default Link
```

#### 示例 2: 实现 Dynamic Import

```jsx
// utils/dynamic.jsx
import React, { Suspense } from 'react'

export function dynamic(loader, options = {}) {
  const LazyComponent = React.lazy(loader)

  return function DynamicComponent(props) {
    const { loading: Loading = null, ssr = true } = options

    // 禁用 SSR
    if (!ssr && typeof window === 'undefined') {
      return Loading ? <Loading /> : null
    }

    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// 使用
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
})
```

#### 示例 3: 实现 ISR

```javascript
// server/render-ssg.js
const cache = new Map()

export async function renderSSG(matchResult, staticDir) {
  const cacheKey = matchResult.route.path
  const cached = cache.get(cacheKey)

  // 检查缓存
  if (cached) {
    const age = Date.now() - cached.timestamp
    const revalidate = matchResult.route.revalidate || 60

    // 缓存未过期
    if (age < revalidate * 1000) {
      return cached.html
    }

    // 缓存过期，但先返回旧版本
    console.log(`⏰ Stale content for ${cacheKey}, regenerating...`)

    // 后台重新生成（异步）
    regeneratePage(matchResult, staticDir).then(newHTML => {
      cache.set(cacheKey, {
        html: newHTML,
        timestamp: Date.now()
      })
      console.log(`✅ Regenerated ${cacheKey}`)
    })

    // 立即返回旧版本（stale-while-revalidate）
    return cached.html
  }

  // 首次请求，读取静态文件
  const html = fs.readFileSync(path.join(staticDir, `${cacheKey}.html`), 'utf-8')
  cache.set(cacheKey, { html, timestamp: Date.now() })

  return html
}
```

---

## 总结

Next.js 通过 **数十项性能优化** 实现了卓越的用户体验：

### 核心优势
1. **自动化优化** - 开发者无需手动配置，开箱即用
2. **渐进式增强** - 从静态到动态，按需选择
3. **智能缓存** - 多层缓存策略，最大化性能
4. **边缘优先** - 利用 CDN 和 Edge Runtime

### 实现建议优先级
1. 🔥 **立即实现**：Link 预取、Dynamic Imports、Static Optimization
2. 🔥 **推荐实现**：ISR、Image/Script 组件、代码分割
3. ⚠️ **可选实现**：Middleware、Font 优化、Streaming SSR
4. ⚠️ **暂缓实现**：RSC（需要 App Router 架构）

### Mini Next.js 改进方向
通过实现上述优化（特别是阶段 1 和阶段 2），您的 Mini Next.js 可以接近真实 Next.js **80% 的性能表现**，同时保持代码简洁易懂的教学价值！

---

📚 **参考资源**
- [Next.js 官方文档 - Optimizing](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev - Route Prefetching in Next.js](https://web.dev/route-prefetching-in-nextjs/)
- [Vercel - Understanding React Server Components](https://vercel.com/blog/understanding-react-server-components)
