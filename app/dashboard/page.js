"use client";
import { useEffect, useState } from "react";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import PublishingForm from "@/components/PublishingForm";
import MetricsCard from "@/components/MetricsCard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) fetchUserPosts(u.uid);
    });
    return unsub;
  }, []);

  const fetchUserPosts = async (uid) => {
    const q = query(collection(db, "posts"), where("authorId", "==", uid));
    const qsnap = await getDocs(q);
    const arr = [];
    let viewsSum = 0;
    qsnap.forEach(d => {
      arr.push({ id: d.id, ...d.data() });
      viewsSum += d.data().views || 0;
    });
    setPosts(arr);
    setTotalViews(viewsSum);

    // Example: subscribers stored in user's doc
    const userRef = doc(db, "users", uid);
    const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", uid)));
    // If you store subscribers in user doc, read it; fallback static:
    setSubscribers((userSnap.docs[0]?.data()?.subscribers) || 0);
  };

  const handlePublish = async ({ title, text, imageUrl }) => {
    if (!user) return alert("Connecte-toi d'abord");
    await addDoc(collection(db, "posts"), {
      title,
      text,
      imageUrl: imageUrl || null,
      views: 0,
      authorId: user.uid,
      createdAt: new Date()
    });
    fetchUserPosts(user.uid);
  };

  const revenue = (totalViews / 1000) * 0.2;
  const monetUnlocked = subscribers >= 250;

  return (
    <div className="p-6 container">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricsCard title="Abonnés" value={subscribers} />
        <MetricsCard title="Vues" value={totalViews} />
        <MetricsCard title="Gains ($)" value={revenue.toFixed(2)} />
      </div>

      {monetUnlocked ? (
        <div className="mb-4 text-green-600">Monétisation activée</div>
      ) : (
        <div className="mb-4 text-red-600">Monétisation verrouillée (250 abonnés requis)</div>
      )}

      <PublishingForm onPublish={handlePublish} />

      <section className="mt-6">
        <h2 className="font-bold mb-3">Mes textes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map(p => (
            <a key={p.id} href={`/post/${p.id}`} className="block">
              <div className="bg-white rounded shadow p-3">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-gray-600">{p.views || 0} vues</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
        }
