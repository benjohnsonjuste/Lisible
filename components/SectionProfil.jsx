export default function SectionProfil({ user }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2">Profil</h3>
      <p>Nom : {user.name}</p>
      <p>Email : {user.email}</p>
    </div>
  );
}
