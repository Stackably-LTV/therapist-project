'use client';
import React from 'react';
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/2795b661f080";
// Function to render markdown-like content from Lexical
function renderContent(content) {
    if (!content)
        return null;
    // If content is a Lexical JSON structure
    if (content.root && content.root.children) {
        return renderLexicalNodes(content.root.children);
    }
    // Fallback to string rendering
    if (typeof content === 'string') {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold text-[hsl(var(--midnight))] mb-6 mt-8">{line.slice(2)}</h1>;
            }
            else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4 mt-6">{line.slice(3)}</h2>;
            }
            else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3 mt-4">{line.slice(4)}</h3>;
            }
            else if (line.startsWith('- ')) {
                return <li key={index} className="text-slate-700 leading-relaxed mb-1">{line.slice(2)}</li>;
            }
            else if (line.trim() === '') {
                return <br key={index}/>;
            }
            else if (line.startsWith('*') && line.endsWith('*')) {
                return <p key={index} className="text-slate-600 italic mb-4">{line.slice(1, -1)}</p>;
            }
            else {
                return <p key={index} className="text-slate-700 leading-relaxed mb-4">{line}</p>;
            }
        });
    }
    return null;
}
// Render Lexical nodes recursively
function renderLexicalNodes(nodes) {
    if (!nodes || !Array.isArray(nodes))
        return null;
    return nodes.map((node, index) => {
        if (node.type === 'paragraph') {
            return (<p key={index} className="text-slate-700 leading-relaxed mb-4">
          {node.children?.map((child, i) => renderLexicalNode(child, i))}
        </p>);
        }
        else if (node.type === 'heading') {
            const tag = node.tag || '2';
            const className = tag === '1'
                ? "text-3xl font-bold text-[hsl(var(--midnight))] mb-6 mt-8"
                : tag === '2'
                    ? "text-2xl font-semibold text-[hsl(var(--midnight))] mb-4 mt-6"
                    : "text-xl font-semibold text-[hsl(var(--midnight))] mb-3 mt-4";
            const children = node.children?.map((child, i) => renderLexicalNode(child, i));
            return tag === '1' ? (<h1 key={index} className={className}>{children}</h1>) : tag === '2' ? (<h2 key={index} className={className}>{children}</h2>) : tag === '3' ? (<h3 key={index} className={className}>{children}</h3>) : tag === '4' ? (<h4 key={index} className={className}>{children}</h4>) : tag === '5' ? (<h5 key={index} className={className}>{children}</h5>) : (<h6 key={index} className={className}>{children}</h6>);
        }
        else if (node.type === 'list') {
            const ListTag = node.listType === 'number' ? 'ol' : 'ul';
            return (<ListTag key={index} className="list-disc list-inside mb-4">
          {node.children?.map((child, i) => renderLexicalNodes([child]))}
        </ListTag>);
        }
        else if (node.type === 'listitem') {
            return (<li key={index} className="text-slate-700 leading-relaxed mb-1">
          {node.children?.map((child, i) => renderLexicalNode(child, i))}
        </li>);
        }
        return renderLexicalNode(node, index);
    });
}
function renderLexicalNode(node, index) {
    if (!node)
        return null;
    if (node.type === 'text') {
        let text = node.text;
        if (node.format & 1)
            text = <strong key={index}>{text}</strong>; // bold
        if (node.format & 2)
            text = <em key={index}>{text}</em>; // italic
        return text;
    }
    else if (node.type === 'link') {
        return (<a key={index} href={node.url} className="text-[hsl(var(--lavender))] hover:underline">
        {node.children?.map((child, i) => renderLexicalNode(child, i))}
      </a>);
    }
    return null;
}
export default function BlogPostPage() {
    const params = useParams();
    const slug = params?.slug;
    // Fetch blog post from Payload API
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['/api/posts', slug],
        queryFn: async () => {
            const res = await fetch(`/api/posts?where[slug][equals]=${slug}`);
            if (!res.ok) {
                throw new Error('Post not found');
            }
            return res.json();
        },
        enabled: !!slug
    });
    const post = response?.docs?.[0];
    if (isLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-[hsl(var(--cream))] to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>);
    }
    if (error || !post) {
        return (<div className="min-h-screen bg-gradient-to-br from-[hsl(var(--cream))] to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[hsl(var(--midnight))] mb-4">
              Post Not Found
            </h1>
            <p className="text-slate-600 mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <Link href="/Therapist-Easton-PA">
              <Button className="bg-[hsl(var(--midnight))] hover:bg-[hsl(var(--midnight))]/90">
                <ArrowLeft size={16} className="mr-2"/>
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-[hsl(var(--cream))] to-white">
      {/* Header */}
      <section className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Link href="/Therapist-Easton-PA">
            <Button variant="ghost" className="mb-6 text-[hsl(var(--midnight))] hover:bg-slate-100">
              <ArrowLeft className="mr-2" size={16}/>
              Back to Blog
            </Button>
          </Link>
          
          <div>
            {/* Featured Image */}
            {post.featuredImage && typeof post.featuredImage === 'object' && post.featuredImage.url && (<div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
                <img src={post.featuredImage.url} alt={post.title} className="w-full h-auto object-cover"/>
              </div>)}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-6">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-slate-600 mb-8 pb-8 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <User size={18}/>
                <span>Dr. Philip Pellegrino</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18}/>
                <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18}/>
                <span>5 min read</span>
              </div>
            </div>

            {/* Excerpt */}
            {post.excerpt && (<div className="text-xl text-slate-600 mb-8 font-medium italic">
                {post.excerpt}
              </div>)}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-slate max-w-none">
            <div className="text-slate-700 leading-relaxed">
              {renderContent(post.content)}
            </div>
          </article>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[hsl(var(--lavender))]/10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[hsl(var(--midnight))] mb-4">
            Ready to Start Your Healing Journey?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Schedule a consultation to learn more about our therapy intensives
          </p>
          <Button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} className="bg-[hsl(var(--midnight))] hover:bg-[hsl(var(--midnight))]/90 px-8 py-3">
            Schedule Consultation
          </Button>
        </div>
      </section>
    </div>);
}
