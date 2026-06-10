import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'
import { vazir } from '../fonts'

export const metadata: Metadata = {
  title: 'پنل مدیریت رستوران',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`h-full antialiased ${vazir.variable}`}>
      <body  className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}