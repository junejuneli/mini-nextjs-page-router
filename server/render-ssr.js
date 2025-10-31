import React from 'react'
import ReactDOMServer from 'react-dom/server'
import path from 'path'
import { getClientManifest } from './router.js'

/**
 * SSR 渲染器
 *
 * 负责在运行时动态渲染页面
 * 每次请求都会执行 getServerSideProps 并重新渲染
 */

/**
 * 渲染 SSR 页面
 *
 * @param {Object} matchResult - 路由匹配结果
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<string>} HTML 字符串
 */
export async function renderSSR(matchResult, req, res, projectRoot) {
  const { route, params } = matchResult

  try {
    // 1. 动态加载页面组件
    // 使用 file:// 协议和绝对路径来支持 ESM
    const componentPath = path.resolve(route.componentPath)
    const pageModule = await import(`file://${componentPath}`)

    const PageComponent = pageModule.default
    const { getServerSideProps } = pageModule

    let pageProps = {}

    // 2. 如果存在 getServerSideProps，调用它获取数据
    if (getServerSideProps) {
      const context = {
        params,         // 路由参数
        req,            // 请求对象
        res,            // 响应对象
        query: req.query, // 查询参数
      }

      const result = await getServerSideProps(context)
      pageProps = result.props || {}
    }

    // 3. 使用 ReactDOMServer 渲染组件为 HTML 字符串
    const appHtml = ReactDOMServer.renderToString(
      React.createElement(PageComponent, pageProps)
    )

    // 4. 生成完整的 HTML 文档
    const html = generateHTMLDocument({
      appHtml,
      pageProps,
      route: route.path,
      params,
      projectRoot,
    })

    return html
  } catch (error) {
    console.error(`❌ SSR 渲染失败:`, error)
    throw error
  }
}

/**
 * 获取 SSR 页面的 JSON 数据（用于客户端导航）
 *
 * @param {Object} matchResult - 路由匹配结果
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @returns {Promise<Object>} 页面数据
 */
export async function getSSRData(matchResult, req, res) {
  const { route, params } = matchResult

  try {
    const componentPath = path.resolve(route.componentPath)
    const pageModule = await import(`file://${componentPath}`)

    const { getServerSideProps } = pageModule

    let pageProps = {}

    if (getServerSideProps) {
      const context = { params, req, res, query: req.query }
      const result = await getServerSideProps(context)
      pageProps = result.props || {}
    }

    return {
      pageProps,
      query: params,
    }
  } catch (error) {
    console.error(`❌ 获取 SSR 数据失败:`, error)
    throw error
  }
}

/**
 * 生成完整的 HTML 文档
 *
 * @param {Object} options - 选项
 * @returns {string} HTML 字符串
 */
function generateHTMLDocument({ appHtml, pageProps, route, params, projectRoot }) {
  // __NEXT_DATA__ 包含页面所需的所有初始数据
  // 客户端会读取这个数据进行水合
  const nextData = {
    props: { pageProps },
    page: route,
    query: params,
    buildId: 'dev',
    // 标记为 SSR 页面
    gssp: true,
    // ✅ 注入路由清单，供客户端使用
    manifest: getClientManifest(projectRoot),
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mini Next.js</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="__next">${appHtml}</div>
  <script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script>
  <script type="module" src="/client.js"></script>
</body>
</html>`
}
