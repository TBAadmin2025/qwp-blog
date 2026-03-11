import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import InsightsClient from '../components/InsightsClient';
import { supabase } from '../lib/supabase';

export const revalidate = 60;

export default async function HomePage() {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let posts = [];

  if (hasSupabaseEnv) {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, category, cover_image_url, tags, featured, published_at, read_time_minutes, author_name, author_title')
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false });

    posts = data || [];
  }

  const featured = posts?.find((post) => post.featured);
  const grid = posts?.filter((post) => !post.featured) || [];

  return (
    <main>
      <NavBar active="Insights" />

      <InsightsClient featured={featured} grid={grid} />

      <Footer />
    </main>
  );
}
