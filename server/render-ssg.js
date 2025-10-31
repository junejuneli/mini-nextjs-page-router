import fs from 'fs'
import path from 'path'

/**
 * SSG 页面服务器
 *
 * 负责返回构建时预渲染的静态 HTML 文件
 * 这是最快的渲染方式，因为 HTML 已经提前生成好了
 */

/**
 * 渲染 SSG 页面
 *
 * @param {Object} matchResult - 路由匹配结果
 * @param {string} staticDir - 静态文件目录
 * @returns {Promise<string>} HTML 字符串
 */
export async function renderSSG(matchResult, staticDir = '.next/static') {
  const { route, params } = matchResult

  // 根据路由和参数构建文件路径
  const filePath = getStaticFilePath(route.path, params)
  const fullPath = path.join(staticDir, `${filePath}.html`)

  try {
    // 读取预渲染的 HTML 文件
    const html = fs.readFileSync(fullPath, 'utf-8')
    return html
  } catch (error) {
    // 文件不存在或读取失败
    console.error(`❌ 读取静态文件失败: ${fullPath}`)
    throw new Error('Static file not found')
  }
}

/**
 * 获取 SSG 页面的 JSON 数据（用于客户端导航）
 *
 * @param {Object} matchResult - 路由匹配结果
 * @param {string} staticDir - 静态文件目录
 * @returns {Promise<Object>} 页面数据
 */
export async function getSSGData(matchResult, staticDir = '.next/static') {
  const { route, params } = matchResult

  const filePath = getStaticFilePath(route.path, params)
  const fullPath = path.join(staticDir, `${filePath}.json`)

  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`❌ 读取静态数据失败: ${fullPath}`)
    throw new Error('Static data not found')
  }
}

/**
 * 根据路由路径和参数生成文件路径
 *
 * @param {string} routePath - 路由路径（如 /blog/:id）
 * @param {Object} params - 参数对象（如 { id: '123' }）
 * @returns {string} 文件路径（如 /blog/123）
 */
function getStaticFilePath(routePath, params) {
  let filePath = routePath

  // 替换动态参数
  for (const [key, value] of Object.entries(params)) {
    filePath = filePath.replace(`:${key}`, value)
  }

  // 根路径特殊处理
  if (filePath === '/') {
    return '/index'
  }

  return filePath
}
