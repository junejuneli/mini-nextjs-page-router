import React from 'react'
import ReactDOMServer from 'react-dom/server'
import path from 'path'
import { getClientManifest } from './router.js'
import type { Request, Response } from 'express'
import type { MatchResult, PageModule, NextData } from '../types/index.js'

/**
 * SSR 渲染器
 *
 * 负责在运行时动态渲染页面
 * 每次请求都会执行 getServerSideProps 并重新渲染
 */

/**
 * 渲染 SSR 页面
 *
 * @param matchResult - 路由匹配结果
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param projectRoot - 项目根目录
 * @returns HTML 字符串
 */
export async function renderSSR(
  matchResult: MatchResult,
  req: Request,
  res: Response,
  projectRoot: string
): Promise<string> {
  const { route, params } = matchResult

  try {
    // 1. 动态加载页面组件
    // 使用 file:// 协议和绝对路径来支持 ESM
    const componentPath = path.resolve(route.componentPath)
    const pageModule = (await import(`file://${componentPath}`)) as PageModule

    const PageComponent = pageModule.default
    const { getServerSideProps } = pageModule

    let pageProps: any = {}

    // 2. 如果存在 getServerSideProps，调用它获取数据
    if (getServerSideProps) {
      const context = {
        params, // 路由参数
        req, // 请求对象
        res, // 响应对象
        query: req.query as Record<string, string>, // 查询参数
      }

      const result = await getServerSideProps(context)
      pageProps = result.props || {}
    }

    // 3. 使用 ReactDOMServer 渲染组件为 HTML 字符串
    const appHtml = ReactDOMServer.renderToString(React.createElement(PageComponent, pageProps))

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
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ SSR 渲染失败:`, message)
    throw error
  }
}

/**
 * 获取 SSR 页面的 JSON 数据（用于客户端导航）
 *
 * @param matchResult - 路由匹配结果
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @returns 页面数据
 */
export async function getSSRData(
  matchResult: MatchResult,
  req: Request,
  res: Response
): Promise<{ pageProps: any; query: Record<string, string> }> {
  const { route, params } = matchResult

  try {
    const componentPath = path.resolve(route.componentPath)
    const pageModule = (await import(`file://${componentPath}`)) as PageModule

    const { getServerSideProps } = pageModule

    let pageProps: any = {}

    if (getServerSideProps) {
      const context = {
        params,
        req,
        res,
        query: req.query as Record<string, string>,
      }
      const result = await getServerSideProps(context)
      pageProps = result.props || {}
    }

    return {
      pageProps,
      query: params,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ 获取 SSR 数据失败:`, message)
    throw error
  }
}

/**
 * 生成完整的 HTML 文档
 *
 * @param options - 选项
 * @returns HTML 字符串
 */
function generateHTMLDocument({
  appHtml,
  pageProps,
  route,
  params,
  projectRoot,
}: {
  appHtml: string
  pageProps: any
  route: string
  params: Record<string, string>
  projectRoot: string
}): string {
  // __NEXT_DATA__ 包含页面所需的所有初始数据
  // 客户端会读取这个数据进行水合
  const nextData: NextData = {
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
