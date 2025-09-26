// pages/_app.js
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";

function MyApp({ Component, pageProps }){
  return (
    <>
      <Navbar />
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>
    </>
  );
}
export default MyApp;
