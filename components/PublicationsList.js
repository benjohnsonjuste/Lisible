"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function PublicationsList() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "publications"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const pubs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPublications(pubs);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des publications :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublications();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Publications</h2>
      {loading ? (
        <p>Chargement des publications...</p>
      ) : publications.length === 0 ? (
        <p>Aucune publication disponible.</p>
      ) : (
        <ul className="space-y-2">
          {publications.map((pub) => (
            <li key={pub.id} className="border p-2 rounded">
              <a href={pub.url} target="_blank" className="text-blue-600 underline">
                {pub.fileName}
              </a>
              <p className="text-sm text-gray-500">
                Posté le {new Date(pub.timestamp).toLocaleString()} par {pub.authorId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}