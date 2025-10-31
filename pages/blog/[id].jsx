import React from 'react'
import Link from '../../client/link.jsx'

/**
 * 博客文章页面组件
 *
 * 演示动态路由 + SSG
 * 使用 getStaticPaths 生成所有可能的路径
 * 使用 getStaticProps 为每个路径生成静态页面
 */
export default function BlogPost({ post }) {
  return (
    <div>
      {/* 导航栏 */}
      <nav>
        <ul>
          <li><Link href="/">首页</Link></li>
          <li><Link href="/about">关于</Link></li>
          <li><Link href="/blog/1">博客</Link></li>
          <li><Link href="/blog/tech/1">嵌套路由</Link></li>
        </ul>
      </nav>

      {/* 主要内容 */}
      <div className="container">
        <div className="card">
          <h1>{post.title}</h1>

          <p>
            <span className="badge ssg">SSG</span>
            <span className="badge">动态路由</span>
          </p>

          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            作者: {post.author} | 发布时间: {post.date} | ID: {post.id}
          </p>

          <div style={{ marginTop: '2rem', lineHeight: '1.8' }}>
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <h2>动态路由 + 静态生成</h2>

          <p>
            这个页面展示了如何结合动态路由和静态生成：
          </p>

          <ul>
            <li>
              路由路径: <code>/blog/[id].jsx</code>
            </li>
            <li>
              URL 格式: <code>/blog/1</code>, <code>/blog/2</code>, <code>/blog/3</code>
            </li>
            <li>
              在构建时，通过 <code>getStaticPaths</code> 指定要生成的所有路径
            </li>
            <li>
              对每个路径，调用 <code>getStaticProps</code> 获取数据并生成静态 HTML
            </li>
          </ul>

          <h2>工作流程</h2>

          <pre>{`// 1. 定义要生成的路径
export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: '1' } },
      { params: { id: '2' } },
      { params: { id: '3' } }
    ]
  }
}

// 2. 为每个路径获取数据
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.id)
  return { props: { post } }
}

// 3. 渲染组件
export default function BlogPost({ post }) {
  return <div>{post.title}</div>
}`}</pre>

          <h2>查看其他文章</h2>

          <div className="blog-list">
            <div className="blog-item">
              <h3>文章 #1</h3>
              <p>深入理解 Next.js Page Router</p>
              <Link href="/blog/1">阅读文章</Link>
            </div>

            <div className="blog-item">
              <h3>文章 #2</h3>
              <p>SSR vs SSG：如何选择？</p>
              <Link href="/blog/2">阅读文章</Link>
            </div>

            <div className="blog-item">
              <h3>文章 #3</h3>
              <p>React hydrate机制详解</p>
              <Link href="/blog/3">阅读文章</Link>
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
 * getStaticPaths
 *
 * 这个函数在构建时运行，返回所有需要预渲染的动态路由路径
 *
 * @returns {Object} 包含 paths 数组的对象
 */
export async function getStaticPaths() {
  // 在真实项目中，这里通常会：
  // 1. 从数据库查询所有文章 ID
  // 2. 从 CMS 或 API 获取内容列表
  // 3. 读取文件系统中的 markdown 文件

  // 这里我们手动指定要生成的路径
  const paths = [
    { params: { id: '1' } },
    { params: { id: '2' } },
    { params: { id: '3' } },
  ]

  return {
    paths,
    fallback: false, // 如果访问未定义的路径，返回 404
  }
}

/**
 * getStaticProps
 *
 * 这个函数为每个路径运行，获取对应的数据
 *
 * @param {Object} context - 上下文对象，包含 params
 * @returns {Object} 包含 props 的对象
 */
export async function getStaticProps({ params }) {
  // 模拟从数据库或 API 获取文章数据
  const posts = {
    '1': {
      id: '1',
      title: '深入理解 Next.js Page Router',
      author: 'Claude',
      date: '2025-10-31',
      content: `Next.js Page Router 是一个基于文件系统的路由系统，它将 pages 目录下的文件自动映射为应用的路由。

这种设计极大地简化了路由配置，开发者不需要手动定义路由规则，只需要创建文件即可。

本文将深入探讨 Page Router 的实现原理，包括路由匹配、服务端渲染、静态生成等核心概念。

通过实现一个简化版的 Page Router，我们可以更好地理解 Next.js 的工作机制，从而写出更高效的代码。`,
    },
    '2': {
      id: '2',
      title: 'SSR vs SSG：如何选择？',
      author: 'Claude',
      date: '2025-10-30',
      content: `服务端渲染（SSR）和静态生成（SSG）是 Next.js 提供的两种主要渲染策略。

SSR 适合数据频繁变化的页面，每次请求都在服务器上实时渲染，可以访问请求上下文（如 Cookie）。

SSG 适合内容相对固定的页面，在构建时预渲染，响应速度极快，可以使用 CDN 缓存。

选择哪种策略取决于你的具体需求：如果需要实时数据，选择 SSR；如果追求性能和成本，选择 SSG。`,
    },
    '3': {
      id: '3',
      title: 'React hydrate机制详解',
      author: 'Claude',
      date: '2025-10-29',
      content: `React hydrate（Hydration）是将服务器渲染的静态 HTML 转换为完全交互式 React 应用的过程。

服务器渲染的 HTML 只是静态标记，没有事件监听器。hydrate过程会将 React 组件"附加"到现有 DOM 上。

React 会验证服务器和客户端的渲染结果是否一致，如果不一致会发出警告。

理解hydrate机制对于避免常见的hydrate错误（如使用非确定性值）和优化性能至关重要。`,
    },
  }

  const post = posts[params.id] || {
    id: params.id,
    title: '文章未找到',
    author: 'Unknown',
    date: new Date().toISOString().split('T')[0],
    content: '抱歉，找不到这篇文章。',
  }

  return {
    props: {
      post,
    },
  }
}
