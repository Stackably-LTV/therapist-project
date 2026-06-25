import { getPostBySlug, getRelatedPosts } from '@/components/4cfaa22a2953';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
export default async function BlogPostPage({ params }) {
    const { slug } = await params;
    let post = null;
    let relatedPosts = [];
    try {
        post = await getPostBySlug(slug);
        if (post) {
            // Fetch related posts (excluding current post)
            relatedPosts = await getRelatedPosts(post.id, 3);
        }
    }
    catch (error) {
        console.error('Failed to fetch post:', error);
    }
    if (!post) {
        notFound();
    }
    return (<div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back button */}
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors font-medium">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Blog
          </Link>
        </div>

        {/* Article header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center text-slate-500 text-sm">
            <span>Published on {new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</span>
            {post.readingTime && (<span className="ml-4">• {post.readingTime} min read</span>)}
          </div>
        </header>

        {/* Article content */}
        <article className="prose prose-lg prose-slate max-w-none mb-16">
          {post.excerpt && (<p className="text-xl text-slate-600 mb-8 font-medium leading-relaxed">
              {post.excerpt}
            </p>)}

          {/* Render the Lexical content */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            {post.content ? (<div className="text-slate-700 leading-relaxed prose prose-slate max-w-none" dangerouslySetInnerHTML={{
                __html: post.content.root ? post.content.root.children?.map((child) => {
                    // Simple text extraction for now - you can enhance this
                    if (child.type === 'paragraph' && child.children) {
                        return `<p>${child.children.map((c) => c.text || '').join('')}</p>`;
                    }
                    return '';
                }).join('') || 'Content loading...' : 'Content not available.'
            }}/>) : (<p className="text-slate-700 leading-relaxed">
                Article content will be rendered here once the rich text content is properly processed.
              </p>)}
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (<section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (<article key={relatedPost.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 line-clamp-2">
                      <Link href={`/blog/${relatedPost.slug}`} className="hover:text-emerald-600 transition-colors">
                        {relatedPost.title}
                      </Link>
                    </h3>

                    {relatedPost.excerpt && (<p className="text-slate-600 mb-4 line-clamp-2 text-sm">
                        {relatedPost.excerpt}
                      </p>)}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {new Date(relatedPost.createdAt).toLocaleDateString()}
                      </span>
                      <Link href={`/blog/${relatedPost.slug}`} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                        Read →
                      </Link>
                    </div>
                  </div>
                </article>))}
            </div>
          </section>)}

        {/* Article footer */}
        <footer className="pt-8 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              Last updated: {new Date(post.updatedAt).toLocaleDateString()}
            </div>

            <Link href="/blog" className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              Read More Articles
            </Link>
          </div>
        </footer>
      </div>
    </div>);
}
