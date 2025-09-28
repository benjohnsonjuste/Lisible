import { useEffect, useState, useRef } from "react";
import { db, auth, storage } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function LisibleClub() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState(null);
  const videoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [streamType, setStreamType] = useState("video");

  /** Vérifier si l'utilisateur est connecté */
  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  /** Charger les publications */
  const fetchPosts = async () => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  /** Publier un post (texte ou média) */
  const publishPost = async () => {
    if (!content && !media) {
      alert("Ajoutez du texte ou un média");
      return;
    }

    try {
      let mediaUrl = null;

      if (media) {
        const storageRef = ref(storage, `club/${user.uid}/${Date.now()}_${media.name}`);
        await uploadBytes(storageRef, media);
        mediaUrl = await getDownloadURL(storageRef);
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
      fetchPosts();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la publication");
    }
  };

  /** Liker un post */
  const likePost = async (post) => {
    if (!post.likedBy.includes(user.uid)) {
      const postRef = doc(db, "clubPosts", post.id);
      await updateDoc(postRef, {
        likes: post.likes + 1,
        likedBy: arrayUnion(user.uid),
      });
      fetchPosts();
    }
  };

  /** Commenter un post */
  const commentPost = async (postId, text) => {
    const postRef = doc(db, "clubPosts", postId);
    await updateDoc(postRef, {
      comments: arrayUnion({ uid: user.uid, text, createdAt: serverTimestamp() }),
    });
    fetchPosts();
  };

  /** Démarrer le live vidéo/audio */
  const startStream = async () => {
    try {
      const constraints =
        streamType === "video" ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch (error) {
      console.error(error);
      alert("Impossible d'accéder au micro ou à la caméra.");
    }
  };

  /** Arrêter le live */
  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  if (!user)
    return <p className="text-center mt-8">Connectez-vous pour accéder à Lisible Club</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Lisible Club</h1>

      {/* Formulaire pour publier un post */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez quelque chose..."
          className="w-full border p-2 rounded mb-2"
        />
        <input
          type="file"
          onChange={(e) => setMedia(e.target.files[0])}
          className="mb-2"
        />
        <button
          onClick={publishPost}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Publier
        </button>
      </div>

      {/* Diffusion en direct */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-2">Diffusion en direct</h2>

        {/* Sélecteur Vidéo ou Audio */}
        <div className="flex gap-6 mb-4 items-center">
          {/* Option Vidéo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="video"
              checked={streamType === "video"}
              onChange={() => setStreamType("video")}
              className="hidden"
            />
            <div
              className={`p-2 rounded-full border-2 ${
                streamType === "video" ? "border-blue-600" : "border-gray-300"
              }`}
            >
              <img
                src="/video-94.svg" // Assure-toi que le fichier existe dans public
                alt="Vidéo"
                className="w-8 h-8"
              />
            </div>
          </label>

          {/* Option Audio */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="audio"
              checked={streamType === "audio"}
              onChange={() => setStreamType("audio")}
              className="hidden"
            />
            <div
              className={`p-2 rounded-full border-2 ${
                streamType === "audio" ? "border-green-600" : "border-gray-300"
              }`}
            >
              <img
                src="/audio-18.svg" // Assure-toi que le fichier existe dans public
                alt="Audio"
                className="w-8 h-8"
              />
            </div>
          </label>
        </div>

        {/* Boutons start/stop */}
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

        {/* Aperçu vidéo/audio */}
        {streamType === "video" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full mt-4 rounded shadow"
          />
        ) : (
          <audio ref={videoRef} autoPlay controls className="w-full mt-4" />
        )}
      </div>

      {/* Liste des posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded shadow">
            <p className="font-bold">{post.authorName}</p>
            {post.content && <p className="mt-1">{post.content}</p>}

            {post.mediaUrl && (
              <>
                {post.mediaUrl.endsWith(".mp4") ? (
                  <video
                    src={post.mediaUrl}
                    controls
                    className="w-full mt-2 rounded"
                  />
                ) : post.mediaUrl.endsWith(".mp3") ? (
                  <audio
                    src={post.mediaUrl}
                    controls
                    className="w-full mt-2"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="media"
                    className="w-full mt-2 rounded"
                  />
                )}
              </>
            )}

            {/* Bouton Like */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => likePost(post)}
                disabled={post.likedBy?.includes(user.uid)}
                className={`flex items-center gap-1 ${
                  post.likedBy?.includes(user.uid)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <img src="/like.svg" alt="J'aime" className="w-5 h-5" />
                <span>{post.likes || 0}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}