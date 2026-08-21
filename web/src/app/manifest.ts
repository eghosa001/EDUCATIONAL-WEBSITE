import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THE GUIDE',
    short_name: 'THE GUIDE',
    description: 'Your path to smarter learning',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#172554',
    icons: [
      { src: '/logos/the-guide-mark.webp', sizes: '128x128', type: 'image/webp', purpose: 'any' },
      { src: '/logos/the-guide-mark.webp', sizes: '128x128', type: 'image/webp', purpose: 'maskable' },
    ],
  };
}
