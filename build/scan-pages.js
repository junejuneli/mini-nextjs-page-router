import fs from 'fs'
import path from 'path'

/**
 * 扫描 pages 目录，收集所有页面文件
 *
 * 这个模块负责递归遍历 pages 目录，识别所有的页面组件文件
 * 类似于 Next.js 中的文件系统路由扫描
 *
 * @param {string} pagesDir - pages 目录的路径
 * @returns {Array} 页面信息数组
 */
export function scanPages(pagesDir) {
  const pages = []

  /**
   * 递归扫描目录
   * @param {string} dir - 当前扫描的目录
   * @param {string} basePath - 基础路径（用于生成路由路径）
   */
  function scan(dir, basePath = '') {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      // 如果是目录，递归扫描
      if (stat.isDirectory()) {
        scan(fullPath, path.join(basePath, file))
        continue
      }

      // 只处理 .jsx 和 .js 文件
      if (!['.jsx', '.js'].includes(path.extname(file))) {
        continue
      }

      // 跳过以 _ 开头的特殊文件（_app.jsx, _document.jsx）
      // 这些文件在 Next.js 中有特殊用途，本示例暂不实现
      const fileName = path.basename(file, path.extname(file))
      if (fileName.startsWith('_')) {
        continue
      }

      // 生成路由路径
      const routePath = generateRoutePath(basePath, fileName)

      // 检测是否为动态路由（检查整个路径，包括目录）
      const fullRelativePath = basePath ? `${basePath}/${file}` : file
      const isDynamic = /\[.*\]/.test(fullRelativePath)

      // 提取动态参数名（从完整的相对路径中提取，支持嵌套）
      const paramNames = isDynamic ? extractParamNames(fullRelativePath) : []

      pages.push({
        // 文件的完整路径
        filePath: fullPath,
        // 路由路径（如 /blog/[id] -> /blog/:id）
        routePath,
        // 原始文件名
        fileName: file,
        // 是否为动态路由
        isDynamic,
        // 动态参数名列表
        paramNames,
      })
    }
  }

  scan(pagesDir)
  return pages
}

/**
 * 根据文件路径生成路由路径
 *
 * 转换规则：
 * - index.jsx -> /
 * - about.jsx -> /about
 * - blog/index.jsx -> /blog
 * - blog/[id].jsx -> /blog/:id
 * - blog/[category]/[id].jsx -> /blog/:category/:id (嵌套动态路由)
 *
 * @param {string} basePath - 基础路径
 * @param {string} fileName - 文件名（不含扩展名）
 * @returns {string} 路由路径
 */
function generateRoutePath(basePath, fileName) {
  // index 文件映射为目录本身
  if (fileName === 'index') {
    return basePath === '' ? '/' : `/${basePath}`
  }

  // 将基础路径中的 [param] 也转换为 :param（支持嵌套动态路由）
  const convertedBasePath = basePath.replace(/\[(.+?)\]/g, ':$1')

  // 将 [id] 格式转换为 :id 格式（Express 路由格式）
  const routeSegment = fileName.replace(/\[(.+?)\]/g, ':$1')

  // 组合完整路径
  const fullPath = convertedBasePath === '' ? routeSegment : `${convertedBasePath}/${routeSegment}`

  return `/${fullPath}`
}

/**
 * 从文件路径中提取动态参数名（支持嵌套动态路由）
 *
 * 示例：
 * - [id].jsx -> ['id']
 * - [category]/[id].jsx -> ['category', 'id']
 * - blog/[category]/[id].jsx -> ['category', 'id']
 * - [...slug].jsx -> ['slug'] (catch-all routes)
 *
 * @param {string} filePath - 完整文件路径或文件名
 * @returns {Array<string>} 参数名数组
 */
function extractParamNames(filePath) {
  const matches = filePath.matchAll(/\[\.{0,3}(.+?)\]/g)
  return Array.from(matches, (match) => match[1])
}

/**
 * 打印扫描结果（用于调试）
 * @param {Array} pages - 页面信息数组
 */
export function printScanResult(pages) {
  console.log('\n📄 Scanned Pages:')
  console.log('=====================================')

  pages.forEach((page) => {
    console.log(`\n路由: ${page.routePath}`)
    console.log(`文件: ${page.filePath}`)
    console.log(`动态: ${page.isDynamic ? '是' : '否'}`)

    if (page.isDynamic) {
      console.log(`参数: ${page.paramNames.join(', ')}`)
    }
  })

  console.log('\n=====================================\n')
}
