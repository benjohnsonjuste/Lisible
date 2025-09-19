import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <Navbar />
      <main style={{ flex: 1, width: "100%" }}>{children}</main>
      <Footer />
    </div>
  );
}