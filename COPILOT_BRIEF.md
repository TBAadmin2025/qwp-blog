# QWP Insights Blog — Copilot Build Brief
**Repo:** `qwp-blog`
**Deploy target:** Vercel → `insights.quietwealthpartners.com`
**Stack:** Next.js 14 (App Router), Supabase, Tailwind CSS, react-markdown

---

## WHERE TO PUT THE ADMIN FILE

The file `insights-admin.html` I have built is a **complete, self-contained admin tool**. Here is exactly where it goes and how to wire it:

1. Convert `insights-admin.html` into `/app/admin/page.jsx`
2. The HTML structure, all JS logic, and all CSS translate directly to JSX
3. The voice recorder uses React refs instead of DOM selectors — see pattern below
4. The `/api/transcribe` route already exists — copy it from the other project unchanged
5. Add `html2canvas` as a dependency: `npm install html2canvas`

**Key React conversion notes:**
- `document.getElementById(x).value` → use `useRef` or `useState`
- `innerHTML` assignments → use `dangerouslySetInnerHTML` for the markdown preview only
- The off-screen blog header canvas stays as a real DOM element with a ref
- All fetch calls to Anthropic API and Supabase stay identical

---

## ENVIRONMENT VARIABLES

Add to `.env.local` and `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://ohmyalwztlugwftoqjgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXlhbHd6dGx1Z3dmdG9xamdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDI3MTEsImV4cCI6MjA4ODQ3ODcxMX0.YhgcTS5De-pEUqJR7ClNJuf74In0EhiKnWLAu570q0c
OPENAI_API_KEY=sk-...  ← Kendra provides this
```

Note: The Anthropic API calls in the admin tool go through the browser directly using the artifact API proxy — no server route needed for Claude. Only Whisper needs the server route.

---

## SUPABASE SCHEMA

The `blog_posts` table and storage bucket already exist in Supabase. The schema includes these columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| slug | text | unique, URL-safe |
| title | text | |
| excerpt | text | |
| content | text | Markdown string |
| category | text | |
| cover_image_url | text | Supabase storage public URL |
| tags | text[] | Array e.g. `{'Revenue Systems','Growth'}` |
| featured | boolean | default false |
| published | boolean | default false |
| published_at | timestamptz | |
| seo_title | text | |
| seo_description | text | |
| read_time_minutes | int | |
| author_name | text | default 'Kendra Lewis' |
| author_title | text | default 'Managing Partner, QWP' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto-updated via trigger |

RLS is enabled. Public reads are limited to `published = true` rows. Anon inserts and updates are allowed (the admin page is password-gated instead).

---

## SUPABASE STORAGE

Bucket is already created: **`qwp-media`** (set to Public)

Images are stored at path: `blog/{slug}-{timestamp}.png`

Public URL format: `https://ohmyalwztlugwftoqjgm.supabase.co/storage/v1/object/public/qwp-media/blog/{filename}`

No additional storage config needed.

---

## FILE STRUCTURE TO BUILD

```
/app
  layout.jsx              ← shared fonts, metadata, global styles
  page.jsx                ← public blog index
  /[slug]
    page.jsx              ← individual post page
  /admin
    page.jsx              ← AI brain dump studio (converted from insights-admin.html)

/app/api
  /transcribe
    route.ts              ← Whisper transcription (copy from existing project exactly)

/components
  NavBar.jsx              ← split-domain nav (see nav rules below)
  Footer.jsx              ← hardcoded contact info (see below)
  PostCard.jsx            ← card used on index page
  MarkdownRenderer.jsx    ← renders post content from markdown

/lib
  supabase.js             ← Supabase client

/public
  (no static assets needed — fonts from Google, icons from CDN)

.env.local
.env.example
tailwind.config.js
next.config.js
package.json
```

---

## NAV COMPONENT — Split Domain Rules

The blog lives at `insights.quietwealthpartners.com`. Nav links go back to the main site.

