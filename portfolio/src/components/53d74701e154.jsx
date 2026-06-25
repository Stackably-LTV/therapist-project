import { getPosts } from '@/components/4cfaa22a2953';
import Link from 'next/link';
export default async function BlogPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
    let posts = [];
    let totalPages = 1;
    let totalDocs = 0;
    try {
        const response = await getPosts({ limit: 12, page });
        posts = response.docs;
        totalPages = response.totalPages;
        totalDocs = response.totalDocs;
    }
    catch (error) {
        console.error('Failed to fetch posts:', error);
        // Return empty arrays on error
    }
    return (<div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Blog</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Insights, tips, and professional guidance on mental health, trauma recovery, and therapeutic approaches.
          </p>
          {totalDocs > 0 && (<p className="text-sm text-slate-500 mt-2">
              {totalDocs} post{totalDocs !== 1 ? 's' : ''} total
            </p>)}
        </div>

        {posts.length === 0 ? (<div className="text-center py-16">
            <p className="text-lg text-slate-600">
              No blog posts available yet. Check back soon!
            </p>
          </div>) : (<>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (<article key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-3 line-clamp-2">
                      <Link href={`/blog/${post.slug}`} className="hover:text-emerald-600 transition-colors">
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (<p className="text-slate-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>)}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <Link href={`/blog/${post.slug}`} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                        Read more →
                      </Link>
                    </div>
                  </div>
                </article>))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (<div className="flex justify-center space-x-2">
                {page > 1 ? (<Link href={`/blog?page=${page - 1}`} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Previous
                  </Link>) : (<span className="px-4 py-2 bg-gray-100 border border-slate-300 rounded-lg text-gray-400 cursor-not-allowed">
                    Previous
                  </span>)}

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (<Link key={pageNum} href={`/blog?page=${pageNum}`} className={`px-4 py-2 border rounded-lg ${pageNum === page
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                      {pageNum}
                    </Link>);
                })}

                {page < totalPages ? (<Link href={`/blog?page=${page + 1}`} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Next
                  </Link>) : (<span className="px-4 py-2 bg-gray-100 border border-slate-300 rounded-lg text-gray-400 cursor-not-allowed">
                    Next
                  </span>)}
              </div>)}
          </>)}
      </div>
    </div>);
}
