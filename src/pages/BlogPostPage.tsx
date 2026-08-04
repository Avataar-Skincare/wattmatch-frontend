import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { blogPosts } from '../data/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="content-page">
        <Seo title="Post not found" description="This blog post could not be found." path={`/blog/${slug ?? ''}`} />
        <Header />
        <main>
          <div className="page-hero">
            <div className="wrap">
              <h1>Post not found</h1>
              <p>This post may have been moved or removed. <Link to="/blog">Back to the blog →</Link></p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author ?? 'Wattmatch' },
  };

  return (
    <div className="content-page">
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
        publishedTime={post.date}
        structuredData={structuredData}
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Blogs</span>
            <h1>{post.title}</h1>
            <p className="legal-updated">{post.date}{post.author ? ` · ${post.author}` : ''}</p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <div className="legal-block">
              {post.content.map((block, i) =>
                block.type === 'h2' ? <h2 key={i}>{block.text}</h2> : <p key={i}>{block.text}</p>
              )}
            </div>
            <p className="ws-source"><Link to="/blog">← Back to all posts</Link></p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
