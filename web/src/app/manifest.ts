import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THE GUIDE',
    short_name: 'THE GUIDE',
    description: 'Your path to smarter learning',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F4EA',
    theme_color: '#151A3A',
    icons: [
      { src: '/logos/the-guide-mark.webp', sizes: 'any', type: 'image/webp', purpose: 'any' },
      { src: '/logos/the-guide-mark.webp', sizes: 'any', type: 'image/webp', purpose: 'maskable' },
    ],
  };
}