```jsx
// NavBar.jsx
const links = [
  { label: 'Approach',      href: 'https://quietwealthpartners.com/approach' },
  { label: 'Capabilities',  href: 'https://quietwealthpartners.com/capabilities' },
  { label: 'Results',       href: 'https://quietwealthpartners.com/results' },
  { label: 'Insights',      href: '/' },  // ← root of THIS app, active
]
const ctaHref = 'https://diagnostic.quietwealthpartners.com'
const logoHref = 'https://quietwealthpartners.com'
```

Active state: `Insights` link always gets `text-teal` class since we're always on the blog.

---

## FOOTER — Hardcoded Values

```jsx
// Footer.jsx — use these hardcoded values, NOT GHL merge fields
phone:      '470-298-9563'
phoneHref:  'tel:4702989563'
address:    '3343 Peachtree Rd NE, Suite 145 PMB 1388, Atlanta, GA 30326, USA'
privacy:    'https://quietwealthpartners.com/privacy'
terms:      'https://quietwealthpartners.com/terms'
disclaimer: 'https://quietwealthpartners.com/disclaimer'
instagram:  'https://www.instagram.com/quietwealthpartners'
facebook:   'https://www.facebook.com/quietwealthpartners/'
linkedin:   'https://www.linkedin.com/company/quiet-wealth-partners'
copyright:  '© 2026 Quiet Wealth Partners. All rights reserved.'
```

Footer also includes a newsletter signup form that POSTs to:
`https://qwp-newsletter-sync.square-bush-83cc.workers.dev/`

Body: `{ email: "..." }`

---

## DESIGN SYSTEM — Apply Exactly

```js
// tailwind.config.js
colors: {
  platinum: '#F2F5F5',
  charcoal: '#0A0A0A',
  teal: '#00FFC4',
  darkGreen: '#05403E',
}
fonts: {
  sans:  ['Inter', 'sans-serif'],
  serif: ['"Playfair Display"', 'serif'],
  mono:  ['JetBrains Mono', 'monospace'],
}
```

Google Fonts import (in layout.jsx):
```
Inter: 300, 400, 500, 600, 700
Playfair Display: 400, 400i, 500, 500i, 600, 700, 800, 900
JetBrains Mono: 400, 500, 700
```

---

## PAGE 1: Blog Index `/app/page.jsx`

### Data fetching
```js
// Fetch all published posts, featured first, then by published_at desc
const { data: posts } = await supabase
  .from('blog_posts')
  .select('id, slug, title, excerpt, category, cover_image_url, tags, featured, published_at, read_time_minutes')
  .eq('published', true)
  .order('featured', { ascending: false })
  .order('published_at', { ascending: false })
```

### Layout
- Dark hero section: eyebrow "Insights", H1 "Intelligence for the modern revenue architecture.", category filter pills
- Category pills: All | Revenue Systems | Brand & Identity | AI & Automation | Growth Strategy | Operations
- Filtering is client-side — no refetch needed
- **Featured post** (if `featured: true`): full-width dark card, two-column layout (image left, text right), large serif title
- **Post grid**: platinum background, 3-column on desktop, white cards, teal category badge, hover lifts card with teal top border animation
- **Empty state**: if zero posts match filter, show: "New insights coming soon." centered, no placeholder cards
- **Zero posts total**: show: "New insights coming soon." — no grid at all
- Newsletter CTA section at bottom: darkGreen background

### PostCard component
```jsx
// /components/PostCard.jsx
// Props: slug, title, excerpt, category, cover_image_url, published_at, read_time_minutes, tags
// - White card, border border-black/8, rounded-2xl
// - Cover image at top (if cover_image_url exists — if not, show branded placeholder div with teal icon)
// - Category badge: font-mono, teal, small
// - Title: Playfair Display, charcoal
// - Excerpt: Inter light, charcoal/60
// - Read time + date: font-mono, small, charcoal/40
// - Hover: -translate-y-1, border-teal/20, teal top border slides in
// - Entire card is a link to /{slug}
```

---

## PAGE 2: Individual Post `/app/[slug]/page.jsx`

