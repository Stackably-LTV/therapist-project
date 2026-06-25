'use client';
import Link from "next/link";
export default function BlogCard({ image, category, title, excerpt, readTime, date, categoryColor = "text-[hsl(var(--lavender))]", slug }) {
    return (<Link href={`/Therapist-Easton-PA/${slug}`} className="block h-full">
      <article className="glass-card rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col">
        <img src={image} alt={title} className="w-full h-48 object-cover flex-shrink-0"/>
        <div className="p-6 flex flex-col flex-1">
          <div className={`text-sm ${categoryColor} font-medium mb-2 uppercase tracking-wide`}>
            {category}
          </div>
          <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
            {title}
          </h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-1">
            {excerpt}
          </p>
          <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-100 mt-auto">
            <span>{readTime}</span>
            <span>{date}</span>
          </div>
        </div>
      </article>
    </Link>);
}
