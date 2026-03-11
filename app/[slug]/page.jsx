import Image from 'next/image';
import { notFound } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import PostDetailClient from '../../components/PostDetailClient';
import { supabase } from '../../lib/supabase';

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function generateStaticParams() {
  const { data: posts } = await supabase.from('blog_posts').select('slug').eq('published', true);
  return (posts || []).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('seo_title, seo_description')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  return {
    title: post?.seo_title || 'QWP Insights',
    description: post?.seo_description || 'Intelligence for the modern revenue architecture.',
  };
}

export default async function PostPage({ params }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  if (!post) notFound();

  const { data: related } = await supabase
    .from('blog_posts')
    .select('slug, title, category, read_time_minutes')
    .eq('published', true)
    .eq('category', post.category)
    .neq('slug', params.slug)
    .limit(3);

  const headings = post.content?.match(/^## (.+)$/gm)?.map((h) => h.replace('## ', '')) || [];

  return (
    <main>
      <NavBar active="Insights" />

      <section className="relative pt-40 pb-16 bg-charcoal overflow-hidden reveal-up">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] text-platinum/40 uppercase tracking-[0.3em] mb-5">
              <a href="/" className="hover:text-teal">Insights</a> / {post.category}
            </p>
            <div className="flex items-center gap-3 mb-5">
              <span className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded border border-teal/30 bg-teal/10 text-teal">
                {post.category}
              </span>
              <span className="font-mono text-[9px] text-platinum/30">·</span>
              <span className="font-mono text-[9px] text-platinum/40">{formatDate(post.published_at)}</span>
              <span className="font-mono text-[9px] text-platinum/30">·</span>
              <span className="font-mono text-[9px] text-platinum/40">{post.read_time_minutes || 5} min read</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-medium leading-[1.02] tracking-tight mb-8 text-platinum">{post.title}</h1>
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-white/8 max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center">
                  <span className="font-serif text-teal font-bold">K</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-platinum">Kendra Lewis</div>
                  <div className="font-mono text-[8px] text-platinum/30 uppercase tracking-widest">Managing Partner, QWP</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-platinum/40 text-sm">
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=https://insights.quietwealthpartners.com/${post.slug}`} target="_blank" rel="noreferrer" className="hover:text-teal">In</a>
                <a href={`https://twitter.com/intent/tweet?url=https://insights.quietwealthpartners.com/${post.slug}`} target="_blank" rel="noreferrer" className="hover:text-teal">X</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-[420px] bg-charcoal reveal-up">
        {post.cover_image_url ? (
          <Image src={post.cover_image_url} alt={post.title} width={1600} height={840} className="w-full h-full object-cover" priority />
        ) : (
          <div className="w-full h-full grid place-items-center text-platinum/20 font-mono text-[10px] uppercase tracking-widest">
            No cover image
          </div>
        )}
      </div>

      <PostDetailClient post={post} related={related || []} headings={headings} />

      <section className="py-24 bg-darkGreen relative z-20 overflow-hidden reveal-up">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-px w-12 bg-teal" />
            <span className="font-mono text-[10px] tracking-[0.4em] font-bold uppercase text-teal/70">Next Step</span>
            <div className="h-px w-12 bg-teal" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-platinum mb-6 leading-tight">Assess Your Revenue Flow</h2>
          <a
            href="https://diagnostic.quietwealthpartners.com"
            className="inline-flex items-center justify-center border border-teal bg-transparent text-platinum px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-teal hover:text-charcoal transition-all duration-300"
          >
            Assess Revenue Flow
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
