import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { blogPosts } from '../data/blogPosts';

export default function BlogIndexPage() {
  const posts = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="content-page">
      <Seo
        title="Blogs"
        description="Insights on C&I renewable energy procurement, open access, PPAs and India's solar market from the Wattmatch team."
        path="/blog"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Resources</span>
            <h1>Blogs</h1>
            <p>Notes on C&amp;I renewable procurement, regulation and the Indian solar market.</p>
          </div>
        </div>

        <section>
          <div className="wrap">
            {posts.length === 0 ? (
              <p className="ws-source">No posts yet, check back soon.</p>
            ) : (
              <div className="mgmt-grid">
                {posts.map((post) => (
                  <div className="mgmt-card blog-card" key={post.slug}>
                    <h3><Link to={`/blog/${post.slug}`}>{post.title} <span className="btn-arrow">→</span></Link></h3>
                    <p className="legal-updated">{post.date}</p>
                    <p>{post.excerpt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
