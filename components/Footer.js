export default function Footer() {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "15px",
        marginTop: "20px",
        backgroundColor: "#f8f8f8",
        color: "#333",
      }}
    >
      © {new Date().getFullYear()} Lisible. Tous droits réservés.
    </footer>
  );
}