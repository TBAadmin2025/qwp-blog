'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'qwp-admin-2026';
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';

const KENDRA_SYSTEM = `You are the editorial AI for Quiet Wealth Partners, a revenue systems consultancy that brings Fortune 500 infrastructure to established service businesses.

Transform Kendra Lewis's brain dump into a polished blog post in her exact voice.

KENDRA'S VOICE:
- Opens with a real client situation or specific moment - never an abstract statement
- Short sentences. Deliberate line breaks for rhythm and drama.
- Builds toward a reveal - seems like one problem, exposes the real one
- Boardroom intelligence in plain language - confident, never academic, never motivational-speaker
- Rhetorical questions: "So what happened next?" / "Here's where things get interesting." / "And this is where most businesses get it wrong."
- Subtle wit: "Congratulations. You now own a $200,000 machine that no one knows exists."
- Pattern interrupts - challenges the obvious assumption before revealing the truth
- Ties to Six Streams (Brand, Website, Acquisition, Funnels, Delivery, Technology) naturally - never leads with the framework
- Mission: translate Fortune 500 thinking into Main Street reality

FORMATTING:
- ## H2 section headings
- ### H3 subheadings
- > blockquote for pull quotes (max 2 per post)
- - bullet lists
- **bold** for key emphasis
- Short paragraphs, never dense walls of text
- No H1 (that is the title field)

OUTPUT: Raw JSON only. No markdown fences. No preamble.

{
  "title": "specific compelling headline",
  "slug": "url-safe-slug",
  "excerpt": "2-3 sentence hook that demands to be read",
  "category": "one of: Revenue Systems, Brand & Identity, AI & Automation, Growth Strategy, Operations",
  "tags": ["tag1","tag2","tag3","tag4"],
  "content": "full article in markdown",
  "seo_title": "SEO title under 60 chars",
  "seo_description": "150-160 char meta description",
  "read_time_minutes": 6
}`;

