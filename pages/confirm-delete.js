// /pages/confirm-delete.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ConfirmDeletePage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/account/confirm-delete?token=${token}`)
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="max-w-xl mx-auto mt-20 p-6 text-center">
      {status === "pending" && <p>Validation en cours…</p>}
      {status === "success" && (
        <>
          <h1 className="text-xl font-bold mb-4">Compte supprimé</h1>
          <p className="text-gray-700">
            Votre compte Lisible a été supprimé avec succès. Nous vous remercions pour votre présence.
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-xl font-bold mb-4 text-red-600">Erreur</h1>
          <p className="text-gray-700">
            Le lien de suppression est invalide ou expiré. Veuillez recommencer la procédure.
          </p>
        </>
      )}
    </div>
  );
    }
