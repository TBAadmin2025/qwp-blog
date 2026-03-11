'use client';

import { useEffect, useMemo, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

function parseSections(content) {
  const chunks = (content || '').split(/^## /gm);
  if (!chunks.length) return [];

  const sections = [];
  if (chunks[0].trim()) {
    sections.push({ heading: null, body: chunks[0].trim() });
  }

  for (let i = 1; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const firstNewline = chunk.indexOf('\n');
    if (firstNewline === -1) {
      sections.push({ heading: chunk.trim(), body: '' });
      continue;
    }
    const heading = chunk.slice(0, firstNewline).trim();
    const body = chunk.slice(firstNewline + 1).trim();
    sections.push({ heading, body });
  }

  return sections;
}

export default function PostDetailClient({ post, related, headings }) {
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    function onScroll() {
      const article = document.getElementById('article-body');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const pct = Math.max(0, Math.min(100, (passed / Math.max(total, 1)) * 100));
      setProgress(Number.isFinite(pct) ? pct : 0);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      setEmail('');
    } finally {
      setSending(false);
    }
  }

  const sections = useMemo(() => parseSections(post.content), [post.content]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-teal/15 z-[70]">
        <div className="h-full bg-teal transition-all duration-200" style={{ width: `${progress}%` }} />
      </div>

      <section className="bg-platinum py-20 relative reveal-up">
        <div className="absolute inset-0 light-grid-bg pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 grid lg:grid-cols-[1fr_320px] gap-12">
          <article id="article-body" className="max-w-3xl">
            {sections.map((section, index) => {
              const headingId = section.heading
                ? section.heading
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')
                : null;

              const sectionContent = section.heading
                ? `## ${section.heading}\n\n${section.body}`
                : section.body;

              return (
                <div key={`${section.heading || 'intro'}-${index}`}>
                  {headingId ? <div id={headingId} className="scroll-mt-32" /> : null}
                  <MarkdownRenderer content={sectionContent} />

                  {index === 3 ? (
                    <div className="my-12 rounded-2xl border border-teal/30 bg-gradient-to-br from-darkGreen to-charcoal p-7 text-platinum">
                      {!subscribed ? (
                        <>
                          <div className="h-[2px] w-14 bg-teal mb-5" />
                          <h3 className="font-serif text-2xl mb-3">Get insights like this delivered monthly.</h3>
                          <form onSubmit={submitNewsletter} className="flex flex-col sm:flex-row gap-3 mt-5">
                            <input
                              type="email"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="Email address"
                              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-sm"
                              required
                            />
                            <button
                              type="submit"
                              disabled={sending}
                              className="bg-teal text-charcoal px-6 py-3 rounded-xl font-mono text-[10px] uppercase tracking-widest disabled:opacity-70"
                            >
                              {sending ? 'Sending...' : 'Subscribe'}
                            </button>
                          </form>
                        </>
                      ) : (
                        <p className="text-teal font-medium">You're in. Talk soon.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className="flex flex-wrap gap-2 mt-10">
              {(post.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded border border-darkGreen/25 text-darkGreen bg-darkGreen/5"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-black/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-charcoal border border-teal/30 flex items-center justify-center">
                <span className="font-serif text-teal font-bold">K</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-charcoal">Kendra Lewis</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50">Managing Partner, QWP</div>
                <p className="text-sm text-charcoal/65 mt-1">Designing revenue systems that make growth predictable for established service firms.</p>
              </div>
            </div>
          </article>

          <aside className="lg:sticky lg:top-[120px] h-fit space-y-5">
            <div className="bg-charcoal rounded-2xl p-6 border-t-2 border-teal text-platinum">
              <h3 className="font-serif text-2xl leading-tight mb-4 text-platinum">Is your revenue architecture working?</h3>
              <a
                href="https://diagnostic.quietwealthpartners.com"
                className="inline-flex items-center justify-center w-full border border-teal bg-teal/10 text-teal px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-teal hover:text-charcoal transition-all duration-300"
              >
                Assess Revenue Flow
              </a>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-black/8">
              <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 mb-3">Table of contents</p>
              <div className="space-y-2">
                {headings.map((heading, index) => {
                  const id = heading
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-');

                  return (
                    <a key={id} href={`#${id}`} className="block text-sm text-charcoal/70 hover:text-darkGreen">
                      <span className="font-mono text-[9px] text-teal mr-2">{index + 1}</span>
                      {heading}
                    </a>
                  );
                })}
              </div>
            </div>

            {related?.length ? (
              <div className="bg-white rounded-2xl p-6 border border-black/8">
                <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 mb-3">Related posts</p>
                <div className="space-y-3">
                  {related.map((item) => (
                    <a key={item.slug} href={`/${item.slug}`} className="block">
                      <p className="text-sm text-charcoal hover:text-darkGreen">{item.title}</p>
                      <p className="font-mono text-[9px] text-charcoal/40 mt-1">{item.read_time_minutes || 5} min read</p>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
