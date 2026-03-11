'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PostCard from './PostCard';

const CATEGORIES = [
  'All',
  'Revenue Systems',
  'Brand & Identity',
  'AI & Automation',
  'Growth Strategy',
  'Operations',
];

function normalize(value) {
  return (value || '').toLowerCase();
}

function matchesCategory(postCategory, activeCategory) {
  if (activeCategory === 'All') return true;

  const value = normalize(postCategory);
  const active = normalize(activeCategory);

  if (value === active) return true;
  if (active === 'brand & identity') return value.includes('brand') || value.includes('identity');
  if (active === 'revenue-ready websites') return value.includes('website') || value.includes('web');
  if (active === 'social & acquisition') return value.includes('social') || value.includes('acquisition');
  if (active === 'funnels & client journey') return value.includes('funnel') || value.includes('journey');
  if (active === 'delivery architecture') return value.includes('delivery') || value.includes('architecture');
  if (active === 'ai & custom tech') return value.includes('ai') || value.includes('automation') || value.includes('custom tech');

  return false;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function categoryClass(category) {
  const value = (category || '').toLowerCase();
  if (value.includes('system') || value.includes('website') || value.includes('funnel')) return 'cat-systems';
  if (value.includes('brand')) return 'cat-brand';
  if (value.includes('ai') || value.includes('automation') || value.includes('custom tech')) return 'cat-ai';
  if (value.includes('growth') || value.includes('strategy') || value.includes('delivery') || value.includes('architecture')) {
    return 'cat-strategy';
  }
  return 'cat-systems';
}

export default function InsightsClient({ featured, grid }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(6);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const filteredPosts = useMemo(() => {
    const merged = featured ? [featured, ...grid] : [...grid];
    return merged.filter((post) => matchesCategory(post.category, activeCategory));
  }, [activeCategory, grid]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;
  const activeFeatured = visiblePosts.find((post) => post.featured);
  const cardPosts = visiblePosts.filter((post) => !activeFeatured || post.id !== activeFeatured.id);

  async function submitNewsletter(event) {
    event.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      await fetch('https://qwp-newsletter-sync.square-bush-83cc.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubscribed(true);
    } catch {
      setSending(false);
      return;
    }
    setSending(false);
  }

  return (
    <>
      <section className="relative pt-48 pb-24 bg-charcoal overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at left center, rgba(0,255,196,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="absolute right-0 top-1/3 w-[400px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right center, rgba(5,64,62,0.18) 0%, transparent 65%)' }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl reveal-up">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-px w-12 bg-teal" />
              <span className="font-mono text-[10px] tracking-[0.4em] font-bold uppercase text-teal/70">Insights</span>
            </div>
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-medium leading-[1.0] tracking-tight mb-8">
              <span className="text-platinum">The quiet intelligence</span>
              <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-teal via-platinum to-platinum/60">
                behind loud results.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-platinum/50 font-light leading-relaxed max-w-2xl">
              Fortune 500 thinking for Main Street businesses. The frameworks, systems, and strategy behind how we design invisible revenue infrastructure - written down.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 reveal-up" style={{ transitionDelay: '100ms' }}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setVisibleCount(6);
                }}
                className={`font-mono text-[9px] uppercase tracking-widest px-4 py-2 rounded border transition-all ${
                  activeCategory === category
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-white/10 text-platinum/50 hover:border-teal/40 hover:text-platinum'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeFeatured ? (
        <section className="bg-charcoal pb-8 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Link
              href={`/${activeFeatured.slug}`}
              className="featured-card block bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-teal/30 transition-colors duration-500 reveal-up"
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-teal opacity-60" />
              <div className="grid lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto min-h-[320px] bg-darkGreen/20 overflow-hidden">
                  {activeFeatured.cover_image_url ? (
                    <Image
                      src={activeFeatured.cover_image_url}
                      alt={activeFeatured.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 grid-bg opacity-30" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-10">
                          <div className="w-20 h-20 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-network-wired text-teal text-2xl" />
                          </div>
                          <div className="font-mono text-[9px] text-teal/50 uppercase tracking-widest">Featured Post</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 bg-teal text-charcoal font-bold rounded">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-10 md:p-14 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border ${categoryClass(activeFeatured.category)}`}
                      >
                        {activeFeatured.category}
                      </span>
                      <span className="font-mono text-[9px] text-platinum/30">·</span>
                      <span className="font-mono text-[9px] text-platinum/40">{formatDate(activeFeatured.published_at)}</span>
                      <span className="font-mono text-[9px] text-platinum/30">·</span>
                      <span className="font-mono text-[9px] text-platinum/40">{activeFeatured.read_time_minutes || 8} min read</span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl text-platinum font-normal leading-tight mb-5">{activeFeatured.title}</h2>
                    <p className="text-platinum/50 font-light leading-relaxed text-base mb-8">{activeFeatured.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-white/8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center">
                        <span className="font-serif text-teal text-xs font-bold">{activeFeatured.author_name?.charAt(0) || 'Q'}</span>
                      </div>
                      <div>
                        <div className="font-bold text-[10px] uppercase tracking-widest text-platinum">{activeFeatured.author_name}</div>
                        <div className="font-mono text-[9px] text-platinum/40">{activeFeatured.author_title}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-teal font-bold uppercase tracking-widest">Read Article →</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="py-20 bg-platinum relative z-20">
        <div className="absolute inset-0 light-grid-bg pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between mb-12 reveal-up">
            <div className="flex items-center gap-6">
              <div className="h-px w-12 bg-teal" />
              <span className="font-mono text-[10px] tracking-[0.4em] font-bold uppercase text-darkGreen">Latest</span>
            </div>
            <span className="font-mono text-[9px] text-charcoal/30 uppercase tracking-widest">{filteredPosts.length} Articles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.length === 0
              ? (
                  <div className="col-span-full text-center py-20">
                    <p className="text-charcoal/50 text-lg">New insights coming soon.</p>
                  </div>
                )
              : cardPosts.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    category={post.category}
                    cover_image_url={post.cover_image_url}
                    published_at={post.published_at}
                    read_time_minutes={post.read_time_minutes}
                    tags={post.tags}
                    delay={50 + idx * 50}
                  />
                ))}
          </div>

          {hasMore ? (
            <div className="text-center mt-14 reveal-up">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="border border-charcoal/20 text-charcoal px-10 py-4 font-mono text-[10px] uppercase tracking-widest hover:border-teal hover:text-darkGreen transition-all duration-300"
              >
                Load More Articles
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-24 bg-darkGreen relative z-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-darkGreen rounded-full mix-blend-screen blur-[160px] opacity-20 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center relative z-10 reveal-up">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-px w-12 bg-teal" />
            <span className="font-mono text-[10px] tracking-[0.4em] font-bold uppercase text-teal/70">Stay Sharp</span>
            <div className="h-px w-12 bg-teal" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-platinum mb-5 leading-tight">
            Get the insights
            <br />
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-teal to-platinum">
              before everyone else does.
            </span>
          </h2>
          <p className="text-platinum/50 font-light text-lg leading-loose mb-10 max-w-xl mx-auto">
            Revenue architecture thinking, delivered monthly. No noise. Just the frameworks and intelligence that actually move
            businesses forward.
          </p>
          <div className="relative max-w-md mx-auto">
            {!subscribed ? (
              <form onSubmit={submitNewsletter} className="flex items-center transition-opacity duration-500">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                  className="bg-white/5 border border-white/10 text-platinum text-sm px-5 py-4 w-full focus:outline-none focus:border-teal/50 transition-colors placeholder:text-platinum/30"
                  required
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-teal text-charcoal px-6 py-4 font-bold text-[10px] uppercase tracking-widest hover:bg-platinum transition-colors whitespace-nowrap min-w-[120px] disabled:opacity-70"
                >
                  {sending ? 'Sending...' : 'Subscribe'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0 text-teal">
                  ✓
                </div>
                <p className="text-sm text-platinum font-medium">You're in. Talk soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
