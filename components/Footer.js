export default function Footer() {
  return (
    <footer style={{
      textAlign: "center",
      padding: "10px",
      background: "#f0f0f0",
      marginTop: "20px"
    }}>
      © {new Date().getFullYear()} Lisible. Tous droits réservés.
    </footer>
  );
