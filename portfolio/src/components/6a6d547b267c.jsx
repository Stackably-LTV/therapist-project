"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen } from "lucide-react";
import BlogCard from "@/components/598405bf7919";
export default function BlogPreview() {
    // Fetch blog posts from Payload API (limit to 3 for preview)
    const { data: response, isLoading } = useQuery({
        queryKey: [
            "posts",
            "preview",
            { limit: 3, status: "published", sort: "-publishedDate" },
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("limit", "3");
            params.set("where[status][equals]", "published");
            params.set("sort", "-publishedDate");
            const url = `/api/posts?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error("Failed to fetch posts");
            return res.json();
        },
    });
    const posts = (response?.docs || []).filter((doc) => doc?.status === "published");
    // Convert Payload posts to blog card format
    const blogPosts = posts.map((post) => ({
        image: (typeof post.featuredImage === "object" && post.featuredImage?.url) ||
            "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        category: "THERAPY",
        title: post.title,
        excerpt: post.excerpt || "",
        readTime: "5 min read",
        date: new Date(post.publishedDate || post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        categoryColor: "text-emerald-600",
        slug: post.slug || "",
    }));
    if (isLoading) {
        return (<section className="py-24 bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600" aria-label="Loading"></div>
          </div>
        </div>
      </section>);
    }
    return (<section className="py-24 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-emerald-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4 mr-2"/>
            Latest Insights
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Therapy Bethlehem PA - Latest Insights
          </h2>

          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Expert articles from your{" "}
            <span className="font-semibold text-slate-700">
              Psychologist in Bethlehem PA
            </span>{" "}
            serving Easton PA, Allentown PA, and the Lehigh Valley
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post, index) => (<div key={index}>
              <BlogCard {...post}/>
            </div>))}
        </div>

        <div className="text-center">
          <Link href="/Therapist-Easton-PA" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-full font-semibold hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-lg hover:shadow-xl">
            View All Articles
            <ArrowRight className="w-5 h-5"/>
          </Link>
        </div>
      </div>
    </section>);
}
