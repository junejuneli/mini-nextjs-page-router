import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type {
  PageData,
  CachedPageData,
  RouterEvent,
  RouterEventListener,
  FetchPageDataOptions,
} from '../types/index.js'

/**
 * 客户端路由器
 *
 * 负责管理客户端的路由状态和导航
 * 类似于 Next.js 的 useRouter hook
 */

// 创建路由上下文
const RouterContext = createContext<Router | null>(null)

/**
 * Router 类
 * 管理客户端路由状态
 */
class Router {
  pathname: string
  query: Record<string, string>
  listeners: RouterEventListener[]
  cache: Map<string, CachedPageData>
  prefetchPromises: Map<string, Promise<PageData>>

  constructor() {
    this.pathname = window.location.pathname
    this.query = this.parseQuery(window.location.search)
    this.listeners = []

    // ✨ 新增：页面数据缓存
    // key: URL, value: { data, promise, timestamp }
    this.cache = new Map()

    // ✨ 新增：正在进行的预取请求（防重）
    // key: URL, value: Promise
    this.prefetchPromises = new Map()

    // 监听浏览器的前进/后退按钮
    window.addEventListener('popstate', () => {
      this.pathname = window.location.pathname
      this.query = this.parseQuery(window.location.search)
      this.emit('routeChangeComplete', this.pathname)
    })
  }

  /**
   * 解析查询字符串
   * @param search - 查询字符串（如 ?foo=bar&baz=qux）
   * @returns 查询参数对象
   */
  parseQuery(search: string): Record<string, string> {
    const params = new URLSearchParams(search)
    const query: Record<string, string> = {}

    for (const [key, value] of params) {
      query[key] = value
    }

    return query
  }

  /**
   * 获取页面数据（带缓存）
   *
   * ✨ 核心优化：
   * 1. 检查缓存，如果存在直接返回
   * 2. 检查正在进行的请求，如果存在则等待同一个 Promise
   * 3. 发起新请求，并缓存结果
   *
   * @param url - 页面 URL
   * @param options - 选项
   * @returns 页面数据
   */
  async fetchPageData(url: string, options: FetchPageDataOptions = {}): Promise<PageData> {
    const { force = false } = options

    // 1. 检查缓存（除非强制刷新）
    if (!force && this.cache.has(url)) {
      const cached = this.cache.get(url)!
      console.log(`📦 使用缓存数据: ${url}`)
      return cached.data
    }

    // 2. 检查是否有正在进行的请求（防止重复请求）
    if (this.prefetchPromises.has(url)) {
      console.log(`⏳ 等待进行中的请求: ${url}`)
      return this.prefetchPromises.get(url)!
    }

    // 3. 发起新请求
    console.log(`🌐 发起请求: ${url}`)
    const promise = fetch(`${url}?_next_data=1`)
      .then((r) => r.json())
      .then((data: PageData) => {
        // 缓存数据
        this.cache.set(url, {
          data,
          timestamp: Date.now(),
        })

        // 清除正在进行的请求记录
        this.prefetchPromises.delete(url)

        return data
      })
      .catch((error) => {
        // 请求失败，清除记录
        this.prefetchPromises.delete(url)
        throw error
      })

    // 记录正在进行的请求
    this.prefetchPromises.set(url, promise)

    return promise
  }

  /**
   * 导航到新页面（添加历史记录）
   * @param url - 目标 URL
   */
  async push(url: string): Promise<void> {
    console.log(`🔗 客户端导航: ${url}`)

    try {
      // 触发导航开始事件
      this.emit('routeChangeStart', url)

      // ✅ 使用缓存获取数据
      const data = await this.fetchPageData(url)

      // 更新路由状态
      this.pathname = url
      this.query = data.query || {}

      // 更新浏览器 URL（不刷新页面）
      window.history.pushState({}, '', url)

      // 触发导航完成事件
      this.emit('routeChangeComplete', url, data)
    } catch (error) {
      console.error('❌ 客户端导航失败:', error)
      this.emit('routeChangeError', error, url)
    }
  }

