import { Plus_Jakarta_Sans } from 'next/font/google'
import AppShell from '@/components/AppShell'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

export const metadata = {
  title: 'MOM Management — Enterprise Meeting Minutes',
  description: 'Professional Minutes of Meeting management platform for enterprise teams',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} h-screen w-screen overflow-hidden bg-background text-foreground antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
