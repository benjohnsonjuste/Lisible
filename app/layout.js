import './globals.css';

export const metadata = {
  title: 'Mon Projet',
  description: 'Application Next.js avec Tailwind',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
