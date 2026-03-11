import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import RevealObserver from '../components/RevealObserver';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['300', '400', '500', '600', '700'] });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['400', '500', '600', '700', '800', '900'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['400', '500', '700'] });

export const metadata = {
  title: 'QWP Insights',
  description: 'Intelligence for the modern revenue architecture.',
  icons: {
    icon: [
      {
        url: 'https://assets.cdn.filesafe.space/vKl961ci8UVBaOpufpQ5/media/69b0b480968537631f7ec27f.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: 'https://assets.cdn.filesafe.space/vKl961ci8UVBaOpufpQ5/media/69b0b4807fc07c40106c1937.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: 'https://assets.cdn.filesafe.space/vKl961ci8UVBaOpufpQ5/media/69b0b4803443f3dcde7bfe93.png',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyjYy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="font-sans text-platinum antialiased selection:bg-teal selection:text-charcoal bg-charcoal overflow-x-hidden">
        <RevealObserver />
        {children}
      </body>
    </html>
  );
}
