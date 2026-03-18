import type { Metadata } from 'next'
import { Cinzel, Cormorant_Garamond, DM_Mono } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cinzel',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Luma — Write with Gentle Focus',
  description:
    'Luma is a private, local AI journaling app. No cloud. No subscriptions. Just you, your thoughts, and a local AI that listens.',
  openGraph: {
    title: 'Luma — Write with Gentle Focus',
    description: 'Your private, local AI journaling companion.',
    url: 'https://luma.effortless.quest',
    siteName: 'Luma',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
