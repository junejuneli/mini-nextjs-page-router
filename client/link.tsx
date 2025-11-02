import React, { ReactNode, AnchorHTMLAttributes } from 'react'
import { useRouter } from './router.js'

/**
 * Link 组件
 *
 * 类似于 Next.js 的 Link 组件
 * 用于客户端路由导航，避免整页刷新
 *
 * ⚠️ SSR 兼容性：
 * - 在服务端渲染时，降级为普通 <a> 标签
 * - 在客户端hydrate后，自动变为交互式链接
 * - 这样确保 SEO 友好，同时提供良好的用户体验
 *
 * 使用示例：
 * ```jsx
 * <Link href="/about">关于我们</Link>
 * <Link href="/blog/123" prefetch={false}>博客文章</Link>
 * ```
 */

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  children: ReactNode
  prefetch?: boolean
}

export default function Link({
  href,
  children,
  prefetch = true,
  ...props
}: LinkProps): JSX.Element {
  // ✅ 总是调用 Hook（符合 React Hooks 规则）
  // 不能在条件语句中调用 Hook！
  // useRouter 在 SSR 时返回 null，在客户端返回 router 实例
  const router = useRouter()

  // SSR 降级逻辑：
  // 如果 router 为 null（服务端渲染或没有 RouterProvider），
  // 返回普通 <a> 标签，确保 SEO 友好
  if (!router) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }

  /**
   * 点击链接时的处理函数
   * 阻止默认跳转行为，使用客户端路由导航
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 如果按住 Ctrl/Cmd 键，允许在新标签页打开
    if (e.metaKey || e.ctrlKey) {
      return
    }

    // 阻止默认的页面跳转
    e.preventDefault()

    // 使用客户端路由导航
    router.push(href)
  }

  /**
   * 鼠标悬停时预取页面数据
   * 这样当用户点击时，数据已经缓存好了，导航会更快
   */
  const handleMouseEnter = () => {
    if (prefetch && router.prefetch) {
      router.prefetch(href)
    }
  }

  return (
    <a href={href} onClick={handleClick} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </a>
  )
}
