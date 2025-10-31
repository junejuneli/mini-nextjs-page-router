import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { scanPages, printScanResult } from './scan-pages.js'
import { generateRoutes, printRouteManifest } from './generate-routes.js'
import { renderStaticPage } from './render-static.js'

/**
 * Mini Next.js Build System Entry Point
 *
 * Build flow:
 * 1. Clean output directory
 * 2. Scan pages directory
 * 3. Generate route manifest
 * 4. Pre-render SSG pages
 * 5. Build client JavaScript
 * 6. Save manifest file
 */

// 获取当前文件的目录路径（ESM 中没有 __dirname）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('\n🚀 Mini Next.js 构建开始...\n')

// ==================== 第一步：清理输出目录 ====================
console.log('1️⃣  清理输出目录...')
const outputDir = path.join(projectRoot, '.next')

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true })
}

// 创建必要的目录结构
fs.mkdirSync(path.join(outputDir, 'static'), { recursive: true })
fs.mkdirSync(path.join(outputDir, 'server'), { recursive: true })

console.log('  ✓ 输出目录已清理\n')

// ==================== 第二步：扫描 pages 目录 ====================
console.log('2️⃣  扫描 pages 目录...')
const pagesDir = path.join(projectRoot, 'pages')

if (!fs.existsSync(pagesDir)) {
  console.error('❌ pages 目录不存在，请创建 pages 目录')
  process.exit(1)
}

const pages = scanPages(pagesDir)
printScanResult(pages)

console.log(`  ✓ 找到 ${pages.length} 个页面\n`)

// ==================== 第三步：生成路由清单 ====================
console.log('3️⃣  生成路由清单...')
const manifest = generateRoutes(pages)
printRouteManifest(manifest)

// ==================== 第四步：构建客户端 JavaScript ====================
console.log('4️⃣  构建客户端 JavaScript...')
console.log('    先构建客户端代码，确保静态资源准备就绪\n')

try {
  // ✅ 优化：先使用 Vite 构建客户端代码
  // 这样可以避免 Vite 清空目录导致静态文件丢失
  execSync('npx vite build', {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  console.log('  ✓ 客户端代码构建完成\n')
} catch (error) {
  console.error('❌ 客户端构建失败:', error.message)
  process.exit(1)
}

// ==================== 第五步：预渲染 SSG 页面 ====================
console.log('5️⃣  预渲染静态页面...')
console.log('    策略: 默认静态生成（Static by default）\n')

let ssgCount = 0
let ssrCount = 0
let ssgPureCount = 0    // 纯静态页面（无数据）
let ssgDataCount = 0    // 带数据的静态页面
let ssgDynamicCount = 0 // 动态路由静态页面

for (const route of manifest.routes) {
  const result = await renderStaticPage(
    route,
    path.join(outputDir, 'static'),
    manifest,
    projectRoot
  )

  if (result.success) {
    // 标记为 SSG
    route.renderType = 'ssg'
    ssgCount += result.count || 1

    // 统计不同类型的 SSG 页面
    if (result.type === 'ssg-pure') {
      ssgPureCount++
    } else if (result.type === 'ssg-with-data') {
      ssgDataCount++
    } else if (result.type === 'ssg-dynamic') {
      ssgDynamicCount += result.count || 1
    }
  } else {
    // 标记为 SSR（运行时渲染）
    route.renderType = 'ssr'
    ssrCount++
  }
}

console.log(`\n📊 静态生成统计:`)
console.log(`  ✓ 总计 SSG 页面: ${ssgCount} 个`)
console.log(`    - 纯静态页面: ${ssgPureCount} 个`)
console.log(`    - 带数据静态页面: ${ssgDataCount} 个`)
console.log(`    - 动态路由静态页面: ${ssgDynamicCount} 个`)
console.log(`  ⚠️  SSR 页面（运行时渲染）: ${ssrCount} 个\n`)

// ==================== 第六步：保存清单文件 ====================
console.log('6️⃣  保存清单文件...')

const manifestPath = path.join(outputDir, 'manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log(`  ✓ 清单文件已保存到 ${manifestPath}\n`)

// ==================== 构建完成 ====================
console.log('✅ 构建完成！\n')
console.log('📊 构建统计:')
console.log(`   - 总页面数: ${pages.length}`)
console.log(`   - SSG 页面: ${ssgCount}`)
console.log(`   - SSR 页面: ${ssrCount}`)
console.log(`   - 输出目录: ${outputDir}`)
console.log('\n💡 运行 npm start 启动服务器\n')
