import { ComponentType } from 'react'
import { hydrateRoot, Root } from 'react-dom/client'
import { RouterProvider } from './router.js'
import type { NextData, ClientRoute, ViteGlobImport, PageModule } from '../types/index.js'

/**
 * Client Entry Point
 *
 * Responsibilities:
 * 1. Read __NEXT_DATA__ injected by server
 * 2. Dynamically load page components
 * 3. Perform React hydration
 * 4. Setup client-side routing
 */

console.log('🚀 Mini Next.js 客户端启动...')

/**
 * Use Vite's import.meta.glob to pre-declare all page modules
 *
 * Build time: Vite analyzes and compiles matched files into separate chunks
 * Runtime: Returns object mapping paths to loader functions
 *
 * Note: glob pattern must be literal string, not variable
 */
const pageModules = import.meta.glob('../pages/**/*.{jsx,tsx}') as ViteGlobImport

console.log('📦 已加载页面模块映射:', Object.keys(pageModules))

/**
 * Global React Root instance
 * Created once during initial hydration, reused for client-side navigation
 */
let globalRoot: Root | null = null

/**
 * Global route manifest cache
 * Read from __NEXT_DATA__ and used for subsequent navigation
 */
let globalManifest: ClientRoute[] | null = null

/**
 * 获取全局 root 实例
 * @returns React root 实例
 */
export function getRoot(): Root | null {
  return globalRoot
}

/**
 * Load page component by path
 *
 * @param page - Page path (e.g., /, /about, /blog/123)
 * @param manifest - Route manifest
 * @returns Page component
 */
async function loadPageComponent(page: string, manifest: ClientRoute[]): Promise<ComponentType> {
  // 1. 从 manifest 中查找匹配的路由
  const route = manifest.find((r) => {
    // 精确匹配
    if (r.path === page) return true

    // 动态路由匹配（如 /blog/:id 匹配 /blog/123）
    if (r.isDynamic) {
      // 将路由模式转换为正则表达式
      // /blog/:id -> ^/blog/[^/]+$
      const pattern = new RegExp('^' + r.path.replace(/:[^/]+/g, '[^/]+') + '$')
      return pattern.test(page)
    }

    return false
  })

  if (!route) {
    throw new Error(`找不到路由: ${page}`)
  }

  // 2. 构建模块路径
  // componentPath 来自 manifest，格式：/index.jsx, /about.jsx, /blog/[id].jsx
  const modulePath = `../pages${route.componentPath}`

  console.log(`📂 加载页面组件: ${page} -> ${modulePath}`)

  // 3. ✅ 从 import.meta.glob 生成的映射中获取加载器
  const loader = pageModules[modulePath]

  if (!loader) {
    console.error('❌ 可用的模块路径:', Object.keys(pageModules))
    throw new Error(`找不到模块: ${modulePath}`)
  }

  // 4. ✅ 调用加载器，按需加载模块（代码分割）
  const module = (await loader()) as PageModule
  return module.default
}

/**
 * 渲染页面组件
 *
 * @param PageComponent - 页面组件
 * @param props - 页面属性
 */
function renderPage(PageComponent: ComponentType<any>, props: any): void {
  const App = () => (
    <RouterProvider>
      <PageComponent {...props} />
    </RouterProvider>
  )

  if (!globalRoot) {
    throw new Error('❌ Root 实例不存在，无法渲染页面')
  }

  // ✅ 复用全局 root 实例
  // React 使用 Diff 算法只更新变化的部分
  globalRoot.render(<App />)
}

/**
 * 主hydrate函数
 * 将服务器渲染的 HTML 转换为完全交互式的 React 应用
 */
async function hydrate(): Promise<void> {
  // 1. 读取服务器注入的数据
  const nextDataElement = document.getElementById('__NEXT_DATA__')

  if (!nextDataElement) {
    console.error('❌ 找不到 __NEXT_DATA__，无法进行hydrate')
    return
  }

  const nextData = JSON.parse(nextDataElement.textContent || '{}') as NextData
  console.log('📦 __NEXT_DATA__:', nextData)

  // ✅ 保存路由清单到全局变量
  globalManifest = nextData.manifest

  if (!globalManifest) {
    console.error('❌ __NEXT_DATA__ 中缺少 manifest')
    return
  }

  // 2. 使用通用函数加载页面组件
  let PageComponent: ComponentType
  try {
    PageComponent = await loadPageComponent(nextData.page, globalManifest)
  } catch (error) {
    console.error('❌ 加载页面组件失败:', error)
    return
  }

  // 3. 创建根组件并进行hydrate
  const rootElement = document.getElementById('__next')

  if (!rootElement) {
    console.error('❌ 找不到根元素 #__next')
    return
  }

  console.log('💧 开始hydrate...')

  try {
    const App = () => (
      <RouterProvider>
        <PageComponent {...nextData.props.pageProps} />
      </RouterProvider>
    )

    // ⚠️ 关键：保存 root 实例到全局变量
    // 后续客户端导航时会复用这个 root，而不是创建新的
    globalRoot = hydrateRoot(rootElement, <App />)
    console.log('✅ hydrate完成！页面现在是交互式的')
    console.log('📌 Root 实例已保存，后续导航将复用此 root')
  } catch (error) {
    console.error('❌ hydrate失败:', error)
  }

  // 4. 设置路由事件监听（用于客户端导航）
  setupRouterEvents()
}

/**
 * 设置路由事件监听
 * 处理客户端导航时的页面更新
 */
async function setupRouterEvents(): Promise<void> {
  const routerModule = await import('./router.js')
  const router = routerModule.default

  if (!router) return

  // 监听路由变化
  router.on('routeChangeComplete', async (url: string, data: any) => {
    console.log('🔄 路由已变化:', url)

    // ✅ 使用通用函数加载页面组件
    try {
      const PageComponent = await loadPageComponent(data.page, globalManifest!)

      // ✅ 使用通用函数渲染页面
      renderPage(PageComponent, data.pageProps)

      console.log('✅ 页面已更新（复用 root 实例）')
    } catch (error) {
      console.error('❌ 更新页面失败:', error)
    }
  })
}

// 启动hydrate
hydrate()
