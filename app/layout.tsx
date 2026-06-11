import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniPoll — Real-time Polling Platform',
  description: 'Create and run live polls, quizzes, Q&A sessions, and 17 more interactive poll types. Real-time results. Deploy anywhere.',
  keywords: ['polling', 'real-time', 'quiz', 'q&a', 'word cloud', 'live polls', 'audience engagement'],
  authors: [{ name: 'OmniPoll' }],
  openGraph: {
    title: 'OmniPoll — Real-time Polling Platform',
    description: 'Engage your audience live with 20 poll types.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D96C4A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />
      </head>
      <body className="font-inter antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' },
          }}
        />
      </body>
    </html>
  );
}
