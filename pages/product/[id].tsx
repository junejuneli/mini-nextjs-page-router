import Link from '../../client/link.js'
import type { GetStaticPathsResult } from '../../types/index.js'

/**
 * Test page: Dynamic route with getStaticPaths but NO getStaticProps
 *
 * This tests the fixed logic that allows SSG without getStaticProps
 * The page should render with empty props
 */

interface ProductProps {
  id?: string
}

export default function Product({ id }: ProductProps): JSX.Element {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/product/1">Product 1</Link>
          </li>
          <li>
            <Link href="/product/2">Product 2</Link>
          </li>
        </ul>
      </nav>

      <div className="container">
        <div className="card">
          <h1>Product Page</h1>

          <p>
            <span className="badge ssg">SSG</span>
            <span className="badge">Dynamic Route</span>
            <span className="badge">No getStaticProps</span>
          </p>

          <h2>Product ID: {id || 'Not provided'}</h2>

          <div style={{ marginTop: '2rem' }}>
            <h3>Test Case</h3>
            <p>This page demonstrates:</p>
            <ul>
              <li>
                ✅ Dynamic route with <code>getStaticPaths</code>
              </li>
              <li>
                ✅ NO <code>getStaticProps</code> (should use empty props)
              </li>
              <li>✅ Should be pre-rendered as SSG</li>
              <li>✅ ID should be undefined (no props passed)</li>
            </ul>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>Other Products</h3>
            <div className="blog-list">
              <div className="blog-item">
                <h4>Product 1</h4>
                <Link href="/product/1">View Product</Link>
              </div>
              <div className="blog-item">
                <h4>Product 2</h4>
                <Link href="/product/2">View Product</Link>
              </div>
              <div className="blog-item">
                <h4>Product 3</h4>
                <Link href="/product/3">View Product</Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link href="/" className="button">
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <footer>
        <p>Mini Next.js - Educational Implementation</p>
      </footer>
    </div>
  )
}

/**
 * Define paths to pre-generate
 *
 * Note: We intentionally do NOT export getStaticProps
 * to test that the build system handles this correctly
 */
export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  return {
    paths: [{ params: { id: '1' } }, { params: { id: '2' } }, { params: { id: '3' } }],
    fallback: false,
  }
}

// NOTE: No getStaticProps exported!
// This should still work - pages will render with empty props
