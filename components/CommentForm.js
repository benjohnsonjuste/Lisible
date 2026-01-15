"use client";
import { useState } from "react";

export default function CommentForm({ onAdd }) {
  const [message, setMessage] = useState("");

  return (
    <div className="mt-2">
      <textarea
        className="border p-2 w-full"
        placeholder="Votre commentaire"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white p-2 mt-1"
        onClick={() => {
          onAdd(message);
          setMessage("");
        }}
      >
        Commenter
      </button>
    </div>
  );
}