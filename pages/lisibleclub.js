// pages/lisibleclub.js
import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export default function LisibleClubPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [streamType, setStreamType] = useState("video");
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // 🔹 Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 🔹 Charger les posts
  const fetchPosts = async () => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  // 🔹 Notifications FCM
  useEffect(() => {
    if (!user) return;
    const messaging = getMessaging();
    getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY })
      .then((token) => console.log("FCM Token:", token))
      .catch((err) => console.error("Erreur FCM:", err));

    onMessage(messaging, (payload) => {
      alert(`Notification Lisible Club : ${payload.notification?.title}`);
    });
  }, [user]);

  // 🔹 Publier un post
  const publishPost = async () => {
    if (!user) return alert("Connectez-vous pour publier.");
    if (!content && !media) return alert("Ajoutez du texte ou un média.");

    let mediaUrl = null;
    if (media) {
      const storageRef = ref(storage, `club/${user.uid}/${Date.now()}_${media.name}`);
      const uploadTask = uploadBytesResumable(storageRef, media);
      mediaUrl = await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          reject,
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
      });
    }

    await addDoc(collection(db, "clubPosts"), {
      authorId: user.uid,
      authorName: user.displayName || "Auteur inconnu",
      content,
      mediaUrl,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp(),
    });

    setContent("");
    setMedia(null);
    await fetchPosts();
  };

  // 🔹 Like post
  const likePost = async (post) => {
    if (!post.likedBy?.includes(user.uid)) {
      const postRef = doc(db, "clubPosts", post.id);
      await updateDoc(postRef, {
        likes: post.likes + 1,
        likedBy: arrayUnion(user.uid),
      });
      fetchPosts();
    }
  };

  // 🔹 Commenter
  const commentPost = async (postId, text) => {
    if (!text) return;
    const postRef = doc(db, "clubPosts", postId);
    await updateDoc(postRef, {
      comments: arrayUnion({ uid: user.uid, text, createdAt: serverTimestamp() }),
    });
    fetchPosts();
  };

  // 🔹 Live vidéo/audio
  const startStream = async () => {
    try {
      const constraints =
        streamType === "video" ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (streamType === "video") videoRef.current.srcObject = stream;
      else audioRef.current.srcObject = stream;
      setStreaming(true);
    } catch {
      alert("Impossible d'accéder au micro ou à la caméra.");
    }
  };

  const stopStream = () => {
    [videoRef.current, audioRef.current].forEach((el) => {
      if (el?.srcObject) el.srcObject.getTracks().forEach((track) => track.stop());
      if (el) el.srcObject = null;
    });
    setStreaming(false);
  };

  if (!user) return <p className="text-center mt-8">Connectez-vous pour accéder au Lisible Club</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Lisible Club</h1>

      {/* Dashboard: publier */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez quelque chose..."
          className="w-full border p-2 rounded"
        />
        <input type="file" onChange={(e) => setMedia(e.target.files[0])} className="w-full" />
        <div className="flex gap-2 mt-2">
          <button
            onClick={publishPost}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Publier
          </button>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                value="video"
                checked={streamType === "video"}
                onChange={() => setStreamType("video")}
                className="hidden"
              />
              <span className={`p-2 rounded-full border-2 ${streamType === "video" ? "border-blue-600" : "border-gray-300"}`}>📹</span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                value="audio"
                checked={streamType === "audio"}
                onChange={() => setStreamType("audio")}
                className="hidden"
              />
              <span className={`p-2 rounded-full border-2 ${streamType === "audio" ? "border-green-600" : "border-gray-300"}`}>🎤</span>
            </label>
          </div>
          {!streaming ? (
            <button
              onClick={startStream}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Démarrer le live
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Arrêter le live
            </button>
          )}
        </div>
        {streamType === "video" ? (
          <video ref={videoRef} autoPlay playsInline className="w-full mt-4 rounded shadow" />
        ) : (
          <audio ref={audioRef} autoPlay controls className="w-full mt-4" />
        )}
      </div>

      {/* Viewer: mur */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded shadow space-y-2">
            <p className="font-bold">{post.authorName}</p>
            {post.content && <p>{post.content}</p>}
            {post.mediaUrl && (
              <>
                {post.mediaUrl.endsWith(".mp4") ? (
                  <video src={post.mediaUrl} controls className="w-full rounded" />
                ) : post.mediaUrl.endsWith(".mp3") ? (
                  <audio src={post.mediaUrl} controls className="w-full" />
                ) : (
                  <img src={post.mediaUrl} alt="media" className="w-full rounded" />
                )}
              </>
            )}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => likePost(post)}
                disabled={post.likedBy?.includes(user.uid)}
                className={`flex items-center gap-1 ${
                  post.likedBy?.includes(user.uid) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ❤️ <span>{post.likes || 0}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}