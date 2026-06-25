import configPromise from "@payload-config";
import { getPayload } from "payload";
// Cache Payload instance to maintain MongoDB connection
let cachedPayload = null;
async function getPayloadInstance() {
    if (cachedPayload) {
        return cachedPayload;
    }
    cachedPayload = await getPayload({
        config: configPromise,
    });
    return cachedPayload;
}
export async function getPostBySlug(slug) {
    try {
        const payload = await getPayloadInstance();
        const result = await payload.find({
            collection: "posts",
            where: {
                and: [
                    {
                        slug: {
                            equals: slug,
                        },
                    },
                    {
                        status: {
                            equals: "published",
                        },
                    },
                ],
            },
            limit: 1,
            depth: 2,
        });
        return result.docs[0] || null;
    }
    catch (error) {
        console.error("Error fetching post:", error);
        return null;
    }
}
export async function getPosts(options) {
    try {
        const payload = await getPayloadInstance();
        // If search query provided, search directly in posts
        if (options?.search) {
            const searchQuery = options.search.trim();
            try {
                // Search directly in posts collection
                const searchWhere = {
                    and: [
                        {
                            status: {
                                equals: "published",
                            },
                        },
                        {
                            or: [
                                {
                                    title: {
                                        contains: searchQuery,
                                    },
                                },
                                {
                                    excerpt: {
                                        contains: searchQuery,
                                    },
                                },
                            ],
                        },
                    ],
                };
                if (options?.category) {
                    searchWhere.and.push({
                        categories: {
                            contains: options.category,
                        },
                    });
                }
                const searchResults = await payload.find({
                    collection: "posts",
                    where: searchWhere,
                    limit: options?.limit || 10,
                    page: options?.page || 1,
                    sort: options?.sort || "-publishedDate",
                    depth: 2,
                });
                // Extract post IDs from search results
                const postIds = searchResults.docs
                    .map((searchDoc) => {
                    const docValue = searchDoc.doc?.value;
                    // doc.value can be a string ID or populated object
                    if (typeof docValue === "string") {
                        return docValue;
                    }
                    if (docValue && typeof docValue === "object" && "id" in docValue) {
                        return docValue.id;
                    }
                    return null;
                })
                    .filter((id) => Boolean(id));
                // If we found search results, fetch the actual posts
                if (postIds.length > 0) {
                    const postsWhere = {
                        and: [
                            {
                                id: {
                                    in: postIds,
                                },
                            },
                            {
                                status: {
                                    equals: "published",
                                },
                            },
                        ],
                    };
                    if (options?.category) {
                        postsWhere.and.push({
                            categories: {
                                contains: options.category,
                            },
                        });
                    }
                    const postsResult = await payload.find({
                        collection: "posts",
                        where: postsWhere,
                        limit: options?.limit || 10,
                        page: options?.page || 1,
                        sort: options?.sort || "-publishedDate",
                        depth: 2,
                    });
                    // Sort by relevance (prioritize title matches)
                    const sortedDocs = postsResult.docs.sort((a, b) => {
                        const query = searchQuery.toLowerCase();
                        const aTitle = (a.title || "").toLowerCase();
                        const bTitle = (b.title || "").toLowerCase();
                        // Exact title match first
                        if (aTitle === query && bTitle !== query)
                            return -1;
                        if (aTitle !== query && bTitle === query)
                            return 1;
                        // Title starts with query
                        if (aTitle.startsWith(query) && !bTitle.startsWith(query))
                            return -1;
                        if (!aTitle.startsWith(query) && bTitle.startsWith(query))
                            return 1;
                        // Title contains query
                        if (aTitle.includes(query) && !bTitle.includes(query))
                            return -1;
                        if (!aTitle.includes(query) && bTitle.includes(query))
                            return 1;
                        return 0;
                    });
                    return {
                        ...postsResult,
                        docs: sortedDocs,
                    };
                }
            }
            catch (searchError) {
                console.warn("Search plugin query failed, falling back to direct posts query:", searchError);
                // Fall through to direct posts query
            }
        }
        // Direct posts query (for non-search or fallback)
        const where = {
            and: [
                {
                    status: {
                        equals: "published",
                    },
                },
            ],
        };
        if (options?.search) {
            const searchQuery = options.search.trim();
            where.and.push({
                or: [
                    {
                        title: {
                            contains: searchQuery,
                        },
                    },
                    {
                        excerpt: {
                            contains: searchQuery,
                        },
                    },
                ],
            });
        }
        if (options?.category) {
            where.and.push({
                categories: {
                    contains: options.category,
                },
            });
        }
        const result = await payload.find({
            collection: "posts",
            where,
            limit: options?.limit || 10,
            page: options?.page || 1,
            sort: options?.sort || "-publishedDate",
            depth: 2,
        });
        return result;
    }
    catch (error) {
        console.error("Error fetching posts:", error);
        return {
            docs: [],
            totalDocs: 0,
            limit: 10,
            totalPages: 0,
            page: 1,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
        };
    }
}
// Categories collection removed - not in use
export async function getFeaturedPost() {
    try {
        const payload = await getPayloadInstance();
        const result = await payload.find({
            collection: "posts",
            where: {
                and: [
                    {
                        status: {
                            equals: "published",
                        },
                    },
                ],
            },
            limit: 1,
            sort: "-publishedDate",
            depth: 2,
        });
        return result.docs[0] || null;
    }
    catch (error) {
        console.error("Error fetching featured post:", error);
        return null;
    }
}
/**
 * Get site settings from Payload (site-settings global removed)
 */
