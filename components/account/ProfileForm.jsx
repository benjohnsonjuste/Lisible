import React, { useState } from "react";

export default function ProfileForm({ user }) {
  const [form, setForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    website: user.website || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/account/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nom complet" className="input" />
      <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Biographie" className="textarea" />
      <input name="website" value={form.website} onChange={handleChange} placeholder="Site web" className="input" />
      <button type="submit" className="btn-primary">Sauvegarder</button>
    </form>
  );
}
