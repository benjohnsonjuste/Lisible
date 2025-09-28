import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>
      <InstallPrompt />
      <Footer />
    </>
  );
}

export default MyApp;