export async function getSiteSettings() {
    try {
        // Site settings global removed - return defaults
        return {
            site: {
                name: "Not Your Traditional Therapist",
                description: "Expert therapy services in Bethlehem, Easton, Allentown PA",
                url: typeof window !== "undefined"
                    ? window.location.origin
                    : "https://drphilippellegrino.com",
            },
        };
    }
    catch (error) {
        console.error("Error fetching site settings:", error);
        // Return defaults if error
        return {
            site: {
                name: "Rizwan Nur Blog",
                description: "Thoughts on software craftsmanship, modern development practices, and creating elegant solutions to complex problems.",
                url: "http://localhost:3000",
            },
            author: {
                name: "Rizwan Nur",
                bio: "Full-stack developer passionate about building performant and user-friendly web applications.",
                role: "Full-stack Developer",
            },
            hero: {
                title: "Building for the Modern Web",
                description: "Thoughts on software craftsmanship, modern development practices, and creating elegant solutions to complex problems.",
            },
            socialLinks: {
                twitter: "",
                github: "",
                linkedin: "",
            },
            about: {
                content: null,
                skills: [],
            },
            footer: {
                copyrightText: "© 2026 Dr. Philip Pellegrino. All Rights Reserved.",
                privacyPolicyUrl: "",
                rssFeedUrl: "/api/rss",
            },
        };
    }
}
export async function getRelatedPosts(currentPostId, limit = 3) {
    try {
        const payload = await getPayloadInstance();
        const result = await payload.find({
            collection: "posts",
            where: {
                and: [
                    {
                        status: {
                            equals: "published",
                        },
                    },
                    {
                        id: {
                            not_equals: currentPostId,
                        },
                    },
                ],
            },
            limit,
            sort: "-publishedDate",
            depth: 2,
        });
        return result.docs;
    }
    catch (error) {
        console.error("Error fetching related posts:", error);
        return [];
    }
}
/**
 * Convert Lexical content to HTML string
 */
