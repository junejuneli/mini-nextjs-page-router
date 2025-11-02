# Mini Next.js Page Router

> A minimal ~700-line TypeScript implementation of Next.js Page Router for learning the core architecture and principles.

English | [中文文档](./README_CN.md)

## 🎯 Learning Goals

Understand how modern SSR frameworks work through a simplified Next.js Page Router implementation:

- ✅ File-system based routing
- ✅ SSR (Server-Side Rendering) and SSG (Static Site Generation)
- ✅ React server rendering and client-side hydration
- ✅ Data fetching APIs (getStaticProps, getServerSideProps, getStaticPaths)
- ✅ Client-side routing (SPA experience)
- ✅ Nested dynamic routes (multi-level parameters)

## 📁 Project Structure

```
mini-nextjs-page-router/
├── types/
│   └── index.ts              # TypeScript type definitions
├── build/
│   ├── index.ts              # Build orchestrator
│   ├── scan-pages.ts         # Page scanner (file → route mapping)
│   ├── generate-routes.ts    # Route manifest generator
│   └── render-static.ts      # SSG pre-rendering engine
├── server/
│   ├── index.ts              # Express HTTP server
│   ├── router.ts             # Route matching engine
│   ├── render-ssr.tsx        # Server-side rendering
│   └── render-ssg.ts         # Static file serving
├── client/
│   ├── index.tsx             # Client entry & hydration
│   ├── router.tsx            # Client-side router
│   └── link.tsx              # Link component with prefetch
├── pages/                    # Your pages (auto-routed)
│   ├── index.tsx             # / (SSR)
│   ├── about.tsx             # /about (SSG)
│   ├── terms.tsx             # /terms (SSG)
│   ├── blog/
│   │   ├── [id].tsx          # /blog/:id (Dynamic SSG)
│   │   └── [category]/
│   │       └── [id].tsx      # /blog/:category/:id (Nested Dynamic)
│   └── product/
│       └── [id].tsx          # /product/:id (Dynamic)
└── .next/                    # Build output
    ├── manifest.json         # Route manifest
    ├── static/               # Pre-rendered HTML/JSON + client bundles
    └── server/               # Server-side modules

**Key Files**:
- `tsconfig.json` - TypeScript configuration (strict mode)
- `vite.config.ts` - Vite build configuration
- `package.json` - Dependencies and scripts
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
- `/blog/1`, `/blog/2`, `/blog/3` - Dynamic routes
- `/product/1` - Dynamic route without getStaticProps

> Click links to experience client-side navigation (no page refresh)

### 🎬 What You'll See

**Homepage (SSR)** - `http://localhost:3000/`
```
🏠 Mini Next.js Page Router
Server Time: 2025-11-02T13:44:33.623Z  ← Updates on each refresh!
Visit Count: 1

Navigation Links:
→ About
→ Terms
→ Blog Posts
```

**About Page (SSG)** - `http://localhost:3000/about`
```
📖 About This Project
Build Time: 2025-11-02T13:40:11.712Z  ← Fixed at build time
Project Info: Educational implementation

This page was pre-rendered at build time!
```

**Blog Post (Dynamic SSG)** - `http://localhost:3000/blog/tech/1`
```
📝 Blog Post
Category: tech
ID: 1
Title: Understanding TypeScript Generics
Content: [Article content...]

← Back to Home
```

**Browser DevTools Console**:
```
[Mini Next.js] Hydration starting...
[Mini Next.js] Page: /about
[Mini Next.js] Props: { buildTime: "...", projectInfo: "..." }
[Mini Next.js] Loading component for /about
[Mini Next.js] Hydration complete!
[Router] Initialized with pathname: /about
```

**When You Click a Link** (Client-Side Navigation):
```
[Link] Navigating to /blog/1
[Router] Fetching page data: /blog/1?_next_data=1
[Router] Data received: {"props": {...}, "page": "/blog/:id"}
[Router] Loading component for /blog/:id
[Router] Rendering page component
[Router] Navigation complete!
✨ No page refresh - instant transition!
```

## 💡 Core Concepts

### SSR (Server-Side Rendering)
```tsx
// pages/index.tsx - Runs on each request
import type { GetServerSidePropsResult } from '../types/index.js'

export async function getServerSideProps(): Promise<GetServerSidePropsResult> {
  return { props: { data: await fetchData() } }
}
```

