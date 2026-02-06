// app/layout.js
export const metadata = {
  title: 'Lisible - Publication',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
