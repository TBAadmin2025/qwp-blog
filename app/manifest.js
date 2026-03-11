export default function manifest() {
  return {
    name: 'QWP Insights',
    short_name: 'QWP Insights',
    description: 'Intelligence for the modern revenue architecture.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    icons: [
      {
        src: 'https://assets.cdn.filesafe.space/vKl961ci8UVBaOpufpQ5/media/69b0b4803443f336727bfe92.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://assets.cdn.filesafe.space/vKl961ci8UVBaOpufpQ5/media/69b0b4800348865d85006d78.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
