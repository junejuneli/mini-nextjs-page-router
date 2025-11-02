import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadManifest, matchRoute } from './router.js'
import { renderSSG, getSSGData } from './render-ssg.js'
import { renderSSR, getSSRData } from './render-ssr.js'

/**
 * Mini Next.js Server
 *
 * Features:
 * 1. Route matching
 * 2. Serve SSG pages (pre-rendered HTML)
 * 3. Render SSR pages (dynamic rendering)
 * 4. Client navigation API (JSON data)
 */

// 获取当前文件的目录路径（ESM 中没有 __dirname）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const app = express()
const PORT = process.env.PORT || 3000

// ==================== 初始化 ====================
console.log('\n🚀 Mini Next.js 服务器启动中...\n')

// 加载路由清单
const manifestPath = path.join(projectRoot, '.next/manifest.json')
try {
  loadManifest(manifestPath)
} catch (error) {
  console.error('❌ 请先运行 npm run build 构建项目')
  process.exit(1)
}

// ==================== 静态资源服务 ====================

// 提供客户端 JavaScript 和 CSS
app.use(express.static(path.join(projectRoot, '.next/static')))

// 提供 public 目录下的静态文件
app.use(express.static(path.join(projectRoot, 'public')))

// ==================== API: 客户端导航数据接口 ====================

/**
 * 这个接口用于客户端路由导航
 * 当用户点击 Link 组件时，会请求这个接口获取新页面的数据
 * 而不是重新加载整个 HTML 页面
 */
app.get('*', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 检查是否为客户端导航请求
  const isClientNavigation = req.query._next_data === '1'

  if (!isClientNavigation) {
    next() // 继续到下一个中间件（HTML 渲染）
    return
  }

  try {
    // 匹配路由
    const matchResult = matchRoute(req.path)

    if (!matchResult) {
      res.status(404).json({ error: 'Page not found' })
      return
    }

    let data: { pageProps: any; query: Record<string, string> }

    // 根据渲染类型返回数据
    if (matchResult.route.renderType === 'ssg') {
      // SSG: 读取预生成的 JSON 数据
      data = await getSSGData(matchResult, path.join(projectRoot, '.next/static'))
    } else {
      // SSR: 动态获取数据
      data = await getSSRData(matchResult, req, res)
    }

    // 返回 JSON 数据
    res.json({
      pageProps: data.pageProps,
      query: data.query || matchResult.params,
      page: matchResult.route.path,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('❌ 获取页面数据失败:', message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ==================== HTML 渲染 ====================

app.get('*', async (req: Request, res: Response): Promise<void> => {
  try {
    // 匹配路由
    const matchResult = matchRoute(req.path)

    if (!matchResult) {
      // 404 页面
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - 页面未找到</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h1>404</h1>
              <p>页面未找到</p>
              <a href="/" class="button">返回首页</a>
            </div>
          </div>
        </body>
        </html>
      `)
      return
    }

    console.log(`📄 ${req.method} ${req.path} -> ${matchResult.route.renderType?.toUpperCase()}`)

    let html: string

    // 根据渲染类型选择渲染方式
    if (matchResult.route.renderType === 'ssg') {
      // SSG: 返回预渲染的 HTML
      html = await renderSSG(matchResult, path.join(projectRoot, '.next/static'))

      // 设置缓存头（SSG 页面可以缓存）
      res.set('Cache-Control', 'public, max-age=3600')
    } else {
      // SSR: 动态渲染
      html = await renderSSR(matchResult, req, res, projectRoot)

      // 设置缓存头（SSR 页面不缓存）
      res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }

    res.send(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('❌ 渲染页面失败:', message)

    // 错误页面
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>500 - 服务器错误</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>500</h1>
            <p>服务器错误</p>
            <pre>${message}</pre>
            <a href="/" class="button">返回首页</a>
          </div>
        </div>
      </body>
      </html>
    `)
  }
})

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log('\n✅ 服务器启动成功！\n')
  console.log(`🌐 访问地址: http://localhost:${PORT}`)
  console.log('\n按 Ctrl+C 停止服务器\n')
})