### SSG (Static Site Generation)
```tsx
// pages/about.tsx - Runs once at build time
import type { GetStaticPropsResult } from '../types/index.js'

export async function getStaticProps(): Promise<GetStaticPropsResult> {
  return { props: { data: await fetchData() } }
}
```

### Dynamic Routes
```tsx
// pages/blog/[id].tsx
import type { GetStaticPathsResult } from '../../types/index.js'

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  return { paths: [{ params: { id: '1' } }], fallback: false }
}
```

### Nested Dynamic Routes ✨
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

### Client-Side Navigation
```tsx
import Link from '../client/link.js'

<Link href="/about">About</Link>  // No page refresh
```

## 🔍 How It Works

### 1️⃣ Build Process (npm run build)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Build Pipeline                            │
└─────────────────────────────────────────────────────────────────┘

Step 1: Scan Pages Directory
pages/index.tsx        → Route: /            (SSR)
pages/about.tsx        → Route: /about       (SSG)
pages/blog/[id].tsx    → Route: /blog/:id    (Dynamic SSG)
              ↓
         [PageMetadata[]]

Step 2: Generate Route Manifest
{
  routes: [
    {
      page: '/blog/:id',
      pattern: '^/blog/([^/]+)$',    // Regex for matching
      paramNames: ['id'],
      renderType: 'SSG'
    },
    ...
  ]
}
              ↓
    manifest.json (route config)

