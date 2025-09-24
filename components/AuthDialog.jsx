import React, { useState } from "react";

export default function AuthDialog() {
  const [users, setUsers] = useState([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  return (
    <div className="auth-dialog">
      <h2>Liste des utilisateurs</h2>
      <div>
        {users.map((user) => (
          <div key={user.id} className="user-item">
            <p>{user.name}</p>
            <button onClick={() => alert(`Hello ${user.name}`)}>Salut</button>
          </div>
        ))}
      </div>
    </div>
  );
}