export function lexicalToHTML(lexicalContent) {
    if (!lexicalContent?.root) {
        return "";
    }
    try {
        // Basic HTML conversion from Lexical
        // For full conversion, you'd use @payloadcms/richtext-lexical's HTML serializer
        // This is a simplified version
        let html = "";
        function processNode(node) {
            if (!node)
                return "";
            switch (node.type) {
                case "heading":
                    const level = node.tag?.replace("h", "") || "2";
                    const text = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<h${level} id="${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${text}</h${level}>`;
                case "paragraph":
                    const paraText = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<p>${paraText}</p>`;
                case "text":
                    let textContent = node.text || "";
                    if (node.format & 1)
                        textContent = `<strong>${textContent}</strong>`; // bold
                    if (node.format & 2)
                        textContent = `<em>${textContent}</em>`; // italic
                    if (node.format & 4)
                        textContent = `<code>${textContent}</code>`; // code
                    return textContent;
                case "list":
                    const listType = node.listType === "number" ? "ol" : "ul";
                    const listItems = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<${listType}>${listItems}</${listType}>`;
                case "listitem":
                    const itemText = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<li>${itemText}</li>`;
                case "quote":
                    const quoteText = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<blockquote>${quoteText}</blockquote>`;
                case "code":
                    const codeText = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<pre><code>${codeText}</code></pre>`;
                case "link":
                    const linkText = node.children?.map((child) => processNode(child)).join("") ||
                        "";
                    return `<a href="${node.url || "#"}">${linkText}</a>`;
                case "horizontalrule":
                    return `<hr class="my-8 border-t-2 border-black" />`;
                case "linebreak":
                    return "<br />";
                case "upload":
                case "image":
                    // Handle uploaded images from Lexical
                    // In Payload Lexical, upload nodes can have value as ID or populated object
                    const uploadValue = node.value || node.src || node.relationTo;
                    if (!uploadValue) {
                        // Try alternative structures
                        if (node.relationTo === "media" && node.value) {
                            const mediaId = typeof node.value === "string"
                                ? node.value
                                : node.value.id || node.value;
                            if (mediaId) {
                                return `<figure class="my-8">
                  <img 
                    src="/api/media/file/${mediaId}" 
                    alt="${node.alt || "Image"}" 
                    class="w-full h-auto border-2 border-black shadow-hard object-contain"
                    loading="lazy"
                  />
                </figure>`;
                            }
                        }
                        return "";
                    }
                    // uploadValue can be a string (ID) or an object (populated media)
                    let imageUrl = "";
                    let altText = node.alt || "Image";
                    if (typeof uploadValue === "string") {
                        // If it's just an ID, construct the Payload media URL
                        imageUrl = `/api/media/file/${uploadValue}`;
                    }
                    else if (typeof uploadValue === "object" && uploadValue !== null) {
                        // If populated, we have the full media object
                        if (uploadValue.url) {
                            imageUrl = uploadValue.url;
                        }
                        else if (uploadValue.id) {
                            imageUrl = `/api/media/file/${uploadValue.id}`;
                        }
                        else {
                            // Fallback: try to get ID from the object
                            const mediaId = uploadValue.toString?.() || uploadValue;
                            if (mediaId) {
                                imageUrl = `/api/media/file/${mediaId}`;
                            }
                        }
                        altText = uploadValue.alt || uploadValue.filename || altText;
                    }
                    if (!imageUrl)
                        return "";
                    // Get dimensions if available
                    const width = node.width ||
                        (typeof uploadValue === "object" && uploadValue?.width) ||
                        undefined;
                    const height = node.height ||
                        (typeof uploadValue === "object" && uploadValue?.height) ||
                        undefined;
                    const caption = node.caption
                        ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${node.caption}</figcaption>`
                        : "";
                    return `<figure class="my-8">
            <img 
              src="${imageUrl}" 
              alt="${altText}" 
              ${width ? `width="${width}"` : ""} 
              ${height ? `height="${height}"` : ""}
              class="w-full h-auto border-2 border-black shadow-hard object-contain"
              loading="lazy"
            />
            ${caption}
          </figure>`;
                default:
                    // For unknown node types, try to process children if they exist
                    if (node.children && Array.isArray(node.children)) {
                        return node.children
                            .map((child) => processNode(child))
                            .join("");
                    }
                    // Log unknown node types for debugging (only in development)
                    if (process.env.NODE_ENV === "development" && node.type) {
                        console.warn("Unknown Lexical node type:", node.type, node);
                    }
                    return "";
            }
        }
        if (lexicalContent.root.children) {
            html = lexicalContent.root.children
                .map((child) => processNode(child))
                .join("");
        }
        return html;
    }
    catch (error) {
        console.error("Error converting Lexical to HTML:", error);
        return "";
    }
}
