export default function Footer() {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "20px",
        background: "#f5f5f5",
        borderTop: "1px solid #ddd",
        fontSize: "0.9rem",
      }}
    >
      © {new Date().getFullYear()} Lisible. Tous droits réservés.
    </footer>
  );
}