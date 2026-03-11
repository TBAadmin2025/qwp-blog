import Image from 'next/image';
import Link from 'next/link';

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

function categoryIcon(category) {
  const value = (category || '').toLowerCase();
  if (value.includes('system') || value.includes('website') || value.includes('funnel')) return '⚙';
  if (value.includes('brand')) return '◈';
  if (value.includes('ai') || value.includes('automation') || value.includes('custom tech')) return '◉';
  if (value.includes('growth') || value.includes('strategy') || value.includes('delivery') || value.includes('architecture')) {
    return '↗';
  }
  return '●';
}

export default function PostCard({
  slug,
  title,
  excerpt,
  category,
  cover_image_url,
  published_at,
  read_time_minutes,
  delay = 0,
}) {
  return (
    <Link
      href={`/${slug}`}
      className="post-card reveal-up bg-white border border-black/8 rounded-2xl overflow-hidden flex flex-col"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative aspect-video overflow-hidden bg-darkGreen/10">
        {cover_image_url ? (
          <Image
            src={cover_image_url}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 light-grid-bg opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-darkGreen/20 border border-darkGreen/20 flex items-center justify-center text-darkGreen text-lg">
                {categoryIcon(category)}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-7 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border ${categoryClass(category)}`}>
            {category}
          </span>
          <span className="font-mono text-[9px] text-charcoal/30">{read_time_minutes || 5} min read</span>
        </div>
        <h3 className="font-serif text-xl text-charcoal font-normal leading-snug mb-3">{title}</h3>
        <p
          className="text-charcoal/50 text-sm font-light leading-relaxed mb-6"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {excerpt}
        </p>
        <div className="flex items-center justify-between pt-5 border-t border-black/6 mt-auto">
          <span className="font-mono text-[9px] text-charcoal/30">{formatDate(published_at)}</span>
          <span className="font-mono text-[10px] text-teal font-bold uppercase tracking-widest">Read →</span>
        </div>
      </div>
    </Link>
  );
}
