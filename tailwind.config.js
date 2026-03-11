/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        platinum: '#F2F5F5',
        charcoal: '#0A0A0A',
        teal: '#00FFC4',
        darkGreen: '#05403E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'rgba(10,10,10,0.75)',
            lineHeight: '1.9',
            h1: {
              fontFamily: '"Playfair Display", serif',
              color: '#0A0A0A',
            },
            h2: {
              fontFamily: '"Playfair Display", serif',
              color: '#0A0A0A',
            },
            h3: {
              fontFamily: '"Playfair Display", serif',
              color: '#0A0A0A',
            },
            p: {
              fontFamily: 'Inter, sans-serif',
              fontWeight: '300',
            },
            a: {
              color: '#05403E',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
            },
            strong: {
              color: '#0A0A0A',
            },
            code: {
              color: '#05403E',
              fontFamily: 'JetBrains Mono, monospace',
            },
            blockquote: {
              color: '#05403E',
              borderLeftColor: 'rgba(5,64,62,0.3)',
              fontStyle: 'normal',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
