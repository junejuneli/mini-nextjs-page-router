# Mini Next.js Page Router

> 一个约 700 行代码的简化版 Next.js Page Router 实现，用于深入理解 Next.js 的核心架构和工作原理。

中文文档 | [English](./README_EN.md)

## 🎯 学习目标

通过简易代码实现 Next.js Page Router 核心功能，理解现代 SSR 框架的工作原理：

- ✅ 基于文件系统的路由系统
- ✅ SSR（服务端渲染）和 SSG（静态生成）
- ✅ React 服务端渲染和客户端hydrate
- ✅ 数据获取 API（getStaticProps、getServerSideProps、getStaticPaths）
- ✅ 客户端路由导航（SPA 体验）
- ✅ 嵌套动态路由（多级参数）

## 📁 核心目录

```
demo/
├── build/          # 构建系统 (扫描页面、生成路由、预渲染)
├── server/         # 服务端 (HTTP 服务器、路由匹配、SSR/SSG 渲染)
├── client/         # 客户端 (hydrate、路由器、Link 组件)
├── pages/          # 页面目录 (自动映射为路由)
└── .next/          # 构建输出
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

> 点击链接 - 客户端路由（无刷新）

## 💡 核心概念速览

### SSR（服务端渲染）
```jsx
// pages/index.jsx - 每次请求时运行
export async function getServerSideProps() {
  return { props: { data: await fetchData() } }
}
```

### SSG（静态生成）
```jsx
// pages/about.jsx - 构建时运行一次
export async function getStaticProps() {
  return { props: { data: await fetchData() } }
}
```

### 动态路由
```jsx
// pages/blog/[id].jsx
export async function getStaticPaths() {
  return { paths: [{ params: { id: '1' } }] }
}
```

### 嵌套动态路由 ✨
```jsx
// pages/blog/[category]/[id].jsx
export async function getStaticPaths() {
  return {
    paths: [{ params: { category: 'tech', id: '1' } }]
  }
}
```

### 客户端导航
```jsx
import Link from '../client/link.jsx'

<Link href="/about">About</Link>  // 无刷新导航
```

## 🔍 工作原理

### 构建流程
```
扫描 pages/ → 生成路由 → Vite 构建 → 预渲染 SSG → 保存 manifest.json
```

### 服务器处理
```
请求 → 路由匹配 → SSG (读文件) / SSR (动态渲染) → 返回 HTML
```

### 客户端hydrate
```
读取 __NEXT_DATA__ → 动态加载组件 → hydrateRoot → 附加事件
```

### 客户端导航
```
Link 点击 → fetch JSON → 加载组件 → 更新 DOM → pushState
```

> 详细说明见 `MINI_NEXTJS_ARCHITECTURE.md`

## 📖 学习路径

1. **运行项目** - 体验基本功能
2. **阅读架构文档** - `MINI_NEXTJS_ARCHITECTURE.md`
3. **追踪请求流程** - 开发者工具观察 SSR/SSG
4. **理解构建流程** - 查看 `.next/` 输出文件
5. **理解客户端导航** - 观察控制台日志
6. **修改和实验** - 添加新页面、修改逻辑

**实验建议**：
- 添加新的 SSG 页面
- 创建嵌套动态路由 `/products/[brand]/[id]`
- 对比 SSR 和 SSG 的构建输出

## 🆚 与真实 Next.js 对比

| 特性 | Mini Next.js | 真实 Next.js |
|------|--------------|--------------|
| 代码量 | ~700 行 | ~50 万行+ |
| 核心路由 | ✅ | ✅ + 中间件 + App Router |
| SSR/SSG | ✅ | ✅ + ISR + Streaming |
| 客户端路由 | ✅ 基础 | ✅ + 智能预取 |
| 嵌套动态路由 | ✅ | ✅ + Catch-all |
| 性能优化 | ⚠️ 基础 | ✅ 图片/字体/脚本优化 |

> 详细对比见 `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md`

## 💡 学习收获

**理解核心原理**：
- 文件系统路由如何映射到 URL
- SSR/SSG 的区别和实现方式
- React 服务端渲染和客户端hydrate机制
- SPA 客户端导航的实现原理

**技术栈**：Vite + Express + React 18 + ESM

## 📝 教学说明

这是**教学项目**，专注于核心概念，省略了生产环境的复杂性：
- ❌ 无图片/字体优化
- ❌ 无 HMR（热更新）
- ❌ 无 ISR（增量静态再生）
- ❌ 无 App Router / Middleware
- ❌ 无 TypeScript / 完善的错误处理

**目标**：用最少代码理解 Next.js 核心机制

## 📚 参考文档

- **架构说明**：[MINI_NEXTJS_ARCHITECTURE.md](./MINI_NEXTJS_ARCHITECTURE.md) - 详细技术架构和实现原理
- **性能优化**：[NEXTJS_PERFORMANCE_OPTIMIZATIONS.md](./NEXTJS_PERFORMANCE_OPTIMIZATIONS.md) - Next.js 性能优化对比与实现建议

## 📄 许可证

MIT

---

**Happy Learning! 🎉**

通过这个项目理解 Next.js 核心原理，为深入学习和使用 Next.js 打下坚实基础。
