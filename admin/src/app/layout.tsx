export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>THE GUIDE Admin</title>
        <meta name="description" content="THE GUIDE administration portal" />
        <link rel="icon" href="/logos/the-guide-mark.webp" type="image/webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
