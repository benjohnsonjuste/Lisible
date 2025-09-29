import { useEffect, useRef, useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function LisibleClubPage() {
  const [user, setUser] = useState(null);
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const [peerConnections, setPeerConnections] = useState({});

  /** 🔹 Authentification utilisateur */
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  /** 🔹 Charger les posts en temps réel */
  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  /** 🔹 Publier un post (texte, image, vidéo, audio) */
  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) return alert("Vous devez être connecté pour publier.");
    setLoading(true);

    try {
      let mediaUrl = "";

      // Gestion upload média si nécessaire
      if (file && type !== "text") {
        const storageRef = ref(
          storage,
          `clubPosts/${user.uid}/${Date.now()}_${file.name}`
        );

        const uploadTask = uploadBytesResumable(storageRef, file);

        mediaUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => {
              console.error("Erreur upload fichier:", error);
              reject(error);
            },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      const newPost = {
        authorId: user.uid,
        authorName: user.displayName || "Auteur inconnu",
        type,
        content: type === "text" ? content.trim() : mediaUrl,
        description: description.trim(),
        createdAt: serverTimestamp(),
        likes: 0,
      };

      await addDoc(collection(db, "clubPosts"), newPost);

      // Réinitialiser le formulaire
      setContent("");
      setFile(null);
      setDescription("");
      setType("text");
      alert("Publication réussie !");
    } catch (err) {
      console.error("Erreur publication:", err);
      alert("Impossible de publier, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Démarrer un live (Vidéo ou Audio) */
  const startLive = async (isVideo = true) => {
    if (!user) return alert("Connectez-vous pour démarrer un live.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Créer un post pour annoncer le live
      const livePostRef = await addDoc(collection(db, "clubPosts"), {
        authorId: user.uid,
        authorName: user.displayName || "Auteur inconnu",
        type: isVideo ? "live_video" : "live_audio",
        description: description || "Live en cours",
        createdAt: serverTimestamp(),
      });

      // Configuration de WebRTC
      const pc = new RTCPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await setDoc(
            doc(db, "liveCandidates", `${livePostRef.id}_${user.uid}`),
            { candidate: event.candidate.toJSON() },
            { merge: true }
          );
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await setDoc(doc(db, "liveOffers", livePostRef.id), {
        sdp: offer.sdp,
        type: offer.type,
        authorId: user.uid,
      });

      setPeerConnections((prev) => ({ ...prev, [livePostRef.id]: pc }));
    } catch (err) {
      console.error("Erreur live:", err);
      alert("Impossible de démarrer le live.");
    }
  };

  /** 🔹 Arrêter le live */
  const stopLive = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center mt-10 text-lg">
        Connectez-vous pour accéder à Lisible Club.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 🔹 Formulaire de publication */}
      <form
        onSubmit={handlePost}
        className="bg-white p-6 rounded-2xl shadow-lg space-y-4"
      >
        <h2 className="text-xl font-bold">Publier sur Lisible Club</h2>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="text">Texte</option>
          <option value="image">Image</option>
          <option value="video">Vidéo</option>
          <option value="audio">Audio</option>
          <option value="live_video">Direct Vidéo</option>
          <option value="live_audio">Direct Audio</option>
        </select>

        {/* Zone de saisie selon le type */}
        {type === "text" ? (
          <textarea
            placeholder="Écrivez votre texte ici..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
          />
        ) : type.includes("live") ? (
          <div className="flex gap-2">
            {!localStream ? (
              <button
                type="button"
                onClick={() => startLive(type === "live_video")}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Démarrer {type === "live_video" ? "Live Vidéo" : "Live Audio"}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopLive}
                className="px-4 py-2 bg-gray-600 text-white rounded-md"
              >
                Arrêter le live
              </button>
            )}

            {type === "live_video" && (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full mt-2 rounded-md"
              />
            )}
          </div>
        ) : (
          <input
            type="file"
            accept={
              type === "image"
                ? "image/*"
                : type === "video"
                ? "video/*"
                : "audio/*"
            }
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full p-2 border rounded-md"
          />
        )}

        <input
          type="text"
          placeholder="Légende ou description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md"
        />

        {!type.includes("live") && (
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 rounded-lg text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Publication..." : "Publier"}
          </button>
        )}
      </form>

      {/* 🔹 Affichage des posts */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-center text-gray-500">Aucun post pour l'instant.</p>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-xl shadow space-y-2"
          >
            <h3 className="font-semibold">{post.authorName}</h3>
            {post.description && (
              <p className="text-gray-600 text-sm">{post.description}</p>
            )}

            {post.type === "text" && (
              <p className="mt-2 text-lg whitespace-pre-line">{post.content}</p>
            )}
            {post.type === "image" && (
              <img
                src={post.content}
                alt="Publication"
                className="mt-2 rounded-lg w-full"
              />
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
    </div>
  );
                  }
