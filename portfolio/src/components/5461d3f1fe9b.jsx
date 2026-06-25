"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/c2f62fb0cb5e";
import { Badge } from "@/components/30348591d689";
import BlogCard from "@/components/598405bf7919";
import { Search } from "lucide-react";
export default function Blog() {
    const [selectedCategory, setSelectedCategory] = useState("All Posts");
    const [searchQuery, setSearchQuery] = useState("");
    // Fetch blog posts from Payload API
    const { data: response, isLoading } = useQuery({
        queryKey: ["posts", "all", { status: "published", sort: "-publishedDate" }],
        queryFn: async () => {
            const baseParams = new URLSearchParams();
            baseParams.set("where[status][equals]", "published");
            baseParams.set("sort", "-publishedDate");
            const pageSize = 100;
            let page = 1;
            let allDocs = [];
            let totalDocs = 0;
            // Page through results so we always show "all" posts, even if there are more than 100.
            // Payload REST typically returns pagination fields like totalDocs/totalPages/hasNextPage.
            while (true) {
                const params = new URLSearchParams(baseParams);
                params.set("limit", String(pageSize));
                params.set("page", String(page));
                const url = `/api/posts?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok)
                    throw new Error("Failed to fetch posts");
                const data = (await res.json());
                const docs = (Array.isArray(data.docs) ? data.docs : []).filter((doc) => doc?.status === "published");
                if (page === 1) {
                    totalDocs =
                        typeof data.totalDocs === "number" ? data.totalDocs : docs.length;
                }
                allDocs = allDocs.concat(docs);
                const hasNext = typeof data.hasNextPage === "boolean"
                    ? data.hasNextPage
                    : typeof data.nextPage === "number"
                        ? true
                        : typeof data.totalPages === "number"
                            ? page < data.totalPages
                            : docs.length === pageSize;
                if (!hasNext)
                    break;
                page += 1;
            }
            return { docs: allDocs, totalDocs };
        },
    });
    const posts = response?.docs || [];
    // Extract unique categories from posts (using tags if available)
    const categories = [
        "All Posts",
        ...Array.from(new Set(posts.flatMap((post) => {
            // Add any custom categories logic here
            return [];
        }))).slice(0, 6),
    ];
    // Filter posts based on category and search
    const filteredPosts = posts.filter((post) => {
        const matchesSearch = searchQuery === "" ||
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.excerpt &&
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });
    // Convert Payload posts to blog card format
    const formatPostsForDisplay = (posts) => {
        return posts.map((post) => ({
            image: (typeof post.featuredImage === "object" && post.featuredImage?.url) ||
                "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
            category: "THERAPY",
            title: post.title,
            excerpt: post.excerpt || "",
            readTime: "5 min read",
            date: new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
            categoryColor: "text-[hsl(var(--lavender))]",
            slug: post.slug || "",
        }));
    };
    const blogPosts = formatPostsForDisplay(filteredPosts);
    if (isLoading) {
        return (<div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-full h-12 w-12 border-b-2 border-[hsl(var(--midnight))]" aria-label="Loading"></div>
      </div>);
    }
    return (<div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white pt-28 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-[hsl(var(--midnight))] mb-6" style={{ color: "hsl(215, 25%, 27%)" }}>
              Therapy Blog Bethlehem PA
            </h1>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto font-medium" style={{ color: "rgb(51, 65, 85)" }}>
              Expert insights from your Psychologist in Bethlehem PA serving
              Easton PA, Allentown PA, and the entire Lehigh Valley.
              Evidence-based articles on trauma therapy, OCD treatment, and
              mental health.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 -mt-16 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
                <Input placeholder="Search articles..." className="pl-10 h-12 border-2 border-slate-200 focus:border-[hsl(var(--lavender))]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
              </div>

              {/* Category Filter */}
              {categories.length > 1 && (<div className="flex flex-wrap gap-2 items-center">
                  {categories.map((category) => (<Badge key={category} variant={selectedCategory === category ? "default" : "outline"} className={`cursor-pointer transition-all px-4 py-2 ${selectedCategory === category
                    ? "bg-[hsl(var(--lavender))] text-white hover:bg-[hsl(var(--lavender))]/90"
                    : "hover:bg-slate-100"}`} onClick={() => setSelectedCategory(category)}>
                      {category}
                    </Badge>))}
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {blogPosts.length === 0 ? (<div className="text-center py-20">
              <p className="text-xl text-slate-600">
                No articles found matching your search.
              </p>
            </div>) : (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (<div key={post.slug}>
                  <BlogCard {...post}/>
                </div>))}
            </div>)}
        </div>
      </section>
    </div>);
}
