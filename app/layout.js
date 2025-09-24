import "../styles/globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Lisible",
  description: "Soutenir la littérature de demain"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
