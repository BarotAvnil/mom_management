import { Inter } from 'next/font/google'
import AppShell from '@/components/AppShell'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MOM Management',
  description: 'Manage your meetings and minutes efficiently',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen w-screen overflow-hidden bg-background text-foreground antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
