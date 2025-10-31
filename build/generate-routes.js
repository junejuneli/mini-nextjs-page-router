/**
 * 生成路由映射清单
 *
 * 这个模块将扫描到的页面信息转换为路由清单，
 * 包含路由匹配所需的所有信息
 */

/**
 * 生成路由清单
 *
 * @param {Array} pages - 扫描到的页面信息数组
 * @returns {Object} 路由清单
 */
export function generateRoutes(pages) {
  const routes = pages.map((page) => ({
    // 路由路径（如 /blog/:id）
    path: page.routePath,

    // 页面组件文件路径
    componentPath: page.filePath,

    // 路由匹配正则表达式（用于服务器端匹配 URL）
    pattern: pathToRegex(page.routePath),

    // 动态参数名列表
    paramNames: page.paramNames,

    // 是否为动态路由
    isDynamic: page.isDynamic,

    // 渲染类型（在构建过程中会设置为 'ssg' 或 'ssr'）
    renderType: null,
  }))

  return {
    routes,
    // 添加构建时间戳
    buildTime: new Date().toISOString(),
  }
}

/**
 * 将路由路径转换为正则表达式
 *
 * 转换规则：
 * - / -> ^/$
 * - /about -> ^/about$
 * - /blog/:id -> ^/blog/([^/]+)$
 *
 * @param {string} routePath - 路由路径
 * @returns {string} 正则表达式字符串
 */
function pathToRegex(routePath) {
  // 转义特殊字符
  let pattern = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // 将 :param 转换为捕获组
  // :id -> ([^/]+) 匹配除了 / 之外的任意字符
  pattern = pattern.replace(/:([^/]+)/g, '([^/]+)')

  // 添加开始和结束锚点
  return `^${pattern}$`
}

/**
 * 打印路由清单（用于调试）
 * @param {Object} manifest - 路由清单
 */
export function printRouteManifest(manifest) {
  console.log('\n🗺️  Route Manifest:')
  console.log('=====================================')

  manifest.routes.forEach((route) => {
    console.log(`\n路径: ${route.path}`)
    console.log(`模式: ${route.pattern}`)
    console.log(`类型: ${route.renderType || '未设置'}`)

    if (route.isDynamic) {
      console.log(`参数: ${route.paramNames.join(', ')}`)
    }
  })

  console.log(`\n构建时间: ${manifest.buildTime}`)
  console.log('=====================================\n')
}
