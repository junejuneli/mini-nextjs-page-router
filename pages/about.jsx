import React from 'react'
import Link from '../client/link.jsx'

/**
 * 关于页面组件
 *
 * 演示 SSG（静态生成）
 * 使用 getStaticProps 在构建时生成静态 HTML
 */
export default function About({ buildTime, projectInfo }) {
  return (
    <div>
      {/* 导航栏 */}
      <nav>
        <ul>
          <li><Link href="/">首页</Link></li>
          <li><Link href="/about">关于</Link></li>
          <li><Link href="/blog/1">博客</Link></li>
        </ul>
      </nav>

      {/* 主要内容 */}
      <div className="container">
        <div className="card">
          <h1>关于 Mini Next.js</h1>

          <p>
            <span className="badge ssg">SSG</span>
            这个页面使用静态生成（Static Site Generation）
          </p>

          <h2>项目信息</h2>
          <p><strong>名称:</strong> {projectInfo.name}</p>
          <p><strong>版本:</strong> {projectInfo.version}</p>
          <p><strong>描述:</strong> {projectInfo.description}</p>
          <p><strong>构建时间:</strong> {buildTime}</p>

          <p>
            这个页面是在构建时（运行 <code>npm run build</code> 时）预渲染的。
            HTML 文件已经生成好了，服务器直接返回静态文件，速度非常快！
          </p>

          <h2>静态生成的优势</h2>
          <ul>
            <li>⚡ 响应速度极快 - 直接返回静态 HTML</li>
            <li>📦 可以使用 CDN 缓存 - 降低服务器负载</li>
            <li>🔍 SEO 友好 - 搜索引擎可以直接爬取 HTML</li>
            <li>💰 成本低 - 不需要服务器端计算</li>
          </ul>

          <h2>适用场景</h2>
          <ul>
            <li>内容不经常变化的页面（如本页面）</li>
            <li>营销页面和落地页</li>
            <li>博客文章和文档</li>
            <li>产品展示页面</li>
          </ul>

          <h2>工作原理</h2>
          <pre>{`// pages/about.jsx
export async function getStaticProps() {
  // 在构建时运行，获取数据
  const data = await fetchData()

  return {
    props: { data }
  }
}

export default function About({ data }) {
  return <div>{data}</div>
}`}</pre>

          <h2>核心概念</h2>

          <div className="blog-list">
            <div className="blog-item">
              <h3>构建时生成</h3>
              <p>
                运行 <code>npm run build</code> 时，Mini Next.js 会调用
                <code>getStaticProps</code>，获取数据并渲染组件，
                生成 HTML 和 JSON 文件保存到 <code>.next/static/</code> 目录。
              </p>
            </div>

            <div className="blog-item">
              <h3>运行时服务</h3>
              <p>
                当用户访问这个页面时，服务器直接读取预生成的 HTML 文件返回，
                无需重新渲染，速度非常快。
              </p>
            </div>

            <div className="blog-item">
              <h3>客户端hydrate</h3>
              <p>
                浏览器接收到 HTML 后，加载 JavaScript bundle，
                React 进行hydrate，页面变为完全交互式。
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link href="/" className="button">返回首页</Link>
          </div>
        </div>
      </div>

      <footer>
        <p>Mini Next.js - 一个用于学习的简化版 Next.js Page Router</p>
      </footer>
    </div>
  )
}

/**
 * getStaticProps
 *
 * 这个函数在构建时运行
 * 返回的 props 会传递给页面组件，并生成静态 HTML
 *
 * @returns {Object} 包含 props 的对象
 */
export async function getStaticProps() {
  // 模拟数据获取
  const buildTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  })

  const projectInfo = {
    name: 'Mini Next.js',
    version: '1.0.0',
    description: '一个用于学习 Next.js Page Router 核心原理的简化实现',
    features: [
      '基于文件系统的路由',
      '服务端渲染 (SSR)',
      '静态生成 (SSG)',
      '动态路由',
      '客户端路由',
      'React hydrate',
    ],
  }

  return {
    props: {
      buildTime,
      projectInfo,
    },
  }
}
