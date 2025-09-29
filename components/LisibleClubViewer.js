import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function LisibleClubViewer() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <div key={post.id} className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold">{post.authorName}</h3>
          <p className="text-gray-600 text-sm">{post.description}</p>

          {post.type === "text" && (
            <p className="mt-2 text-lg">{post.content}</p>
          )}

          {post.type === "image" && (
            <img src={post.content} alt="Publication" className="mt-2 rounded-lg w-full" />
          )}

          {post.type === "video" && (
            <video controls className="mt-2 rounded-lg w-full">
              <source src={post.content} type="video/mp4" />
            </video>
          )}

          {post.type === "audio" && (
            <audio controls className="mt-2 w-full">
              <source src={post.content} type="audio/mpeg" />
            </audio>
          )}

          {post.type === "live_video" && (
            <div className="mt-2 p-4 bg-red-600 text-white text-center rounded-lg">
              🔴 Live Vidéo en cours
            </div>
          )}

          {post.type === "live_audio" && (
            <div className="mt-2 p-4 bg-red-600 text-white text-center rounded-lg">
              🔴 Live Audio en cours
            </div>
          )}
        </div>
      ))}
    </div>
  );
}