### Data fetching
```js
// generateStaticParams for SSG
const { data: posts } = await supabase.from('blog_posts').select('slug').eq('published', true)

// Individual page
const { data: post } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('slug', params.slug)
  .eq('published', true)
  .single()

// Related posts: same category, exclude current, limit 3
const { data: related } = await supabase
  .from('blog_posts')
  .select('slug, title, category, read_time_minutes')
  .eq('published', true)
  .eq('category', post.category)
  .neq('slug', params.slug)
  .limit(3)
```

### Layout — match design reference `insights-post.html` exactly

**Structure:**
1. Fixed nav with teal reading progress bar (2px, top of page, tracks scroll through article body)
2. Dark hero section (pt-40): breadcrumb → category badge + date + read time → H1 title → author byline + share buttons
3. Full-width cover image (420px height) — use `cover_image_url`. If null, show branded dark placeholder
4. Main content area: platinum background, two-column layout on desktop
   - Left: article body (max-w-3xl)
   - Right: sticky sidebar (w-80)
5. Bottom CTA section: darkGreen background → "Assess Your Revenue Flow" → diagnostic URL
6. Footer

**Article body typography** (must match exactly):
- H2: Playfair Display, 1.75rem, weight 500, border-bottom 1px solid rgba(0,0,0,0.08), margin-top 3rem
- H3: Playfair Display, 1.25rem, weight 500
- p: Inter, 1.0625rem, weight 300, color rgba(10,10,10,0.75), line-height 1.85
- ul li: teal dot (6px circle, absolute positioned), padding-left 1.5rem
- ol li: teal circle with JetBrains Mono number, darkGreen background
- blockquote: 3px teal left border, teal/4 background, Playfair italic, 1.2rem
- strong: weight 600, charcoal

**Inline newsletter** — embed mid-article after roughly the 3rd H2:
- Dark card (darkGreen → charcoal gradient), teal top line
- "Get insights like this delivered monthly." heading
- Email input + Subscribe button
- On submit: POST to `https://qwp-newsletter-sync.square-bush-83cc.workers.dev/` with `{ email }`
- Success: fade form out, show "You're in. Talk soon." with teal check

**Sidebar (sticky, top: 120px):**
1. CTA card: dark charcoal bg, teal top border, "Is your revenue architecture working?", "Assess Revenue Flow" button → `https://diagnostic.quietwealthpartners.com`
   - **All text in this card must be light (platinum/teal) — it is on a dark background**
2. Table of contents: white card, auto-generated from H2s in the content, numbered with teal mono numbers
3. Related posts: white card, 3 related posts pulled from Supabase by category match

**Tags** — render at bottom of article as small darkGreen bordered pills

**Author bio** — below tags: K avatar (charcoal circle, teal letter), name, title, one-line bio

**SEO metadata** — use `seo_title` and `seo_description` from the post record for `<head>` metadata via Next.js generateMetadata

### MarkdownRenderer component
```jsx
// /components/MarkdownRenderer.jsx
// Use: npm install react-markdown remark-gfm
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Custom component overrides to apply the exact typography styles above
// Map: h2, h3, p, ul, ol, li, blockquote, strong
// Apply classes that match the design system
```

**Table of contents generation:**
```js
// Parse H2s from markdown content to build TOC
const headings = content.match(/^## (.+)$/gm)?.map(h => h.replace('## ', '')) || []
```

---

## PAGE 3: Admin `/app/admin/page.jsx`

Convert `insights-admin.html` to React. The complete HTML file is in the repo root as `insights-admin.html` — use it as the exact reference.

### Password protection
Wrap the entire admin page in a simple password gate:

```jsx
// Simple client-side gate — not cryptographic, just keeps it unlisted
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'qwp-admin-2026'

// Show a password input before rendering the studio
// Store auth state in sessionStorage so it persists the tab session
```

Add `NEXT_PUBLIC_ADMIN_PASSWORD=your-password` to `.env.local`

