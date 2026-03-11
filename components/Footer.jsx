"use client";

import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  async function submitNewsletter(event) {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    try {
      await fetch('https://qwp-newsletter-sync.square-bush-83cc.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setIsSubscribed(true);
      setEmail('');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <footer className="bg-[#050505] text-platinum/70 pt-20 pb-10 border-t border-white/5 relative z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-4 space-y-4">
            <a
              href="https://quietwealthpartners.com"
              className="font-serif text-3xl md:text-4xl font-black tracking-tighter text-platinum block mb-6 hover:opacity-80 transition-opacity"
            >
              QWP<span className="text-teal">.</span>
            </a>
            <p className="text-sm font-light leading-relaxed text-platinum/60 max-w-xs">
              Fortune 500 Infrastructure for Main Street Legends.
            </p>
          </div>
          <div className="lg:col-span-2 text-sm">
            <h4 className="text-platinum font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Explore</h4>
            <ul className="space-y-4 font-light text-platinum/60">
              <li>
                <a href="https://quietwealthpartners.com/approach" className="hover:text-teal transition-colors">
                  Approach
                </a>
              </li>
              <li>
                <a href="https://quietwealthpartners.com/capabilities" className="hover:text-teal transition-colors">
                  Capabilities
                </a>
              </li>
              <li>
                <a href="https://quietwealthpartners.com/results" className="hover:text-teal transition-colors">
                  Results
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-teal transition-colors">
                  Insights
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2 text-sm">
            <h4 className="text-platinum font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Legal</h4>
            <ul className="space-y-4 font-light text-platinum/60">
              <li>
                <a href="https://quietwealthpartners.com/privacy" className="hover:text-teal transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://quietwealthpartners.com/terms" className="hover:text-teal transition-colors">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="https://quietwealthpartners.com/disclaimer" className="hover:text-teal transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-4">
            <h4 className="text-platinum font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Newsletter</h4>
            <p className="text-sm font-light text-platinum/60 mb-5">System architecture insights, delivered monthly.</p>
            {isSubscribed ? (
              <p className="text-teal text-sm font-medium">You're in. Talk soon.</p>
            ) : (
              <form className="flex items-center" onSubmit={submitNewsletter}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="bg-charcoal border border-white/10 text-platinum text-sm px-5 py-3.5 w-full focus:outline-none focus:border-teal/50 transition-colors"
                  required
                />
                <button className="bg-teal text-charcoal px-5 py-3.5 hover:bg-platinum transition-colors" type="submit" disabled={isSending}>
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-platinum/40">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p>&copy; 2026 Quiet Wealth Partners. All rights reserved.</p>
            <p>3343 Peachtree Rd NE, Suite 145 PMB 1388, Atlanta, GA 30326, USA</p>
            <a href="tel:4702989563" className="hover:text-teal transition-colors">
              470-298-9563
            </a>
          </div>
          <div className="flex gap-6">
            <a href="https://www.facebook.com/quietwealthpartners/" target="_blank" rel="noopener noreferrer" className="hover:text-teal transition-colors">
              <i className="fa-brands fa-facebook-f text-sm" />
            </a>
            <a href="https://www.instagram.com/quietwealthpartners" target="_blank" rel="noopener noreferrer" className="hover:text-teal transition-colors">
              <i className="fa-brands fa-instagram text-sm" />
            </a>
            <a href="https://www.linkedin.com/company/quiet-wealth-partners" target="_blank" rel="noopener noreferrer" className="hover:text-teal transition-colors">
              <i className="fa-brands fa-linkedin-in text-sm" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
