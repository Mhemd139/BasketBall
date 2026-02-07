import type { Metadata } from 'next'
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
  return children
}
