import React from 'react'
import Link from '../client/link.jsx'

/**
 * 服务条款页面
 *
 * ✨ 演示：纯静态页面（Pure Static）
 *
 * 这个页面没有导出任何数据获取函数（getStaticProps、getServerSideProps），
 * 展示了"默认静态生成"的效果：
 * - 构建时自动生成 HTML
 * - 无需服务器端计算
 * - 极快的响应速度
 *
 * 这是最常见的页面类型：营销页面、法律条款、帮助文档等。
 */
export default function Terms() {
  return (
    <div>
      {/* 导航栏 */}
      <nav>
        <ul>
          <li><Link href="/">首页</Link></li>
          <li><Link href="/about">关于</Link></li>
          <li><Link href="/blog/1">博客</Link></li>
          <li><Link href="/terms">条款</Link></li>
        </ul>
      </nav>

      {/* 主要内容 */}
      <div className="container">
        <div className="card">
          <h1>服务条款</h1>

          <p>
            <span className="badge ssg">SSG</span>
            <span className="badge">纯静态</span>
          </p>

          <p className="intro">
            这是一个<strong>纯静态页面</strong>，展示了 Next.js 的默认静态生成能力。
          </p>

          <h2>什么是纯静态页面？</h2>

          <p>
            纯静态页面是指<strong>不需要任何数据获取</strong>的页面，只包含硬编码的内容。
            这类页面在构建时就会生成完整的 HTML 文件。
          </p>

          <div className="info-box">
            <h3>📦 构建时生成</h3>
            <p>
              运行 <code>npm run build</code> 时，Mini Next.js 会自动：
            </p>
            <ul>
              <li>✅ 渲染 React 组件为 HTML</li>
              <li>✅ 生成 <code>.next/static/terms.html</code></li>
              <li>✅ 生成 <code>.next/static/terms.json</code></li>
              <li>✅ 即使没有 <code>getStaticProps</code>！</li>
            </ul>
          </div>

          <h2>代码实现</h2>

          <pre>{`// pages/terms.jsx
export default function Terms() {
  return <div>服务条款内容</div>
}

// ✅ 没有 getStaticProps
// ✅ 没有 getServerSideProps
// ✅ 仍然会生成静态 HTML！
`}</pre>

          <h2>与其他页面类型的对比</h2>

          <table style={{ width: '100%', marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>页面类型</th>
                <th>数据获取</th>
                <th>构建产物</th>
                <th>运行时</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>纯静态页面</strong><br/>(本页面)</td>
                <td>无</td>
                <td>✅ 生成 HTML</td>
                <td>直接返回静态文件</td>
              </tr>
              <tr>
                <td><strong>带数据静态页面</strong><br/>(关于页面)</td>
                <td>getStaticProps</td>
                <td>✅ 生成 HTML</td>
                <td>直接返回静态文件</td>
              </tr>
              <tr>
                <td><strong>动态路由静态页面</strong><br/>(博客页面)</td>
                <td>getStaticPaths<br/>+ getStaticProps</td>
                <td>✅ 生成多个 HTML</td>
                <td>直接返回对应文件</td>
              </tr>
              <tr>
                <td><strong>服务端渲染</strong><br/>(首页)</td>
                <td>getServerSideProps</td>
                <td>❌ 不生成 HTML</td>
                <td>每次请求都渲染</td>
              </tr>
            </tbody>
          </table>

          <h2>为什么纯静态页面也要生成 HTML？</h2>

          <div className="info-box">
            <h3>💡 设计理念：Static by default</h3>
            <p>
              Next.js 的核心理念是<strong>"默认静态"</strong>：
            </p>
            <ul>
              <li>✅ 大部分网站内容是静态的（营销页面、文档、条款等）</li>
              <li>✅ 静态内容应该享受最佳性能（CDN 缓存、零服务器计算）</li>
              <li>✅ 不应该强制开发者添加 <code>getStaticProps</code></li>
              <li>✅ 只有明确需要动态数据的页面才用 <code>getServerSideProps</code></li>
            </ul>
          </div>

          <h2>性能优势</h2>

          <ul>
            <li>⚡ <strong>响应速度</strong>: &lt;10ms（直接读文件）</li>
            <li>📦 <strong>服务器负载</strong>: 零（无需计算）</li>
            <li>💰 <strong>成本</strong>: 最低（可用 CDN）</li>
            <li>🔍 <strong>SEO</strong>: 完美（搜索引擎直接爬取 HTML）</li>
          </ul>

          <h2>适用场景</h2>

          <div className="blog-list">
            <div className="blog-item">
              <h3>法律文档</h3>
              <p>服务条款、隐私政策、用户协议</p>
            </div>

            <div className="blog-item">
              <h3>营销页面</h3>
              <p>落地页、产品介绍、功能说明</p>
            </div>

            <div className="blog-item">
              <h3>帮助文档</h3>
              <p>FAQ、使用指南、API 文档</p>
            </div>
          </div>

          <h2>试试看</h2>

          <p>
            访问其他页面，观察不同的渲染策略：
          </p>

          <div className="blog-list">
            <div className="blog-item">
              <Link href="/" className="button">首页（SSR）</Link>
              <p>使用 getServerSideProps，每次请求都渲染</p>
            </div>

            <div className="blog-item">
              <Link href="/about" className="button">关于（SSG + 数据）</Link>
              <p>使用 getStaticProps，构建时获取数据</p>
            </div>

            <div className="blog-item">
              <Link href="/blog/1" className="button">博客（SSG + 动态）</Link>
              <p>使用 getStaticPaths + getStaticProps</p>
            </div>
          </div>

          <h2>总结</h2>

          <p>
            <strong>纯静态页面是 Web 开发的最佳实践</strong>：
          </p>

          <ul>
            <li>✅ 无需数据获取函数，代码最简单</li>
            <li>✅ 构建时自动生成 HTML，无需配置</li>
            <li>✅ 运行时直接返回文件，性能最优</li>
            <li>✅ 适用于大部分静态内容</li>
          </ul>

          <p style={{ marginTop: '2rem', color: '#666' }}>
            <em>这就是为什么 Next.js 采用"默认静态生成"的策略！</em>
          </p>
        </div>
      </div>

      <style>{`
        .intro {
          font-size: 1.1rem;
          background: #f0f9ff;
          padding: 1rem;
          border-left: 4px solid #0ea5e9;
          margin: 1.5rem 0;
        }

        .info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .info-box h3 {
          margin-top: 0;
          color: #0f172a;
        }

        .info-box ul {
          margin-bottom: 0;
        }

        table {
          border-collapse: collapse;
          margin: 1rem 0;
        }

        th, td {
          border: 1px solid #e2e8f0;
          padding: 0.75rem;
          text-align: left;
        }

        th {
          background: #f8fafc;
          font-weight: 600;
        }

        tbody tr:hover {
          background: #f8fafc;
        }

        code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1rem 0;
        }

        pre code {
          background: transparent;
          color: inherit;
        }
      `}</style>
    </div>
  )
}

/**
 * ✨ 关键点：没有任何数据获取函数
 *
 * 这个页面不需要：
 * - getStaticProps（不需要构建时数据）
 * - getServerSideProps（不需要运行时数据）
 * - getStaticPaths（不是动态路由）
 *
 * 但仍然会在构建时生成静态 HTML！
 *
 * 这就是 Next.js 的"默认静态生成"策略：
 * Static by default, dynamic when needed.
 */
