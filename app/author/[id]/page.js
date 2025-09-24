import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default async function AuthorPage({ params }) {
  const authorId = params.id;
  const authorRef = doc(db, "users", authorId);
  const authorSnap = await getDoc(authorRef);
  if (!authorSnap.exists()) return <div>Autor introuvable</div>;
  const author = authorSnap.data();

  const q = query(collection(db, "posts"), where("authorId", "==", authorId));
  const qsnap = await getDocs(q);
  const posts = qsnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return (
    <main className="container py-8">
      <div className="flex items-center space-x-4">
        <img src={author.photoURL || "/avatar.png"} className="w-20 h-20 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold">{author.displayName || "Auteur"}</h1>
          <p className="text-sm text-gray-600">{author.subscribers || 0} abonnés</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="font-bold mb-3">Textes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(p => (
            <a key={p.id} href={`/post/${p.id}`} className="block">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-gray-500">{p.views || 0} vues</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
  }
