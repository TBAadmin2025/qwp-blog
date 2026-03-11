'use client';

import Link from 'next/link';
import { useState } from 'react';

const links = [
  { label: 'Approach', href: 'https://quietwealthpartners.com/approach' },
  { label: 'Capabilities', href: 'https://quietwealthpartners.com/capabilities' },
  { label: 'Results', href: 'https://quietwealthpartners.com/results' },
  { label: 'Insights', href: '/' },
];

export default function NavBar({ active = 'Insights' }) {
  const [open, setOpen] = useState(false);
  const ctaHref = 'https://diagnostic.quietwealthpartners.com';
  const logoHref = 'https://quietwealthpartners.com';

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-charcoal/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <a
            href={logoHref}
            className="font-serif text-3xl md:text-4xl font-black tracking-tighter text-platinum hover:opacity-80 transition-opacity"
          >
            QWP<span className="text-teal">.</span>
          </a>
          <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
            {links.map((link) => (
              link.href.startsWith('http') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${
                    link.label === 'Insights' ? 'text-teal' : 'text-platinum/70 hover:text-teal'
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${
                    link.label === 'Insights' ? 'text-teal' : 'text-platinum/70 hover:text-teal'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            <a
              href={ctaHref}
              className="border border-teal bg-transparent text-platinum px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-teal hover:text-charcoal transition-all duration-300"
            >
              Assess Revenue Flow
            </a>
          </div>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="md:hidden text-platinum hover:text-teal focus:outline-none"
            aria-label="Toggle menu"
          >
            <i className="fa-solid fa-bars text-2xl" />
          </button>
        </div>
      </div>
      <div className={`${open ? 'block' : 'hidden'} md:hidden bg-charcoal border-b border-white/5`}>
        <div className="px-6 pt-4 pb-8 space-y-6 flex flex-col">
          {links.map((link) => (
            link.href.startsWith('http') ? (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-bold uppercase tracking-[0.3em] ${
                  link.label === 'Insights' ? 'text-teal' : 'text-platinum hover:text-teal'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-bold uppercase tracking-[0.3em] ${
                  link.label === 'Insights' ? 'text-teal' : 'text-platinum hover:text-teal'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            )
          ))}
          <a
            href={ctaHref}
            className="w-full text-center px-6 py-4 bg-teal text-charcoal font-bold text-[10px] uppercase tracking-[0.2em] mt-4 block"
          >
            Assess Revenue Flow
          </a>
        </div>
      </div>
    </nav>
  );
}