### React conversion pattern for voice recorder:
```jsx
const mediaRecorderRef = useRef(null)
const streamRef = useRef(null)
const chunksRef = useRef([])
const audioBlobRef = useRef(null)
const audioPlayerRef = useRef(null)

// All the toggle/start/stop logic from the HTML file translates directly
// Just replace DOM manipulation with setState calls
```

### Key dependencies to install:
```bash
npm install html2canvas react-markdown remark-gfm
```

### The off-screen canvas for header image generation:
```jsx
const headerCanvasRef = useRef(null)

// Position it off-screen with inline styles
<div
  ref={headerCanvasRef}
  style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1200px', height: '630px' }}
>
  {/* Filled dynamically when generating image */}
</div>
```

### html2canvas call (2x for crisp PNG):
```js
const canvas = await html2canvas(headerCanvasRef.current, {
  scale: 2,
  width: 1200,
  height: 630,
  useCORS: true,
  backgroundColor: '#0A0A0A',
  logging: false,
})
canvas.toBlob(blob => { /* upload to Supabase */ }, 'image/png')
```

### Supabase image upload:
```js
// Upload to qwp-media bucket, blog/ folder
const filename = `blog/${slug}-${Date.now()}.png`
const response = await fetch(
  `${SUPABASE_URL}/storage/v1/object/qwp-media/${filename}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true'
    },
    body: blob
  }
)
// Public URL:
const coverImageUrl = `${SUPABASE_URL}/storage/v1/object/public/qwp-media/${filename}`
```

### Supabase post insert:
```js
const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(payload)
})
```

---

## TRANSCRIBE API ROUTE

Copy from existing project exactly as-is:

```ts
// /app/api/transcribe/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    const openai = new OpenAI({ apiKey })
    const transcription = await openai.audio.transcriptions.create({ file, model: 'whisper-1' })
    return NextResponse.json({ text: transcription.text || '' })
  } catch (err: any) {
    console.error('Transcription route error:', err)
    return NextResponse.json({ error: 'Transcription failed', details: err?.message }, { status: 500 })
  }
}
```

Install dependency: `npm install openai`

---

## DEPLOY TO VERCEL

1. Push repo to GitHub
2. Connect to Vercel, import `qwp-blog` repo
3. Add all environment variables in Vercel dashboard (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
4. Deploy
5. In Vercel project settings → Domains → Add `insights.quietwealthpartners.com`
6. In DNS (wherever QWP domain is managed): add CNAME record
   - Name: `insights`
   - Value: `cname.vercel-dns.com`

---

## WHAT IS NOT IN THIS BRIEF

These are handled elsewhere and do NOT need to be built here:

- The main QWP website pages (Homepage, Approach, Capabilities, Results) — those are GHL custom HTML pages built separately
- The GHL nav update (changing Insights link from `/insights` to `https://insights.quietwealthpartners.com`) — Kendra will update those pages separately
- Social media graphic templates — future project

---

## QUALITY CHECKLIST BEFORE HANDOFF

- [ ] Index page: renders 0 posts as "New insights coming soon." — no broken grid
- [ ] Index page: category filter works client-side, no empty card placeholders
- [ ] Post page: table of contents auto-generated from H2 headings
- [ ] Post page: sidebar CTA has light text (platinum/teal) — it's on a dark background
- [ ] Post page: related posts section shows nothing if no matches (not an error)
- [ ] Post page: cover image falls back gracefully if `cover_image_url` is null
- [ ] Admin: password gate works, session persists tab
- [ ] Admin: voice recording → Whisper transcription → Claude generation flow works end to end
- [ ] Admin: iterate loop maintains conversation history, Claude responds to feedback
- [ ] Admin: header image generates at 2x scale, uploads to `qwp-media/blog/`
- [ ] Admin: `cover_image_url` saved in database record
- [ ] Admin: published toggle + featured toggle save correctly
- [ ] All pages: mobile responsive
- [ ] All pages: nav links correct (split-domain rules above)
- [ ] Footer: hardcoded values, no GHL merge fields