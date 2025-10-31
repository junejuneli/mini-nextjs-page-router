# Mini Next.js Page Router

> A minimal ~700-line implementation of Next.js Page Router for learning the core architecture and principles.

English | [中文文档](./README_CN.md)

## 🎯 Learning Goals

Understand how modern SSR frameworks work through a simplified Next.js Page Router implementation:

- ✅ File-system based routing
- ✅ SSR (Server-Side Rendering) and SSG (Static Site Generation)
- ✅ React server rendering and client-side hydration
- ✅ Data fetching APIs (getStaticProps, getServerSideProps, getStaticPaths)
- ✅ Client-side routing (SPA experience)
- ✅ Nested dynamic routes (multi-level parameters)

## 📁 Core Structure

```
demo/
├── build/          # Build system (scan pages, generate routes, pre-render)
├── server/         # Server (HTTP server, route matching, SSR/SSG rendering)
├── client/         # Client (hydration, router, Link component)
├── pages/          # Pages directory (auto-mapped to routes)
└── .next/          # Build output
```

**Documentation**:
- `MINI_NEXTJS_ARCHITECTURE.md` - Detailed architecture
- `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md` - Next.js performance optimizations comparison

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build project
npm run build

# 3. Start server
npm start
```

Visit http://localhost:3000

**Features to try**:
- `/` - SSR (data updates on each refresh)
- `/about` - SSG (pre-rendered static page)
- `/blog/tech/1` - Nested dynamic route

> Click links to experience client-side navigation (no page refresh)

## 💡 Core Concepts

### SSR (Server-Side Rendering)
```jsx
// pages/index.jsx - Runs on each request
export async function getServerSideProps() {
  return { props: { data: await fetchData() } }
}
```

### SSG (Static Site Generation)
```jsx
// pages/about.jsx - Runs once at build time
export async function getStaticProps() {
  return { props: { data: await fetchData() } }
}
```

### Dynamic Routes
```jsx
// pages/blog/[id].jsx
export async function getStaticPaths() {
  return { paths: [{ params: { id: '1' } }] }
}
```

### Nested Dynamic Routes ✨
```jsx
// pages/blog/[category]/[id].jsx
export async function getStaticPaths() {
  return {
    paths: [{ params: { category: 'tech', id: '1' } }]
  }
}
```

### Client-Side Navigation
```jsx
import Link from '../client/link.jsx'

<Link href="/about">About</Link>  // No page refresh
```

## 🔍 How It Works

### Build Process
```
Scan pages/ → Generate routes → Vite build → Pre-render SSG → Save manifest.json
```

### Server Request Handling
```
Request → Route matching → SSG (read file) / SSR (dynamic render) → Return HTML
```

### Client Hydration
```
Read __NEXT_DATA__ → Load component → hydrateRoot → Attach events
```

### Client-Side Navigation
```
Link click → Fetch JSON → Load component → Update DOM → pushState
```

> See `MINI_NEXTJS_ARCHITECTURE.md` for details

## 📖 Learning Path

1. **Run the project** - Experience basic features
2. **Read architecture docs** - `MINI_NEXTJS_ARCHITECTURE.md`
3. **Trace request flow** - Use DevTools to observe SSR/SSG
4. **Understand build process** - Check `.next/` output files
5. **Understand client navigation** - Watch console logs
6. **Modify and experiment** - Add new pages, modify logic

**Experiment suggestions**:
- Add new SSG pages
- Create nested dynamic routes `/products/[brand]/[id]`
- Compare SSR and SSG build outputs

## 🆚 Comparison with Real Next.js

| Feature | Mini Next.js | Real Next.js |
|---------|--------------|--------------|
| Code size | ~700 lines | 500K+ lines |
| Core routing | ✅ | ✅ + Middleware + App Router |
| SSR/SSG | ✅ | ✅ + ISR + Streaming |
| Client routing | ✅ Basic | ✅ + Smart prefetching |
| Nested dynamic routes | ✅ | ✅ + Catch-all |
| Performance | ⚠️ Basic | ✅ Image/Font/Script optimization |

> See `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md` for details

## 💡 What You'll Learn

**Core Principles**:
- How file-system routing maps to URLs
- Difference between SSR and SSG implementations
- React server rendering and client hydration mechanism
- How SPA client-side navigation works

**Tech Stack**: Vite + Express + React 18 + ESM

## 📝 Educational Note

This is an **educational project** focused on core concepts, omitting production complexities:
- ❌ No image/font optimization
- ❌ No HMR (Hot Module Replacement)
- ❌ No ISR (Incremental Static Regeneration)
- ❌ No App Router / Middleware
- ❌ No TypeScript / comprehensive error handling

**Goal**: Understand Next.js core mechanics with minimal code

## 📚 Reference Documentation

- **Architecture**: [MINI_NEXTJS_ARCHITECTURE.md](./MINI_NEXTJS_ARCHITECTURE.md) - Detailed technical architecture
- **Performance**: [NEXTJS_PERFORMANCE_OPTIMIZATIONS.md](./NEXTJS_PERFORMANCE_OPTIMIZATIONS.md) - Next.js optimization comparison

## 📄 License

MIT

---

**Happy Learning! 🎉**

Build a solid foundation for learning and using Next.js by understanding its core principles.
