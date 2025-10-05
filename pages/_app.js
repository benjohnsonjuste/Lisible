import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>
      <InstallPrompt />
      <Footer />
    </AuthProvider>
  );
}

export default MyApp;