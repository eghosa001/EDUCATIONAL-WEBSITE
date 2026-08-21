import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THE GUIDE',
    short_name: 'THE GUIDE',
    description: 'Your path to smarter learning',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#2563EB',
    icons: [
      { src: '/logos/the-guide-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/logos/the-guide-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
