/**
 * Core Type Definitions for Mini Next.js Page Router
 *
 * This file contains all the TypeScript type definitions used throughout the project.
 * It provides type safety for the routing system, data fetching, and React components.
 */

import type { Request, Response } from 'express'
import type { ComponentType } from 'react'

// ==================== Page Metadata Types ====================

/**
 * Metadata about a scanned page file
 * Generated during the build process by scanning the pages directory
 */
export interface PageMetadata {
  /** Absolute file path to the page component */
  filePath: string
  /** Route path pattern (e.g., /blog/:id) */
  routePath: string
  /** Original filename with extension */
  fileName: string
  /** Whether this is a dynamic route */
  isDynamic: boolean
  /** Names of dynamic parameters extracted from the route */
  paramNames: string[]
}

// ==================== Route Manifest Types ====================

/**
 * A single route definition in the manifest
 */
export interface Route {
  /** Route path pattern (e.g., /blog/:id) */
  path: string
  /** Absolute path to the page component file */
  componentPath: string
  /** Regex pattern string for matching URLs */
  pattern: string
  /** Names of dynamic parameters */
  paramNames: string[]
  /** Whether this is a dynamic route */
  isDynamic: boolean
  /** How this page is rendered (set during build) */
  renderType: 'ssg' | 'ssr' | null
  /** Static paths for dynamic routes (used for SSG) */
  staticPaths?: Array<{ params: Record<string, string> }>
}

/**
 * Complete route manifest generated during build
 */
export interface RouteManifest {
  /** List of all routes */
  routes: Route[]
  /** ISO timestamp of when the build occurred */
  buildTime: string
}

/**
 * Result of matching a URL to a route
 */
export interface MatchResult {
  /** The matched route definition */
  route: Route
  /** Extracted parameter values */
  params: Record<string, string>
}

// ==================== Next.js-style Data Fetching Types ====================

/**
 * Context object passed to getStaticProps
 */
export interface GetStaticPropsContext {
  /** Dynamic route parameters */
  params: Record<string, string>
}

/**
 * Return value from getStaticProps
 */
export interface GetStaticPropsResult<T = any> {
  /** Props to pass to the page component */
  props: T
}

/**
 * Context object passed to getServerSideProps
 */
export interface GetServerSidePropsContext {
  /** Express request object */
  req: Request
  /** Express response object */
  res: Response
  /** Dynamic route parameters */
  params: Record<string, string>
  /** Query string parameters */
  query: Record<string, string>
}

/**
 * Return value from getServerSideProps
 */
export interface GetServerSidePropsResult<T = any> {
  /** Props to pass to the page component */
  props: T
}

/**
 * Path definition for getStaticPaths
 */
export interface StaticPath {
  /** Parameter values for this path */
  params: Record<string, string>
}

/**
 * Return value from getStaticPaths
 */
export interface GetStaticPathsResult {
  /** List of paths to pre-render */
  paths: StaticPath[]
  /** Whether to fall back to SSR for non-pre-rendered paths */
  fallback: boolean
}

// ==================== Page Module Types ====================

/**
 * A page module with its component and optional data fetching functions
 */
export interface PageModule<P = any> {
  /** The React component to render */
  default: ComponentType<P>
  /** Static props function (called at build time) */
  getStaticProps?: (context: GetStaticPropsContext) => Promise<GetStaticPropsResult<P>>
  /** Server-side props function (called on each request) */
  getServerSideProps?: (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<P>>
  /** Static paths function (for dynamic routes) */
  getStaticPaths?: () => Promise<GetStaticPathsResult>
}

// ==================== Client-side Types ====================

/**
 * Client-side route manifest (simplified version)
 * Injected into __NEXT_DATA__ for client-side routing
 */
export interface ClientRoute {
  /** Route path pattern */
  path: string
  /** Relative path to component (e.g., /index.jsx, /blog/[id].jsx) */
  componentPath: string
  /** Whether this is a dynamic route */
  isDynamic: boolean
  /** Names of dynamic parameters */
  paramNames: string[]
}

/**
 * Data injected into the page via __NEXT_DATA__ script tag
 */
export interface NextData<P = any> {
  /** Page props object */
  props: { pageProps: P }
  /** Current page route */
  page: string
  /** Query/route parameters */
  query: Record<string, string>
  /** Build ID */
  buildId: string
  /** Client-side route manifest */
  manifest: ClientRoute[]
  /** Whether this is a getServerSideProps page */
  gssp?: boolean
}

/**
 * Client-side router state
 */
export interface RouterState {
  /** Current pathname */
  pathname: string
  /** Current query parameters */
  query: Record<string, string>
}

/**
 * Page data returned from API for client-side navigation
 */
export interface PageData<P = any> {
  /** Page props */
  pageProps: P
  /** Query/route parameters */
  query: Record<string, string>
  /** Page route */
  page: string
}

/**
 * Cached page data entry
 */
export interface CachedPageData<P = any> {
  /** The cached data */
  data: PageData<P>
  /** Timestamp when cached */
  timestamp: number
}

// ==================== Build Process Types ====================

/**
 * Result from rendering a static page
 */
export interface RenderResult {
  /** Whether the render was successful */
  success: boolean
  /** Number of pages rendered (for dynamic routes) */
  count?: number
  /** Type of SSG rendering */
  type?: 'ssg-pure' | 'ssg-with-data' | 'ssg-dynamic'
  /** Reason for failure if not successful */
  reason?: string
  /** Error message if failed */
  error?: string
}

/**
 * Options for rendering a single page
 */
export interface RenderSinglePageOptions {
  /** Route definition */
  route: Route
  /** Page component */
  PageComponent: ComponentType<any>
  /** getStaticProps function (optional) */
  getStaticProps?: (context: GetStaticPropsContext) => Promise<GetStaticPropsResult>
  /** Pre-computed props (optional, used for dynamic routes) */
  props?: any
  /** Route parameters */
  params: Record<string, string>
  /** Output directory for generated files */
  outputDir: string
  /** Complete route manifest */
  manifest: RouteManifest
  /** Project root directory */
  projectRoot: string
}

/**
 * Options for generating HTML document
 */
export interface GenerateHTMLOptions {
  /** Rendered React HTML string */
  appHtml: string
  /** Page props */
  pageProps: any
  /** Current route path */
  route: string
  /** Route parameters */
  params: Record<string, string>
  /** Complete route manifest */
  manifest: RouteManifest
  /** Project root directory */
  projectRoot: string
  /** Whether this is SSR (for __NEXT_DATA__) */
  isSSR?: boolean
}

// ==================== Router Event Types ====================

/**
 * Router event names
 */
export type RouterEvent = 'routeChangeStart' | 'routeChangeComplete' | 'routeChangeError'

/**
 * Router event listener
 */
export interface RouterEventListener {
  /** Event name */
  event: RouterEvent
  /** Event handler function */
  handler: (...args: any[]) => void
}

// ==================== Utility Types ====================

/**
 * Options for fetching page data
 */
export interface FetchPageDataOptions {
  /** Force refresh, bypassing cache */
  force?: boolean
}

/**
 * Vite glob import result type
 */
export type ViteGlobImport = Record<string, () => Promise<PageModule>>
