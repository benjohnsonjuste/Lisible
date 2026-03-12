import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

async function getAllUsersData() {
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`;

  try {
    // 1. Récupérer la liste des fichiers dans data/users
    const res = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json' 
      },
      next: { revalidate: 0 } 
    });

    if (!res.ok) return [];

    const files = await res.json();
    
    // 2. Récupérer le contenu de chaque JSON en parallèle
    const userPromises = files
      .filter(file => file.name.endsWith('.json'))
      .map(async (file) => {
        try {
          const fileRes = await fetch(file.download_url);
          if (!fileRes.ok) return null;
          const userData = await fileRes.json();
          
          return {
            email: userData.email || "Email inconnu",
            name: userData.name || userData.fullName || "Nom non renseigné",
            date: userData.joinedAt || null
          };
        } catch { return null; }
      });

    const users = await Promise.all(userPromises);
    return users.filter(user => user !== null);

  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error);
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getAllUsersData();

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#111', fontSize: '1.5rem' }}>Utilisateurs Inscrits</h1>
        <p style={{ color: '#666' }}>Total : <strong>{users.length}</strong> membres</p>
      </header>
      
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#666', fontWeight: '600' }}>Nom complet</th>
              <th style={{ padding: '12px 16px', color: '#666', fontWeight: '600' }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500', color: '#111' }}>{user.name}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9rem' }}>
                      {user.email}
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