Step 3: Build Client Bundle (Vite)
client/index.tsx  →  .next/static/client.js
pages/*.tsx       →  .next/static/[page].js (code splitting)
              ↓
    Client JavaScript bundles

Step 4: Pre-render SSG Pages
For each SSG route with getStaticProps:
  1. Import page module dynamically
  2. Call getStaticProps() → Get props data
  3. Render component to HTML string
  4. Inject data into <script id="__NEXT_DATA__">
  5. Save .html and .json files
              ↓
    .next/static/about.html + about.json
```

**Build Output**:
```
.next/
├── manifest.json              # Route definitions
├── static/
│   ├── client.js             # Client runtime (147KB)
│   ├── about.html            # Pre-rendered HTML
│   ├── about.json            # Page props data
│   ├── blog/1.html           # Dynamic routes pre-rendered
│   └── ...
```

---

### 2️⃣ Server Request Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP Request Flow                             │
└─────────────────────────────────────────────────────────────────┘

Browser Request: GET /blog/tech/1
              ↓
┌──────────────────────────────┐
│  Express Server (server/index.ts)                               │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  Route Matcher (server/router.ts)                              │
│  - Regex match against manifest                                 │
│  - Extract params: { category: 'tech', id: '1' }               │
└──────────────────────────────┘
              ↓
        Is SSG route?
         /        \
       Yes         No
        ↓           ↓
┌────────────────┐  ┌────────────────┐
│ render-ssg.ts  │  │ render-ssr.tsx │
│ Read HTML file │  │ Dynamic render │
│ from .next/    │  │ on each request│
└────────────────┘  └────────────────┘
        ↓               ↓
   Return HTML with embedded __NEXT_DATA__
        ↓
   Browser receives HTML
```

**SSG Route** (e.g., `/about`):
```typescript
// Reads pre-generated file
.next/static/about.html → Return to browser (⚡ Fast!)
```

**SSR Route** (e.g., `/` - index):
```typescript
// Renders on-demand
1. Import pages/index.tsx
2. Call getServerSideProps({ req, res })
3. renderToString(<IndexPage props={data} />)
4. Inject into HTML template with __NEXT_DATA__
5. Return fresh HTML (📊 Dynamic!)
```

---

### 3️⃣ Client Hydration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Initial Load                          │
└─────────────────────────────────────────────────────────────────┘

1. Browser receives HTML
   <div id="root">
     <h1>About Page</h1>  <!-- Server-rendered -->
   </div>
   <script id="__NEXT_DATA__">
     {"props": {"buildTime": "..."}, "page": "/about"}
   </script>
   <script src="/static/client.js"></script>

              ↓

2. client.js executes (client/index.tsx)
   - Parse __NEXT_DATA__ from HTML
   - Get page: "/about"
   - Get props: {buildTime: "..."}

              ↓

3. Dynamic Import
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
   ✨ React attaches event listeners to existing DOM!

              ↓

5. Setup Router
   - Initialize client-side router
   - Listen for link clicks
   - Ready for SPA navigation! 🚀
```

---

### 4️⃣ Client-Side Navigation (SPA)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client-Side Navigation                        │
└─────────────────────────────────────────────────────────────────┘

User clicks: <Link href="/blog/1">Blog Post 1</Link>
              ↓
┌──────────────────────────────┐
│  Link Component (client/link.tsx)                               │
│  - Prevent default <a> behavior                                 │
│  - Call router.push('/blog/1')                                  │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  Client Router (client/router.tsx)                              │
└──────────────────────────────┘
              ↓
    Is data cached?
      /      \
     Yes      No → Fetch: GET /blog/1?_next_data=1
      ↓       ↓
   Use cache  Server returns JSON:
              {
                "props": {"id": "1", "title": "..."},
                "page": "/blog/:id"
              }
              ↓
         Cache response
              ↓
┌──────────────────────────────┐
│  Dynamic Import Component                                        │
│  import('../pages/blog/[id].tsx')                               │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  Update DOM (React Render)                                       │
│  root.render(<BlogPost {...props} />)                           │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  Update Browser URL                                              │
│  window.history.pushState({}, '', '/blog/1')                    │
└──────────────────────────────┘
              ↓
    ✅ Page updated without refresh!
```

**Key Benefits**:
- ⚡ No full page reload
- 🎯 Only fetch JSON data (not HTML)
- 💾 Cache responses for instant back/forward
- 🔄 Smooth transitions

> See `MINI_NEXTJS_ARCHITECTURE.md` for implementation details

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

**Tech Stack**: TypeScript + Vite + Express + React 18 + ESM

---

## 🔷 TypeScript Features

This project showcases TypeScript best practices for Next.js-style frameworks:

### Type-Safe Data Fetching

```typescript
// Type-safe SSG
interface AboutProps {
  buildTime: string
  projectInfo: string
}

export async function getStaticProps(): Promise<GetStaticPropsResult<AboutProps>> {
  return {
    props: {
      buildTime: new Date().toISOString(),
      projectInfo: 'Educational implementation'
    }
  }
}

export default function About({ buildTime, projectInfo }: AboutProps) {
  return <div>{buildTime}</div>  // ✅ Fully typed!
}
```

### Type-Safe Dynamic Routes

```typescript
// Type-safe params extraction
interface BlogPostProps {
  category: string
  id: string
  title: string
}

export async function getStaticProps({
  params
}: GetStaticPropsContext): Promise<GetStaticPropsResult<BlogPostProps>> {
  // params is Record<string, string>
  const { category, id } = params

  return {
    props: {
      category,  // ✅ Type-checked
      id,
      title: `${category} Article ${id}`
    }
  }
}
```

### Type-Safe Router

```typescript
// Client-side router with typed events
const router = useRouter()

router.on('routeChangeStart', (url: string) => {
  console.log('Navigating to:', url)
})

router.on('routeChangeComplete', (url: string) => {
  console.log('Navigation complete:', url)
})
```

### Core Type Definitions

All types are centralized in `types/index.ts`:

```typescript
// Page module structure
interface PageModule<T = any> {
  default: React.ComponentType<T>
  getStaticProps?: (context: GetStaticPropsContext) => Promise<GetStaticPropsResult<T>>
  getServerSideProps?: (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<T>>
  getStaticPaths?: () => Promise<GetStaticPathsResult>
}

// Route matching
interface Route {
  page: string
  routePath: string
  pattern: string
  paramNames: string[]
  renderType: 'SSG' | 'SSR' | 'STATIC'
}

// And many more...
```

**Benefits**:
- 🎯 IntelliSense for all props and functions
- 🛡️ Compile-time error detection
- 📝 Self-documenting code
- 🔄 Safe refactoring

## 📝 Educational Note

This is an **educational project** focused on core concepts, omitting production complexities:
- ✅ Full TypeScript support with strict typing
- ❌ No image/font optimization
- ❌ No HMR (Hot Module Replacement)
- ❌ No ISR (Incremental Static Regeneration)
- ❌ No App Router / Middleware
- ❌ No comprehensive error handling

**Goal**: Understand Next.js core mechanics with minimal, type-safe code

## 📚 Reference Documentation

- **Architecture**: [MINI_NEXTJS_ARCHITECTURE.md](./MINI_NEXTJS_ARCHITECTURE.md) - Detailed technical architecture
- **Performance**: [NEXTJS_PERFORMANCE_OPTIMIZATIONS.md](./NEXTJS_PERFORMANCE_OPTIMIZATIONS.md) - Next.js optimization comparison

## 📄 License

MIT

---

**Happy Learning! 🎉**

Build a solid foundation for learning and using Next.js by understanding its core principles.
