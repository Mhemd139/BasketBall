import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'Basketball Manager',
  description: 'Basketball training management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect root to /ar (default locale)
  redirect('/ar')
}
