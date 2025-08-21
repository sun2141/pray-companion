import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '기도동행 - AI 기반 동행 기도',
  description: 'AI가 맞춤형 기도문을 생성하고 음성으로 낭독하는 동행 기도 PWA. 혼자 기도하는 외로움을 해소하고 의미 있는 기도 생활을 함께 만들어갑니다.',
  keywords: '기도, 기독교, 신앙, AI, TTS, 음성낭독, 동행기도, PWA',
  authors: [{ name: '기도동행 팀' }],
  creator: '기도동행',
  publisher: '기도동행',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pray-companion.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '기도동행 - AI 기반 동행 기도',
    description: 'AI가 맞춤형 기도문을 생성하고 음성으로 낭독하는 동행 기도 PWA',
    url: '/',
    siteName: '기도동행',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '기도동행 - AI 기반 동행 기도',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '기도동행 - AI 기반 동행 기도',
    description: 'AI가 맞춤형 기도문을 생성하고 음성으로 낭독하는 동행 기도 PWA',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-256.png', sizes: '256x256', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    title: '기도동행',
    statusBarStyle: 'default',
    capable: true,
  },
  verification: {
    // google: 'your-google-site-verification-code',
    // other: 'your-other-verification-codes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="기도동행" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
