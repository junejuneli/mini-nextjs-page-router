import Link from '../../../client/link.js'
import type {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from '../../../types/index.js'

/**
 * 嵌套动态路由示例页面
 *
 * 演示多级动态参数：/blog/[category]/[id]
 * 例如：/blog/tech/123, /blog/design/456
 *
 * 这个页面展示了如何使用 getStaticPaths 生成多个参数的所有组合
 */

interface Post {
  id: string
  title: string
  author: string
  date: string
  content: string
}

interface Category {
  name: string
  slug: string
  description: string
}

interface CategoryPostProps {
  post: Post
  category: Category
}

export default function CategoryPost({ post, category }: CategoryPostProps): JSX.Element {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link href="/">首页</Link>
          </li>
          <li>
            <Link href="/about">关于</Link>
          </li>
          <li>
            <Link href="/blog/1">博客（单层）</Link>
          </li>
          <li>
            <Link href="/blog/tech/1">技术博客</Link>
          </li>
        </ul>
      </nav>

      <div className="container">
        <div className="card">
          <h1>{post.title}</h1>

          <p>
            <span className="badge ssg">SSG</span>
            <span className="badge">嵌套动态路由</span>
          </p>

          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            分类: <strong>{category.name}</strong> | 作者: {post.author} | 发布时间: {post.date} | 文章ID:{' '}
            {post.id}
          </p>

          <div
            style={{
              marginTop: '2rem',
              lineHeight: '1.8',
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <h2>嵌套动态路由原理</h2>

          <p>这个页面展示了如何实现嵌套动态路由（多个动态参数）：</p>

          <ul>
            <li>
              文件路径: <code>pages/blog/[category]/[id].jsx</code>
            </li>
            <li>
              URL 格式: <code>/blog/&#123;category&#125;/&#123;id&#125;</code>
            </li>
            <li>
              实际URL示例: <code>/blog/tech/1</code>, <code>/blog/design/2</code>
            </li>
            <li>
              参数对象: <code>&#123; category: 'tech', id: '1' &#125;</code>
            </li>
          </ul>

          <h2>查看其他文章</h2>

          <div className="blog-list">
            <div className="blog-item">
              <h3>技术分类</h3>
              <p>浏览技术相关文章</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link href="/blog/tech/1" className="button">
                  文章 #1
                </Link>
                <Link href="/blog/tech/2" className="button">
                  文章 #2
                </Link>
                <Link href="/blog/tech/3" className="button">
                  文章 #3
                </Link>
              </div>
            </div>

            <div className="blog-item">
              <h3>设计分类</h3>
              <p>浏览设计相关文章</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link href="/blog/design/1" className="button">
                  文章 #1
                </Link>
                <Link href="/blog/design/2" className="button">
                  文章 #2
                </Link>
              </div>
            </div>

            <div className="blog-item">
              <h3>商业分类</h3>
              <p>浏览商业相关文章</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link href="/blog/business/1" className="button">
                  文章 #1
                </Link>
                <Link href="/blog/business/2" className="button">
                  文章 #2
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link href="/" className="button">
              返回首页
            </Link>
          </div>
        </div>
      </div>

      <footer>
        <p>Mini Next.js - 嵌套动态路由示例</p>
      </footer>
    </div>
  )
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const categories = ['tech', 'design', 'business']

  const postsPerCategory: Record<string, string[]> = {
    tech: ['1', '2', '3'],
    design: ['1', '2'],
    business: ['1', '2', '3', '4'],
  }

  const paths = []

  for (const category of categories) {
    const postIds = postsPerCategory[category] || []
    for (const id of postIds) {
      paths.push({
        params: {
          category,
          id,
        },
      })
    }
  }

  console.log(`生成 ${paths.length} 个嵌套动态路由路径`)

  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext): Promise<GetStaticPropsResult<CategoryPostProps>> {
  const categories: Record<string, Category> = {
    tech: { name: '技术', slug: 'tech', description: '技术相关文章' },
    design: { name: '设计', slug: 'design', description: '设计相关文章' },
    business: { name: '商业', slug: 'business', description: '商业相关文章' },
  }

  const postsData: Record<string, Post> = {
    'tech-1': {
      id: '1',
      title: '深入理解 React Hooks',
      author: 'Claude',
      date: '2025-10-31',
      content:
        'React Hooks 是 React 16.8 引入的新特性，它允许你在不编写 class 组件的情况下使用 state 和其他 React 特性。\n\nHooks 的核心思想是将组件逻辑从组件中抽离出来，形成可复用的函数。',
    },
    'tech-2': {
      id: '2',
      title: 'TypeScript 最佳实践',
      author: 'Claude',
      date: '2025-10-30',
      content:
        'TypeScript 为 JavaScript 添加了静态类型系统，可以在编译时发现错误，提高代码质量。\n\n合理使用 TypeScript 可以让代码更加健壮，同时提供更好的 IDE 支持和自动补全。',
    },
    'tech-3': {
      id: '3',
      title: '现代前端构建工具对比',
      author: 'Claude',
      date: '2025-10-29',
      content:
        'Webpack、Vite、Rollup、esbuild 等构建工具各有优劣，选择合适的工具对项目至关重要。\n\nWebpack 功能强大但配置复杂，Vite 开发体验极佳但生态相对较新。',
    },
    'design-1': {
      id: '1',
      title: 'UI/UX 设计原则',
      author: 'Claude',
      date: '2025-10-28',
      content:
        '优秀的 UI/UX 设计需要遵循一些基本原则，包括一致性、简洁性、可访问性等。\n\n好的设计不仅美观，更重要的是要提升用户体验，让用户能够高效完成任务。',
    },
    'design-2': {
      id: '2',
      title: '色彩理论在 Web 设计中的应用',
      author: 'Claude',
      date: '2025-10-27',
      content:
        '色彩是设计中最重要的元素之一，正确的配色可以传达情感、引导视线、提升品牌认知。\n\n理解色彩心理学和配色原理对于创建有吸引力的界面至关重要。',
    },
    'business-1': {
      id: '1',
      title: '创业公司的产品策略',
      author: 'Claude',
      date: '2025-10-26',
      content:
        '创业公司需要快速验证产品市场契合度，找到真正的用户痛点。\n\nMVP（最小可行产品）是常用的策略，通过快速迭代获取用户反馈。',
    },
    'business-2': {
      id: '2',
      title: '如何构建高效的远程团队',
      author: 'Claude',
      date: '2025-10-25',
      content:
        '远程工作已成为趋势，但管理远程团队需要不同的方法和工具。\n\n清晰的沟通、合理的工作流程、适当的工具支持是远程团队成功的关键。',
    },
    'business-3': {
      id: '3',
      title: 'SaaS 商业模式解析',
      author: 'Claude',
      date: '2025-10-24',
      content:
        'SaaS（软件即服务）是当前最流行的商业模式之一，具有可预测的收入和高扩展性。\n\n理解 SaaS 的核心指标（如 MRR、Churn Rate、LTV/CAC）对于运营至关重要。',
    },
    'business-4': {
      id: '4',
      title: '数据驱动的决策方法',
      author: 'Claude',
      date: '2025-10-23',
      content:
        '在信息时代，数据是最宝贵的资产，学会用数据驱动决策是必备技能。\n\n建立合理的指标体系、收集有效数据、进行科学分析是数据驱动的基础。',
    },
  }

  const category: Category = categories[params.category!] || {
    name: '未知分类',
    slug: params.category || 'unknown',
    description: '分类不存在',
  }

  const postKey = `${params.category}-${params.id}`
  const post: Post = postsData[postKey!] || {
    id: params.id || 'unknown',
    title: '文章未找到',
    author: 'Unknown',
    date: new Date().toISOString().split('T')[0] || '',
    content: '抱歉，找不到这篇文章。',
  }

  return {
    props: {
      post,
      category,
    },
  }
}
