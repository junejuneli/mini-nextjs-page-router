import fs from 'fs'

/**
 * 路由匹配器
 *
 * 负责根据请求 URL 匹配对应的路由规则
 * 类似于 Next.js 中的路由匹配逻辑
 */

let routeManifest = null

/**
 * 加载路由清单
 * @param {string} manifestPath - 清单文件路径
 */
export function loadManifest(manifestPath) {
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    routeManifest = JSON.parse(content)
    console.log(`✓ 加载了 ${routeManifest.routes.length} 个路由`)
  } catch (error) {
    console.error('❌ 加载路由清单失败:', error.message)
    throw error
  }
}

/**
 * 根据 URL 匹配路由
 *
 * @param {string} url - 请求的 URL 路径
 * @returns {Object|null} 匹配结果，包含路由信息和参数
 *
 * 返回格式：
 * {
 *   route: { path, componentPath, renderType, ... },
 *   params: { id: '123', ... }
 * }
 */
export function matchRoute(url) {
  if (!routeManifest) {
    throw new Error('路由清单未加载，请先调用 loadManifest()')
  }

  // 移除查询字符串
  const pathname = url.split('?')[0]

  // 遍历所有路由，找到第一个匹配的
  for (const route of routeManifest.routes) {
    const regex = new RegExp(route.pattern)
    const match = pathname.match(regex)

    if (match) {
      // 提取参数值
      const params = extractParams(match, route.paramNames)

      return {
        route,
        params,
      }
    }
  }

  // 没有找到匹配的路由
  return null
}

/**
 * 从正则匹配结果中提取参数
 *
 * @param {Array} match - 正则匹配结果
 * @param {Array<string>} paramNames - 参数名列表
 * @returns {Object} 参数对象
 *
 * 示例：
 * match = ['/blog/123', '123']
 * paramNames = ['id']
 * 返回: { id: '123' }
 */
function extractParams(match, paramNames) {
  const params = {}

  // match[0] 是完整匹配，match[1]... 是捕获组
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]
  })

  return params
}

/**
 * 获取所有路由信息（用于调试）
 * @returns {Array} 路由列表
 */
export function getAllRoutes() {
  return routeManifest?.routes || []
}

/**
 * 获取客户端所需的路由清单（精简版）
 * @param {string} projectRoot - 项目根目录
 * @returns {Array} 客户端路由清单
 */
export function getClientManifest(projectRoot) {
  if (!routeManifest) {
    return []
  }

  // 只返回客户端需要的字段，并转换路径为相对路径
  return routeManifest.routes.map(route => ({
    path: route.path,
    // 转换为相对于 pages 目录的路径
    // /Users/.../pages/blog/[id].jsx -> /blog/[id].jsx
    componentPath: route.componentPath
      .replace(projectRoot, '')
      .replace('/pages', ''),
    isDynamic: route.isDynamic,
    paramNames: route.paramNames,
  }))
}