  /**
   * 替换当前页面（不添加历史记录）
   * @param url - 目标 URL
   */
  async replace(url: string): Promise<void> {
    // 实现与 push 类似，但使用 replaceState
    console.log(`🔄 客户端替换: ${url}`)

    try {
      this.emit('routeChangeStart', url)

      // ✅ 使用缓存获取数据
      const data = await this.fetchPageData(url)

      this.pathname = url
      this.query = data.query || {}

      window.history.replaceState({}, '', url)

      this.emit('routeChangeComplete', url, data)
    } catch (error) {
      console.error('❌ 客户端替换失败:', error)
      this.emit('routeChangeError', error, url)
    }
  }

  /**
   * 预取页面数据（用于优化性能）
   *
   * ✨ 优化后的实现：
   * 1. 使用内存缓存，避免重复请求
   * 2. 如果已经有请求在进行，不会发起新请求
   * 3. 缓存的数据会被 push() 和 replace() 复用
   *
   * @param url - 要预取的 URL
   */
  async prefetch(url: string): Promise<void> {
    try {
      // ✅ 使用统一的数据获取方法
      // 如果已缓存或正在请求，不会发起新请求
      await this.fetchPageData(url)
      console.log(`✨ 预取完成: ${url}`)
    } catch (error) {
      console.error('预取失败:', error)
    }
  }

  /**
   * 监听路由事件
   * @param event - 事件名称
   * @param handler - 事件处理函数
   */
  on(event: RouterEvent, handler: (...args: any[]) => void): void {
    this.listeners.push({ event, handler })
  }

  /**
   * 取消监听
   * @param event - 事件名称
   * @param handler - 事件处理函数
   */
  off(event: RouterEvent, handler: (...args: any[]) => void): void {
    this.listeners = this.listeners.filter((l) => l.event !== event || l.handler !== handler)
  }

  /**
   * 触发事件
   * @param event - 事件名称
   * @param args - 事件参数
   */
  emit(event: RouterEvent, ...args: any[]): void {
    this.listeners.filter((l) => l.event === event).forEach((l) => l.handler(...args))
  }
}

// 创建全局路由器实例
const globalRouter = typeof window !== 'undefined' ? new Router() : null

/**
 * RouterProvider 组件
 * 提供路由上下文
 */
export function RouterProvider({ children }: { children: ReactNode }): JSX.Element {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!globalRouter) return

    // 监听路由变化，强制重新渲染
    const handler = () => forceUpdate((n: number) => n + 1)
    globalRouter.on('routeChangeComplete', handler)

    return () => {
      globalRouter.off('routeChangeComplete', handler)
    }
  }, [])

  return <RouterContext.Provider value={globalRouter}>{children}</RouterContext.Provider>
}

/**
 * useRouter Hook
 * 获取路由器实例
 *
 * @returns 路由器实例，SSR 时返回 null
 *
 * 使用示例：
 * ```jsx
 * const router = useRouter()
 * if (router) {
 *   router.push('/about')
 *   console.log(router.pathname) // 当前路径
 *   console.log(router.query)    // 查询参数
 * }
 * ```
 *
 * ⚠️ SSR 兼容性：
 * - 在服务端渲染时，返回 null（优雅降级）
 * - 在客户端但没有 RouterProvider 时，返回 null
 * - 这样组件可以安全地总是调用此 Hook（符合 React Hooks 规则）
 * - 组件需要检查返回值是否为 null
 */
export function useRouter(): Router | null {
  const router = useContext(RouterContext)

  // ✅ 返回 null 而不是抛出错误
  // 这样 Link 等组件可以安全地总是调用 useRouter()
  // 符合 React Hooks 规则：Hooks 必须在顶层无条件调用
  return router // 客户端返回 router 实例，SSR 返回 null
}

export default globalRouter
