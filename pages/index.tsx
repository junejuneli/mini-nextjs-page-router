import Link from '../client/link.js'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from '../types/index.js'

/**
 * 首页组件
 *
 * 演示 SSR（服务端渲染）
 * 使用 getServerSideProps 在每次请求时获取最新数据
 */

interface HomeProps {
  serverTime: string
  visitCount: number
}

export default function Home({ serverTime, visitCount }: HomeProps): JSX.Element {
  return (
    <div>
      {/* 导航栏 */}
      <nav>
        <ul>
          <li>
            <Link href="/">首页</Link>
          </li>
          <li>
            <Link href="/about">关于</Link>
          </li>
          <li>
            <Link href="/blog/1">博客</Link>
          </li>
          <li>
            <Link href="/blog/tech/1">嵌套路由</Link>
          </li>
        </ul>
      </nav>

      {/* 主要内容 */}
      <div className="container">
        <div className="card">
          <h1>欢迎来到 Mini Next.js！</h1>

          <p>
            <span className="badge ssr">SSR</span>
            这个页面使用服务端渲染（Server-Side Rendering）
          </p>

          <h2>实时数据</h2>
          <p>
            服务器时间: <strong>{serverTime}</strong>
          </p>
          <p>
            访问次数: <strong>{visitCount}</strong>
          </p>

          <p>每次刷新页面，这些数据都会更新，因为它们是在服务器端实时获取的。</p>

          <h2>功能演示</h2>

          <div className="blog-list">
            <div className="blog-item">
              <h3>静态生成 (SSG)</h3>
              <p>访问"关于"页面，体验在构建时预渲染的静态页面</p>
              <Link href="/about" className="button">
                查看关于页面
              </Link>
            </div>

            <div className="blog-item">
              <h3>动态路由 + SSG</h3>
              <p>访问博客文章，体验动态路由和静态生成的结合</p>
              <Link href="/blog/1" className="button">
                单层动态路由
              </Link>
            </div>

            <div className="blog-item">
              <h3>嵌套动态路由</h3>
              <p>访问分类博客，体验多级动态参数（如 /blog/tech/1）</p>
              <Link href="/blog/tech/1" className="button">
                嵌套动态路由
              </Link>
            </div>

            <div className="blog-item">
              <h3>客户端导航</h3>
              <p>点击上面的链接，注意页面不会刷新，这就是客户端路由</p>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                打开浏览器控制台，可以看到导航日志
              </p>
            </div>
          </div>

          <h2>技术特性</h2>
          <ul>
            <li>✅ 基于文件系统的路由</li>
            <li>✅ 服务端渲染 (SSR)</li>
            <li>✅ 静态生成 (SSG)</li>
            <li>✅ 动态路由</li>
            <li>✅ 嵌套动态路由 (多参数)</li>
            <li>✅ 客户端路由导航</li>
            <li>✅ React hydrate (Hydration)</li>
            <li>✅ Link 组件预取</li>
          </ul>
        </div>
      </div>

      <footer>
        <p>Mini Next.js - 一个用于学习的简化版 Next.js Page Router</p>
      </footer>
    </div>
  )
}

/**
 * getServerSideProps
 *
 * 这个函数在每次请求时在服务器端运行
 * 返回的 props 会传递给页面组件
 *
 * @param context - 上下文对象，包含 req, res, params, query 等
 * @returns 包含 props 的对象
 */
export async function getServerSideProps(
  _context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<HomeProps>> {
  // 模拟数据库查询或 API 调用
  const serverTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  })

  // 简单的访问计数器（使用内存存储，仅用于演示）
  if (!(global as any).visitCount) {
    ;(global as any).visitCount = 0
  }
  ;(global as any).visitCount++

  // 返回 props
  return {
    props: {
      serverTime,
      visitCount: (global as any).visitCount,
    },
  }
}
