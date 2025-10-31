import fs from 'fs'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

/**
 * 静态页面渲染器
 *
 * 负责在构建时预渲染 SSG 页面
 * 类似于 Next.js 的 `next build` 中的静态生成逻辑
 *
 * ⚠️ 重要：JSX 文件导入问题
 *
 * 本文件需要动态导入 .jsx 页面文件（第 31 行）。
 * Node.js 默认不支持 .jsx 扩展名，需要转译器。
 *
 * 解决方案：使用 tsx 运行构建脚本
 * - package.json 中已配置：`"build": "tsx build/index.js"`
 * - tsx 是一个快速的 TypeScript/JSX 执行器，基于 esbuild
 * - 它会在运行时自动转译 .jsx 文件
 */

/**
 * 渲染静态页面
 *
 * ✨ 改进后的逻辑：默认静态生成（Static by default）
 *
 * 这个函数会：
 * 1. 加载页面组件
 * 2. 检查是否有 getServerSideProps（如果有，跳过静态生成）
 * 3. 对于动态路由，检查是否有 getStaticPaths
 * 4. 调用 getStaticProps 获取数据（如果存在）
 * 5. 渲染组件为 HTML
 * 6. 保存 HTML 和 JSON 文件
 *
 * @param {Object} route - 路由信息
 * @param {string} outputDir - 输出目录
 * @param {Object} manifest - 完整的路由清单（用于注入到客户端）
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} 渲染结果
 */
export async function renderStaticPage(route, outputDir = '.next/static', manifest, projectRoot) {
  try {
    // 动态加载页面组件（使用 import() 而不是 require，支持 ESM）
    const pageModule = await import(`file://${path.resolve(route.componentPath)}`)
    const PageComponent = pageModule.default

    // 检查页面导出的数据获取函数
    const { getStaticProps, getStaticPaths, getServerSideProps } = pageModule

    // ✅ 核心改进：检查是否明确要求 SSR
    if (getServerSideProps) {
      console.log(`⚠️  ${route.path} 使用 getServerSideProps，跳过静态生成 → SSR`)
      return { success: false, reason: 'has-getServerSideProps' }
    }

    // ✅ 动态路由的特殊处理
    if (route.isDynamic) {
      // 动态路由必须有 getStaticPaths 才能预生成
      if (!getStaticPaths) {
        console.log(`⚠️  ${route.path} 是动态路由但没有 getStaticPaths，无法预生成 → SSR`)
        return { success: false, reason: 'dynamic-no-paths' }
      }

      // getStaticProps 是可选的，没有就用空 props
      if (!getStaticProps) {
        console.log(`⚠️  ${route.path} 动态路由没有 getStaticProps，将使用空 props 生成`)
      }

      // 调用 getStaticPaths 获取所有需要生成的路径
      const { paths } = await getStaticPaths()

      console.log(`\n📝 生成动态路由 ${route.path} 的 ${paths.length} 个页面...`)

      // 为每个路径生成页面
      for (const pathObj of paths) {
        await renderSinglePage({
          route,
          PageComponent,
          getStaticProps,
          params: pathObj.params,
          outputDir,
          manifest,
          projectRoot,
        })
      }

      return { success: true, count: paths.length, type: 'ssg-dynamic' }
    }

    // ✅ 静态路由：默认进行静态生成
    console.log(`\n📝 生成静态页面 ${route.path}...`)

    let pageProps = {}

    // 如果有 getStaticProps，调用它获取数据
    if (getStaticProps) {
      const result = await getStaticProps({})
      pageProps = result.props || {}
    }
    // else: 纯静态页面，使用空 props

    await renderSinglePage({
      route,
      PageComponent,
      props: pageProps,
      params: {},
      outputDir,
      manifest,
      projectRoot,
    })

    const renderType = getStaticProps ? 'ssg-with-data' : 'ssg-pure'
    return { success: true, count: 1, type: renderType }
  } catch (error) {
    console.error(`❌ 渲染 ${route.path} 失败:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 渲染单个页面
 *
 * ✨ 改进：支持动态路由和纯静态页面
 *
 * @param {Object} options - 渲染选项
 */
async function renderSinglePage({
  route,
  PageComponent,
  getStaticProps,
  props,
  params,
  outputDir,
  manifest,
  projectRoot,
}) {
  // 1. 获取页面数据
  let pageProps = props

  // 如果没有直接传入 props，且有 getStaticProps，则调用它
  if (pageProps === undefined && getStaticProps) {
    const result = await getStaticProps({ params })
    pageProps = result.props || {}
  }

  // 如果还是没有 props，使用空对象（纯静态页面）
  if (pageProps === undefined) {
    pageProps = {}
  }

  // 2. 使用 ReactDOMServer 渲染组件为 HTML 字符串
  const appHtml = ReactDOMServer.renderToString(
    React.createElement(PageComponent, pageProps)
  )

  // 3. 生成完整的 HTML 文档
  const html = generateHTMLDocument({
    appHtml,
    pageProps,
    route: route.path,
    params,
    manifest,
    projectRoot,
  })

  // 4. 确定输出文件路径
  const outputPath = getOutputPath(route.path, params)
  const fullOutputPath = path.join(outputDir, outputPath)

  // 5. 创建输出目录
  const dir = path.dirname(fullOutputPath)
  fs.mkdirSync(dir, { recursive: true })

  // 6. 保存 HTML 文件
  fs.writeFileSync(`${fullOutputPath}.html`, html)
  console.log(`  ✓ ${outputPath}.html`)

  // 7. 保存 JSON 数据文件（用于客户端路由）
  const jsonData = {
    pageProps,
    query: params,
  }
  fs.writeFileSync(`${fullOutputPath}.json`, JSON.stringify(jsonData))
  console.log(`  ✓ ${outputPath}.json`)
}

/**
 * 生成完整的 HTML 文档
 *
 * @param {Object} options - 选项
 * @returns {string} HTML 字符串
 */
function generateHTMLDocument({ appHtml, pageProps, route, params, manifest, projectRoot }) {
  // 生成客户端路由清单（精简版）
  const clientManifest = manifest.routes.map(r => ({
    path: r.path,
    // 转换为相对于 pages 目录的路径
    componentPath: r.componentPath
      .replace(projectRoot, '')
      .replace('/pages', ''),
    isDynamic: r.isDynamic,
    paramNames: r.paramNames,
  }))

  // __NEXT_DATA__ 是 Next.js 用来传递服务端数据到客户端的机制
  // 客户端会读取这个数据进行水合
  const nextData = {
    props: { pageProps },
    page: route,
    query: params,
    buildId: 'static',
    // ✅ 注入路由清单，供客户端使用
    manifest: clientManifest,
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

/**
 * 根据路由和参数生成输出文件路径
 *
 * 示例：
 * - / -> /index
 * - /about -> /about
 * - /blog/:id + {id: '123'} -> /blog/123
 * - /blog/:category/:id + {category: 'tech', id: '123'} -> /blog/tech/123
 *
 * @param {string} routePath - 路由路径
 * @param {Object} params - 参数对象
 * @returns {string} 输出路径
 */
function getOutputPath(routePath, params) {
  let outputPath = routePath

  // 替换所有动态参数（支持多个参数）
  for (const [key, value] of Object.entries(params)) {
    // 使用全局替换，确保所有匹配的参数都被替换
    outputPath = outputPath.replace(new RegExp(`:${key}`, 'g'), value)
  }

  // 处理根路径
  if (outputPath === '/') {
    return '/index'
  }

  return outputPath
}
