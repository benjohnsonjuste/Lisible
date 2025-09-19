export default function Footer() {
  return (
    <footer style={{ width: "100%", padding: "12px 16px", textAlign: "center", background: "#1976d2", color: "#fff" }}>
      © {new Date().getFullYear()} Lisible. Tous droits réservés.
    </footer>
  );
}