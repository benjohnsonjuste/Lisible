export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        textAlign: "center",
        padding: "15px",
        background: "#f5f5f5",
        borderTop: "1px solid #ddd",
      }}
    >
      © {new Date().getFullYear()} Lisible. Tous droits réservés.
    </footer>
  );
}