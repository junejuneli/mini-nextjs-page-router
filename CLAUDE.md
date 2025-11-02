# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a ~700-line educational implementation of Next.js Page Router that demonstrates core SSR/SSG concepts, written in TypeScript. It's designed for learning, not production use.

## Quick Start

```bash
# Build the project
npm run build

# Start server
npm start
```

Visit http://localhost:3000

## How to Continue Development

### 1. Adding New Pages

**SSG Page** (Static Site Generation):
```tsx
// pages/newpage.tsx
import type { GetStaticPropsResult } from '../types/index.js'

interface NewPageProps {
  data: string
}

export async function getStaticProps(): Promise<GetStaticPropsResult<NewPageProps>> {
  return { props: { data: 'Hello' } }
}

export default function NewPage({ data }: NewPageProps) {
  return <div>{data}</div>
}
```

**SSR Page** (Server-Side Rendering):
```tsx
// pages/dynamic.tsx
import type { GetServerSidePropsResult } from '../types/index.js'

interface DynamicProps {
  time: string
}

export async function getServerSideProps(): Promise<GetServerSidePropsResult<DynamicProps>> {
  return { props: { time: new Date().toISOString() } }
}

export default function Dynamic({ time }: DynamicProps) {
  return <div>{time}</div>
}
```

### 2. Adding Dynamic Routes

**Single-Level Dynamic Route**:
```tsx
// pages/blog/[id].tsx
import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from '../../types/index.js'

interface BlogPostProps {
  id: string
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  return {
    paths: [
      { params: { id: '1' } },
      { params: { id: '2' } }
    ],
    fallback: false
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext): Promise<GetStaticPropsResult<BlogPostProps>> {
  return { props: { id: params.id } }
}

export default function BlogPost({ id }: BlogPostProps) {
  return <div>Post {id}</div>
}
```

**Nested Dynamic Route**:
```tsx
// pages/blog/[category]/[id].tsx
import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from '../../../types/index.js'

interface NestedBlogPostProps {
  category: string
  id: string
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  return {
    paths: [
      { params: { category: 'tech', id: '1' } },
      { params: { category: 'design', id: '1' } }
    ],
    fallback: false
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext): Promise<GetStaticPropsResult<NestedBlogPostProps>> {
  const { category, id } = params
  return { props: { category, id } }
}

export default function NestedBlogPost({ category, id }: NestedBlogPostProps) {
  return <div>{category}/{id}</div>
}
```

### 3. Client-Side Navigation

```tsx
import Link from '../client/link.js'

<Link href="/about">About</Link>  // SPA navigation without page refresh
```

## How to Deepen Your Understanding

### Learning Path

1. **Run the Project and Experience Features**
   - `/` - SSR (data updates on each refresh)
   - `/about` - SSG (pre-rendered static page)
   - `/blog/1` - Dynamic route
   - `/blog/tech/1` - Nested dynamic route
   - Click links to observe client-side navigation

2. **Understand the Build Process**
   ```bash
   npm run build
   ```
   Observe:
   - Console output showing route scanning results
   - Route definitions in `.next/manifest.json`
   - Generated HTML and JSON files in `.next/static/`

3. **Understand Core Architecture**

   **Build System** (`build/`):
   - `scan-pages.ts` - Scans pages/ directory, extracts dynamic parameters
   - `generate-routes.ts` - Generates route rules and regex patterns
   - `render-static.ts` - Pre-renders SSG pages

   **Server** (`server/`):
   - `router.ts` - Route matching and parameter extraction
   - `render-ssr.tsx` - Dynamic SSR rendering
   - `render-ssg.ts` - Serves pre-rendered SSG files

   **Client** (`client/`):
   - `index.tsx` - Hydration and component loading
   - `router.tsx` - Client-side router
   - `link.tsx` - Link component with prefetching

4. **Experiment and Modify**
   - Add new SSG/SSR pages
   - Create multi-level nested dynamic routes
   - Modify client-side navigation logic
   - Check browser console logs

5. **Compare with Real Next.js**

   Read `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md` to understand:
   - Image optimization (Image component)
   - Script optimization (Script component)
   - ISR (Incremental Static Regeneration)
   - Streaming SSR
   - Smart prefetching
   - Code splitting optimizations

6. **Extend Functionality** (Optional)
   - Catch-all routes `[...slug]`
   - API Routes `/api/*`
   - Middleware system
   - Hot Module Replacement (HMR)
   - TypeScript support

### Key Technical Concepts

**Routing System**:
- File path → URL path mapping
- Regex matching and parameter extraction
- `[param]` syntax converts to `:param`

**SSR vs SSG**:
- SSR: Renders on each request, real-time data
- SSG: Pre-renders at build time, fastest response
- Choose based on: data update frequency and performance needs

**React Hydration**:
- Server generates static HTML
- Client "attaches" event listeners
- `hydrateRoot()` reuses existing DOM nodes

**Client-Side Navigation**:
- `Link` component intercepts clicks
- Fetches JSON data
- Dynamically loads components
- Updates DOM without page refresh

### Technical Constraints

- Vite's `import.meta.glob()` requires literal string patterns
- All files use ESM (`import/export`) and TypeScript
- Dynamic routes require `getStaticPaths` to specify all paths
- `index.tsx` maps to directory path

### Reference Documentation

- `MINI_NEXTJS_ARCHITECTURE.md` - Detailed architecture
- `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md` - Next.js optimization comparison
- `NESTED_ROUTES_IMPLEMENTATION.md` - Nested routes implementation
- `README.md` - Project overview