function renderMarkdownPreview(md) {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hbul])(.+)$/gm, (m) => (m.startsWith('<') ? m : `<p>${m}</p>`));
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');

  const [step, setStep] = useState('dump');
  const [activeTab, setActiveTab] = useState('type');

  const [brainDump, setBrainDump] = useState('');
  const [transcript, setTranscript] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [generatedData, setGeneratedData] = useState(null);
  const [iterationHistory, setIterationHistory] = useState([]);
  const [draftVersion, setDraftVersion] = useState(1);

  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);

  const [headerImageBlob, setHeaderImageBlob] = useState(null);
  const [headerImageUrl, setHeaderImageUrl] = useState(null);

  const [feedback, setFeedback] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: 'Draft is ready. Read it over. Tell me what to change - tone, structure, a section, the intro, anything. Or hit Looks Good to finalize.',
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recMode, setRecMode] = useState('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [processingStep, setProcessingStep] = useState(1);

  const [statusBadge, setStatusBadge] = useState('Draft');
  const [publishedMessage, setPublishedMessage] = useState('Your post has been saved to the database.');
  const [savedSlug, setSavedSlug] = useState('');

  const [fieldTitle, setFieldTitle] = useState('');
  const [fieldSlug, setFieldSlug] = useState('');
  const [fieldExcerpt, setFieldExcerpt] = useState('');
  const [fieldCategory, setFieldCategory] = useState('Revenue Systems');
  const [fieldTags, setFieldTags] = useState('');
  const [fieldReadtime, setFieldReadtime] = useState(5);
  const [fieldSeoTitle, setFieldSeoTitle] = useState('');
  const [fieldSeoDesc, setFieldSeoDesc] = useState('');

  const headerCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const authed = sessionStorage.getItem('qwp-admin-authed') === '1';
    setIsAuthed(authed);
  }, []);

  useEffect(() => {
    if (recMode === 'recording') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recMode]);

  useEffect(() => {
    if (step !== 'processing') return;

    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 800);

    return () => clearInterval(interval);
  }, [step]);

  const timerText = useMemo(() => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timerSeconds]);

  function unlock(event) {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('qwp-admin-authed', '1');
      setIsAuthed(true);
    }
  }

  function getDumpText() {
    return activeTab === 'type' ? brainDump.trim() : transcript.trim();
  }

  async function callAnthropic(messages, system = KENDRA_SYSTEM) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (ANTHROPIC_API_KEY) {
      headers['x-api-key'] = ANTHROPIC_API_KEY;
      headers['anthropic-version'] = '2023-06-01';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async function toggleRecording() {
    if (recMode === 'idle' || recMode === 'ready') {
      try {
        chunksRef.current = [];
        audioBlobRef.current = null;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data?.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          audioBlobRef.current = blob;
          const audioUrl = URL.createObjectURL(blob);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.src = audioUrl;
          }
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setRecMode('ready');
        };

        setTimerSeconds(0);
        recorder.start();
        setRecMode('recording');
      } catch (error) {
        alert('Microphone access blocked. Allow mic permissions and try again.');
        setRecMode('idle');
      }
      return;
    }

    if (recMode === 'recording' && mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  async function transcribeAudio() {
    if (!audioBlobRef.current) return;

    try {
      setRecMode('transcribing');
      const formData = new FormData();
      formData.append('file', audioBlobRef.current, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');
      const data = await response.json();
      setTranscript((data?.text || '').trim());
      setRecMode('ready');
    } catch (error) {
      alert('Transcription failed. Paste transcript manually below.');
      setRecMode('ready');
    }
  }

  async function generateHeaderImage(title, category) {
    if (!headerCanvasRef.current) return;

    const accent = '#00FFC4';
    headerCanvasRef.current.innerHTML = `
      <div style="position:absolute;inset:0;background:#0A0A0A;"></div>
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:60px 60px;"></div>
      <div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(0,255,196,0.12) 0%,transparent 70%);border-radius:50%;"></div>
      <div style="position:absolute;bottom:-150px;left:-50px;width:400px;height:400px;background:radial-gradient(circle,rgba(5,64,62,0.3) 0%,transparent 70%);border-radius:50%;"></div>
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(to right,transparent,${accent},transparent);"></div>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:80px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
          <div style="height:1px;width:48px;background:${accent};"></div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${accent};letter-spacing:0.3em;text-transform:uppercase;">${category || 'Insights'}</span>
        </div>
        <h1 style="font-family:'Playfair Display',serif;font-size:${(title || '').length > 60 ? '52px' : '64px'};font-weight:500;color:#F2F5F5;line-height:1.1;max-width:900px;margin:0 0 40px 0;">${title || ''}</h1>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:40px;height:40px;border-radius:50%;background:rgba(0,255,196,0.1);border:1px solid rgba(0,255,196,0.2);display:flex;align-items:center;justify-content:center;">
            <span style="font-family:'Playfair Display',serif;color:${accent};font-weight:700;font-size:16px;">K</span>
          </div>
          <div>
            <div style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#F2F5F5;">Kendra Lewis</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(242,245,245,0.4);letter-spacing:0.2em;text-transform:uppercase;margin-top:2px;">Managing Partner, QWP</div>
          </div>
          <div style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(242,245,245,0.3);letter-spacing:0.2em;text-transform:uppercase;">quietwealthpartners.com</div>
        </div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(to right,${accent},transparent);"></div>
    `;

    await document.fonts.ready;

    const canvas = await html2canvas(headerCanvasRef.current, {
      scale: 2,
      width: 1200,
      height: 630,
      useCORS: true,
      backgroundColor: '#0A0A0A',
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(blob);
        setHeaderImageBlob(blob);
        setHeaderImageUrl(url);
        resolve(url);
      }, 'image/png');
    });
  }

  async function generatePost() {
    const dump = getDumpText();
    if (!dump || dump.length < 30) {
      alert(activeTab === 'voice' ? 'Please record and transcribe first, or type in the transcript box.' : 'Give me a bit more - at least a few sentences!');
      return;
    }

    setIsGenerating(true);
    setStep('processing');
    setProcessingStep(1);

    const userPrompt = `Transform this brain dump into a full Quiet Wealth Partners blog post in Kendra's voice.${selectedCategory ? ` Topic area hint: ${selectedCategory}.` : ''}\n\nBRAIN DUMP:\n${dump}`;

    try {
      const result = await callAnthropic([{ role: 'user', content: userPrompt }]);
      const text = result.content?.[0]?.text || '';
      let data;

      try {
        data = JSON.parse(text.trim());
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('JSON parse failed');
        data = JSON.parse(match[0]);
      }

      setGeneratedData(data);
      setIterationHistory([{ role: 'assistant', content: JSON.stringify(data) }]);
      setDraftVersion(1);
      setChatMessages([
        {
          role: 'ai',
          text: 'Draft is ready. Read it over. Tell me what to change - tone, structure, a section, the intro, anything. Or hit Looks Good to finalize.',
        },
      ]);

      await generateHeaderImage(data.title, data.category);
      setStep('iterate');
    } catch (error) {
      alert(`Error generating post: ${error.message}`);
      setStep('dump');
    } finally {
      setIsGenerating(false);
    }
  }

  async function submitFeedback(customFeedback) {
    const feedbackText = (customFeedback || feedback).trim();
    if (!feedbackText || !generatedData) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: feedbackText }, { role: 'ai', text: 'Revising...', thinking: true }]);
    setFeedback('');

    const messages = [
      ...iterationHistory,
      {
        role: 'user',
        content: `Please revise the blog post based on this feedback: ${feedbackText}\n\nReturn the complete updated post as the same JSON structure. Raw JSON only.`,
      },
    ];

    try {
      const result = await callAnthropic(messages);
      const text = result.content?.[0]?.text || '';
      let data;

      try {
        data = JSON.parse(text.trim());
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('JSON parse failed');
        data = JSON.parse(match[0]);
      }

      const previousTitle = generatedData?.title;
      setGeneratedData(data);
      setIterationHistory([...messages, { role: 'assistant', content: JSON.stringify(data) }]);
      setDraftVersion((prev) => prev + 1);

      setChatMessages((prev) => {
        const withoutThinking = prev.filter((item) => !item.thinking);
        return [...withoutThinking, { role: 'ai', text: `Done. Version ${draftVersion + 1} is ready - take a look at the draft.` }];
      });

      if (data.title !== previousTitle) {
        await generateHeaderImage(data.title, data.category);
      }
    } catch (error) {
      setChatMessages((prev) => {
        const withoutThinking = prev.filter((item) => !item.thinking);
        return [...withoutThinking, { role: 'ai', text: 'Something went wrong. Try again.' }];
      });
    }
  }

  function moveToFinalReview() {
    if (!generatedData) return;

    setFieldTitle(generatedData.title || '');
    setFieldSlug(generatedData.slug || '');
    setFieldExcerpt(generatedData.excerpt || '');
    setFieldCategory(generatedData.category || 'Revenue Systems');
    setFieldTags((generatedData.tags || []).join(', '));
    setFieldReadtime(generatedData.read_time_minutes || 5);
    setFieldSeoTitle(generatedData.seo_title || '');
    setFieldSeoDesc(generatedData.seo_description || '');

    setStatusBadge('Review');
    setStep('review');
  }

  async function uploadHeaderImage(slug) {
    if (!headerImageBlob) return null;

    const filename = `blog/${slug}-${Date.now()}.png`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/qwp-media/${filename}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
      },
      body: headerImageBlob,
    });

    if (!response.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/qwp-media/${filename}`;
  }

  async function publishPost() {
    if (!generatedData) return;

    setIsSaving(true);

    try {
      const coverImageUrl = await uploadHeaderImage(fieldSlug);
      const tags = fieldTags.split(',').map((tag) => tag.trim()).filter(Boolean);

      const payload = {
        title: fieldTitle,
        slug: fieldSlug,
        excerpt: fieldExcerpt,
        category: fieldCategory,
        tags,
        content: generatedData.content || '',
        cover_image_url: coverImageUrl,
        read_time_minutes: Number(fieldReadtime) || 5,
        seo_title: fieldSeoTitle,
        seo_description: fieldSeoDesc,
        featured,
        published,
        published_at: published ? new Date().toISOString() : null,
        author_name: 'Kendra Lewis',
        author_title: 'Managing Partner, QWP',
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const saved = await response.json();
      const newSlug = saved?.[0]?.slug || fieldSlug;
      setSavedSlug(newSlug);
      setPublishedMessage(published ? 'Your post is live on the blog.' : "Draft saved. Toggle Publish when you're ready to go live.");
      setStatusBadge(published ? 'Published' : 'Draft Saved');
      setStep('published');
    } catch (error) {
      alert('Error saving post.');
    } finally {
      setIsSaving(false);
    }
  }

  function resetToStep1() {
    setStep('dump');
    setStatusBadge('Draft');
    setBrainDump('');
    setTranscript('');
    setSelectedCategory('');
    setGeneratedData(null);
    setIterationHistory([]);
    setDraftVersion(1);
    setFeedback('');
    setFeatured(false);
    setPublished(false);
    setHeaderImageBlob(null);
    setHeaderImageUrl(null);
    setChatMessages([
      {
        role: 'ai',
        text: 'Draft is ready. Read it over. Tell me what to change - tone, structure, a section, the intro, anything. Or hit Looks Good to finalize.',
      },
    ]);
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-[#0D0D0D] text-platinum grid place-items-center px-6">
        <form onSubmit={unlock} className="w-full max-w-sm bg-[#111] border border-white/10 rounded-xl p-6">
          <p className="font-mono text-[9px] text-teal/60 uppercase tracking-widest mb-2">Admin Access</p>
          <h1 className="font-serif text-2xl mb-4">Insights Post Studio</h1>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm"
            placeholder="Enter password"
          />
          <button type="submit" className="w-full mt-4 bg-teal text-charcoal py-3 rounded-lg font-mono text-[10px] uppercase tracking-widest">
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="bg-[#0D0D0D] font-sans text-platinum min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-charcoal border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="font-serif text-xl font-black tracking-tighter text-platinum">QWP<span className="text-teal">.</span></span>
          <span className="text-white/10">|</span>
          <span className="font-mono text-[10px] text-platinum/40 uppercase tracking-widest">Insights Post Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded border ${statusBadge === 'Review' || statusBadge === 'Published' || statusBadge === 'Draft Saved' ? 'border-teal/30 text-teal/60' : 'border-white/10 text-platinum/40'}`}>
            {statusBadge}
          </div>
          <a href="/" className="font-mono text-[9px] uppercase tracking-widest text-platinum/30 hover:text-teal transition-colors">← Back to Blog</a>
        </div>
      </div>

      <div
        ref={headerCanvasRef}
        id="blog-header-canvas"
        style={{
          width: '1200px',
          height: '630px',
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          background: '#0A0A0A',
          overflow: 'hidden',
          fontFamily: 'Playfair Display, serif',
        }}
      />

      <div className="pt-14 min-h-screen">
        {step === 'dump' ? (
          <div className="max-w-3xl mx-auto px-6 py-16">
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px w-8 bg-teal" />
                <span className="font-mono text-[9px] text-teal/60 uppercase tracking-widest">New Post</span>
              </div>
              <h1 className="font-serif text-4xl text-platinum font-normal mb-3">Brain Dump Studio</h1>
              <p className="text-platinum/40 font-light text-base leading-relaxed">Type it out or talk it out. Just get the ideas down - the AI handles everything else.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <i className="fa-solid fa-book-open text-teal text-xs mb-2 block" />
                <p className="font-mono text-[8px] text-platinum/40 uppercase tracking-widest mb-1">Start with a story</p>
                <p className="text-platinum/30 text-xs font-light">"I worked with a client who..."</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <i className="fa-solid fa-lightbulb text-teal text-xs mb-2 block" />
                <p className="font-mono text-[8px] text-platinum/40 uppercase tracking-widest mb-1">Share the insight</p>
                <p className="text-platinum/30 text-xs font-light">The real lesson, the reveal, the framework</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <i className="fa-solid fa-arrow-right text-teal text-xs mb-2 block" />
                <p className="font-mono text-[8px] text-platinum/40 uppercase tracking-widest mb-1">Land the point</p>
                <p className="text-platinum/30 text-xs font-light">What should they do with this?</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button type="button" onClick={() => setActiveTab('type')} className={`input-tab flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border border-white/10 bg-white/[0.02] ${activeTab === 'type' ? 'active text-teal border-teal/30 bg-teal/10' : ''}`}>
                <i className="fa-solid fa-keyboard tab-icon text-platinum/40 text-sm" />
                <div className="text-left">
                  <p className="font-mono text-[9px] uppercase tracking-widest">Type it</p>
                  <p className="text-platinum/30 text-[10px] font-light mt-0.5">Write your brain dump</p>
                </div>
              </button>
              <button type="button" onClick={() => setActiveTab('voice')} className={`input-tab flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border border-white/10 bg-white/[0.02] ${activeTab === 'voice' ? 'active text-teal border-teal/30 bg-teal/10' : ''}`}>
                <i className="fa-solid fa-microphone tab-icon text-platinum/40 text-sm" />
                <div className="text-left">
                  <p className="font-mono text-[9px] uppercase tracking-widest">Talk it out</p>
                  <p className="text-platinum/30 text-[10px] font-light mt-0.5">Record {'->'} Transcribe {'->'} Generate</p>
                </div>
              </button>
            </div>

            {activeTab === 'type' ? (
              <div className="relative mb-6">
                <textarea
                  rows={18}
                  value={brainDump}
                  onChange={(event) => setBrainDump(event.target.value)}
                  placeholder="Just start talking..."
                  className="w-full bg-[#111] border border-white/8 rounded-2xl p-6 text-platinum/80 font-light text-sm leading-relaxed focus:outline-none focus:border-teal/30 transition-colors placeholder:text-platinum/20 font-sans"
                />
                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-platinum/20">{brainDump.length.toLocaleString()} characters</div>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/8 rounded-2xl p-8 mb-6">
                <div className="flex flex-col items-center mb-8">
                  <button type="button" onClick={toggleRecording} className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${recMode === 'recording' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/[0.04]'}`}>
                    <i className={`fa-solid ${recMode === 'recording' ? 'fa-stop text-red-400' : 'fa-microphone text-platinum/40'} text-2xl`} />
                  </button>

                  {recMode === 'recording' ? (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <p className="font-mono text-[10px] text-platinum/40 uppercase tracking-widest">Recording... click to stop.</p>
                    </div>
                  ) : (
                    <p className="font-mono text-[10px] text-platinum/40 uppercase tracking-widest mt-3">{recMode === 'ready' ? 'Done. Transcribe or record again.' : 'Click to start recording'}</p>
                  )}

                  {(recMode === 'recording' || timerSeconds > 0) ? <p className="font-mono text-xs text-platinum/20 mt-2">{timerText}</p> : null}
                </div>

                {recMode === 'ready' ? (
                  <div className="mb-6">
                    <p className="font-mono text-[9px] text-platinum/30 uppercase tracking-widest mb-2">Your recording</p>
                    <audio ref={audioPlayerRef} controls className="w-full" style={{ filter: 'invert(0.8) hue-rotate(130deg)' }} />
                  </div>
                ) : null}

                {recMode === 'ready' || recMode === 'transcribing' ? (
                  <button type="button" onClick={transcribeAudio} className="w-full border border-teal/30 text-teal py-3.5 font-mono text-[10px] uppercase tracking-widest hover:bg-teal/10 transition-colors rounded-xl flex items-center justify-center gap-2 mb-5" disabled={recMode === 'transcribing'}>
                    <i className="fa-solid fa-waveform-lines" /> {recMode === 'transcribing' ? 'Transcribing...' : 'Transcribe Recording'}
                  </button>
                ) : null}

                {(recMode === 'ready' || transcript) ? (
                  <div>
                    <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Transcript - edit if needed</label>
                    <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={10} className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-4 text-platinum/80 font-light text-sm leading-relaxed focus:outline-none focus:border-teal/30 transition-colors placeholder:text-platinum/20 font-sans" />
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="font-mono text-[9px] text-platinum/30 uppercase tracking-widest">Topic hint (optional):</span>
              <div className="flex flex-wrap gap-2">
                {['Revenue Systems', 'Brand & Identity', 'AI & Automation', 'Growth Strategy', 'Operations'].map((item) => (
                  <button key={item} type="button" onClick={() => setSelectedCategory(item)} className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded border transition-all ${selectedCategory === item ? 'border-teal text-teal bg-teal/10' : 'border-white/10 text-platinum/40 hover:border-teal/30 hover:text-platinum/70'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={generatePost} disabled={isGenerating} className="w-full bg-teal text-charcoal py-5 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-platinum transition-all duration-300 rounded-xl flex items-center justify-center gap-3">
              <i className="fa-solid fa-wand-magic-sparkles" /> {isGenerating ? 'Generating...' : 'Generate My Post'}
            </button>
            <p className="text-center text-platinum/20 font-mono text-[9px] mt-4 uppercase tracking-widest">Powered by Claude · Your voice · Your insights</p>
          </div>
        ) : null}

        {step === 'processing' ? (
          <div className="max-w-xl mx-auto px-6 py-24 text-center">
            <div className="relative w-20 h-20 mx-auto mb-10">
              <div className="absolute inset-0 rounded-full border-2 border-teal/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal spin-ring" />
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-brain text-teal text-xl" />
              </div>
            </div>
            <h2 className="font-serif text-3xl text-platinum font-normal mb-4">Reading your brain dump...</h2>
            <p className="text-platinum/40 font-light mb-12">
              {[
                'Extracting core insight & title...',
                'Structuring in your voice...',
                'Formatting markdown sections...',
                'Writing SEO metadata...',
                'Generating tags, category & slug...',
                'Rendering branded header image...',
              ][processingStep - 1]}
            </p>
          </div>
        ) : null}

        {step === 'iterate' && generatedData ? (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-8 flex items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-px w-8 bg-teal" />
                  <span className="font-mono text-[9px] text-teal/60 uppercase tracking-widest">Draft Ready</span>
                </div>
                <h2 className="font-serif text-3xl text-platinum font-normal">Review & Refine</h2>
                <p className="text-platinum/40 font-light text-sm mt-1">Read the draft. Give feedback. Iterate until it's right. Then finalize.</p>
              </div>
              <button type="button" onClick={moveToFinalReview} className="bg-teal text-charcoal px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-platinum transition-colors rounded-xl shrink-0">
                Looks Good {'->'} Finalize
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                  <p className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest">Current Draft</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                    <span className="font-mono text-[8px] text-platinum/30 uppercase tracking-widest">Version {draftVersion}</span>
                  </div>
                </div>

                <div className="w-full bg-darkGreen/20 relative overflow-hidden flex items-center justify-center" style={{ height: '180px' }}>
                  {headerImageUrl ? <img src={headerImageUrl} alt="header preview" className="w-full h-full object-cover" /> : <p className="font-mono text-[8px] text-platinum/20 uppercase tracking-widest">Generating header...</p>}
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-1 rounded border border-teal/30 bg-teal/10 text-teal">{generatedData.category}</span>
                  </div>
                  <h3 className="font-serif text-xl text-platinum font-normal leading-snug mb-3">{generatedData.title}</h3>
                  <p className="text-platinum/50 text-sm font-light leading-relaxed mb-4">{generatedData.excerpt}</p>
                  <div className="border-t border-white/8 pt-4">
                    <p className="font-mono text-[8px] text-platinum/30 uppercase tracking-widest mb-3">Article Content</p>
                    <div className="preview-content max-h-80 overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(generatedData.content || '') }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col bg-[#111] border border-white/8 rounded-2xl overflow-hidden" style={{ height: '680px' }}>
                <div className="px-6 py-4 border-b border-white/8">
                  <p className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest">Feedback & Refinement</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((item, idx) => (
                    <div key={`${item.role}-${idx}`} className={`${item.role === 'user' ? 'chat-bubble-user p-4 ml-auto max-w-xs' : 'chat-bubble-ai p-4 max-w-xs'}`}>
                      {item.thinking ? (
                        <div className="flex gap-1 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      ) : (
                        <p className={`text-sm font-light leading-relaxed ${item.role === 'user' ? 'text-teal' : 'text-platinum/70'}`}>{item.text}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-white/5">
                  <p className="font-mono text-[8px] text-platinum/20 uppercase tracking-widest mb-2">Quick feedback</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => submitFeedback('Make the intro punchier - start with more tension')} className="font-mono text-[8px] text-platinum/40 px-2 py-1 rounded border border-white/8 hover:border-teal/30 hover:text-teal/60 transition-all">Punchier intro</button>
                    <button type="button" onClick={() => submitFeedback('The tone feels too formal. Make it sound more like me - conversational, direct')} className="font-mono text-[8px] text-platinum/40 px-2 py-1 rounded border border-white/8 hover:border-teal/30 hover:text-teal/60 transition-all">More conversational</button>
                    <button type="button" onClick={() => submitFeedback('Add more specificity to the examples - make them feel more real and detailed')} className="font-mono text-[8px] text-platinum/40 px-2 py-1 rounded border border-white/8 hover:border-teal/30 hover:text-teal/60 transition-all">More specific</button>
                  </div>
                </div>

                <div className="p-4 border-t border-white/8 flex gap-3">
                  <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={2} placeholder="Tell me what to change..." className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-platinum text-sm font-light focus:outline-none focus:border-teal/30 transition-colors placeholder:text-platinum/20 font-sans resize-none" />
                  <button type="button" onClick={() => submitFeedback()} className="bg-teal text-charcoal px-5 rounded-xl font-black text-xs hover:bg-platinum transition-colors shrink-0">
                    <i className="fa-solid fa-arrow-up" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 'review' ? (
          <div className="flex flex-col lg:flex-row min-h-screen">
            <div className="lg:w-96 shrink-0 bg-charcoal border-r border-white/5 overflow-y-auto lg:h-[calc(100vh-56px)] lg:sticky lg:top-14">
              <div className="p-6 border-b border-white/5">
                <p className="font-mono text-[9px] text-teal/60 uppercase tracking-widest mb-1">Final Review</p>
                <h3 className="font-serif text-xl text-platinum font-normal">Post Details</h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Header Image</label>
                  <div className="w-full rounded-lg overflow-hidden bg-darkGreen/20 flex items-center justify-center" style={{ height: '100px' }}>
                    {headerImageUrl ? <img src={headerImageUrl} alt="header preview" className="w-full h-full object-cover" /> : <p className="font-mono text-[8px] text-platinum/20 uppercase tracking-widest">Generating...</p>}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Title</label>
                  <textarea rows={3} value={fieldTitle} onChange={(event) => setFieldTitle(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum text-sm font-light focus:outline-none transition-colors resize-none" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Slug</label>
                  <input type="text" value={fieldSlug} onChange={(event) => setFieldSlug(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-teal font-mono text-xs focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Excerpt</label>
                  <textarea rows={3} value={fieldExcerpt} onChange={(event) => setFieldExcerpt(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum/70 text-sm font-light focus:outline-none transition-colors resize-none" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Category</label>
                  <select value={fieldCategory} onChange={(event) => setFieldCategory(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum text-sm font-light focus:outline-none transition-colors">
                    <option value="Revenue Systems">Revenue Systems</option>
                    <option value="Brand & Identity">Brand & Identity</option>
                    <option value="AI & Automation">AI & Automation</option>
                    <option value="Growth Strategy">Growth Strategy</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Tags</label>
                  <input type="text" value={fieldTags} onChange={(event) => setFieldTags(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum text-sm font-light focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">Read Time (min)</label>
                  <input type="number" value={fieldReadtime} onChange={(event) => setFieldReadtime(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum text-sm font-light focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">SEO Title</label>
                  <input type="text" value={fieldSeoTitle} onChange={(event) => setFieldSeoTitle(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum text-sm font-light focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-platinum/40 uppercase tracking-widest block mb-2">SEO Description</label>
                  <textarea rows={3} value={fieldSeoDesc} onChange={(event) => setFieldSeoDesc(event.target.value)} className="field-editable w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-platinum/70 text-sm font-light focus:outline-none transition-colors resize-none" />
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] text-platinum/60 uppercase tracking-widest">Featured Post</p>
                    <button type="button" onClick={() => setFeatured((prev) => !prev)} className={`w-11 h-6 rounded-full border relative transition-colors duration-300 ${featured ? 'bg-teal/20 border-teal/30' : 'bg-white/10 border-white/10'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${featured ? 'translate-x-5 bg-teal' : 'bg-white/30'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] text-platinum/60 uppercase tracking-widest">Publish Now</p>
                    <button type="button" onClick={() => setPublished((prev) => !prev)} className={`w-11 h-6 rounded-full border relative transition-colors duration-300 ${published ? 'bg-teal/20 border-teal/30' : 'bg-white/10 border-white/10'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${published ? 'translate-x-5 bg-teal' : 'bg-white/30'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button type="button" onClick={publishPost} disabled={isSaving} className="w-full bg-teal text-charcoal py-4 font-black text-[10px] uppercase tracking-[0.25em] hover:bg-platinum transition-colors rounded-xl">
                    <i className="fa-solid fa-rocket mr-2" /> {isSaving ? 'Saving...' : 'Save to Database'}
                  </button>
                  <button type="button" onClick={() => setStep('iterate')} className="w-full bg-transparent border border-white/10 text-platinum/40 py-3 font-mono text-[9px] uppercase tracking-widest hover:border-white/20 hover:text-platinum/60 transition-all rounded-xl">
                    {'<-'} Back to Refine
                  </button>
                  <button type="button" onClick={resetToStep1} className="w-full bg-transparent border border-white/5 text-platinum/20 py-2 font-mono text-[8px] uppercase tracking-widest hover:border-white/10 hover:text-platinum/40 transition-all rounded-xl">
                    Start Over
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-platinum overflow-y-auto">
              <div className="border-b border-black/8 px-8 py-4 bg-white flex items-center justify-between">
                <p className="font-mono text-[9px] text-charcoal/40 uppercase tracking-widest">Full Post Preview</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal" />
                  <span className="font-mono text-[9px] text-charcoal/30 uppercase tracking-widest">Live render</span>
                </div>
              </div>
              <div className="w-full bg-charcoal" style={{ height: '280px' }}>
                {headerImageUrl ? (
                  <img src={headerImageUrl} alt="header" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-mono text-[9px] text-platinum/20 uppercase tracking-widest">Header image loading...</p>
                  </div>
                )}
              </div>
              <div className="bg-charcoal px-8 py-10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded border border-teal/30 bg-teal/10 text-teal">{fieldCategory}</span>
                    <span className="font-mono text-[9px] text-platinum/30">·</span>
                    <span className="font-mono text-[9px] text-platinum/40">{fieldReadtime || 5} min read</span>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl text-platinum font-normal leading-tight mb-6">{fieldTitle}</h1>
                  <div className="flex items-center gap-3 pt-6 border-t border-white/8">
                    <div className="w-9 h-9 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center">
                      <span className="font-serif text-teal font-bold text-sm">K</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-platinum">Kendra Lewis</div>
                      <div className="font-mono text-[8px] text-platinum/30 uppercase tracking-widest">Managing Partner, QWP</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-10 max-w-2xl">
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(generatedData?.content || '') }} />
              </div>
              <div className="px-8 pb-10">
                <div className="flex flex-wrap gap-2">
                  {fieldTags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(5,64,62,0.2)', background: 'rgba(5,64,62,0.05)', color: '#05403E' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 'published' ? (
          <div className="max-w-xl mx-auto px-6 py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-8">
              <i className="fa-solid fa-check text-teal text-2xl" />
            </div>
            <h2 className="font-serif text-4xl text-platinum font-normal mb-4">Post Saved.</h2>
            <p className="text-platinum/40 font-light text-lg mb-10">{publishedMessage}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`https://insights.quietwealthpartners.com/${savedSlug}`} target="_blank" className="bg-teal text-charcoal px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-platinum transition-colors rounded-xl" rel="noreferrer">View Post {'->'}</a>
              <button type="button" onClick={resetToStep1} className="bg-white/5 border border-white/10 text-platinum px-8 py-4 font-mono text-[10px] uppercase tracking-widest hover:border-teal/30 transition-colors rounded-xl">Write Another</button>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes spin-ring { to { transform: rotate(360deg); } }
        .spin-ring { animation: spin-ring 1.5s linear infinite; }
        .chat-bubble-ai { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 0 12px 12px 12px; }
        .chat-bubble-user { background: rgba(0,255,196,0.08); border: 1px solid rgba(0,255,196,0.15); border-radius: 12px 0 12px 12px; }
        .field-editable:focus { outline: none; border-color: rgba(0,255,196,0.5) !important; box-shadow: 0 0 0 3px rgba(0,255,196,0.08); }
      `}</style>
    </main>
  );
}
