import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Accountabilities | 専門職の説明責任を可視化する',
  description: '裁判官・弁護士・医師・公務員など、権力を持つ専門職の判断傾向を判決・記録から分析・可視化するプラットフォーム。',
  openGraph: {
    title: 'Accountabilities',
    description: '専門職の説明責任を可視化する',
    url: 'https://accountabilities.org',
    siteName: 'Accountabilities',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
