# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a ~700-line educational implementation of Next.js Page Router that demonstrates core SSR/SSG concepts. It's designed for learning, not production use.

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
```jsx
// pages/newpage.jsx
export async function getStaticProps() {
  return { props: { data: 'Hello' } }
}
export default function NewPage({ data }) {
  return <div>{data}</div>
}
```

**SSR Page** (Server-Side Rendering):
```jsx
// pages/dynamic.jsx
export async function getServerSideProps() {
  return { props: { time: new Date().toISOString() } }
}
export default function Dynamic({ time }) {
  return <div>{time}</div>
}
```

### 2. Adding Dynamic Routes

**Single-Level Dynamic Route**:
```jsx
// pages/blog/[id].jsx
export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: '1' } },
      { params: { id: '2' } }
    ],
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  return { props: { id: params.id } }
}
```

**Nested Dynamic Route**:
```jsx
// pages/blog/[category]/[id].jsx
export async function getStaticPaths() {
  return {
    paths: [
      { params: { category: 'tech', id: '1' } },
      { params: { category: 'design', id: '1' } }
    ],
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const { category, id } = params
  return { props: { category, id } }
}
```

### 3. Client-Side Navigation

```jsx
import Link from '../client/link.jsx'

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
   - `scan-pages.js` - Scans pages/ directory, extracts dynamic parameters
   - `generate-routes.js` - Generates route rules and regex patterns
   - `render-static.js` - Pre-renders SSG pages

   **Server** (`server/`):
   - `router.js` - Route matching and parameter extraction
   - `render-ssr.js` - Dynamic SSR rendering
   - `render-ssg.js` - Serves pre-rendered SSG files

   **Client** (`client/`):
   - `index.jsx` - Hydration and component loading
   - `router.jsx` - Client-side router
   - `link.jsx` - Link component with prefetching

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
- All files use ESM (`import/export`)
- Dynamic routes require `getStaticPaths` to specify all paths
- `index.jsx` maps to directory path

### Reference Documentation

- `MINI_NEXTJS_ARCHITECTURE.md` - Detailed architecture
- `NEXTJS_PERFORMANCE_OPTIMIZATIONS.md` - Next.js optimization comparison
- `NESTED_ROUTES_IMPLEMENTATION.md` - Nested routes implementation
- `README.md` - Project overview
