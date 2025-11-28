import React, { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// -----------------------------
// CONFIG - replace with your values
// -----------------------------
// Provide your Firebase config here or load it from environment variables.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "REPLACE_WITH_AUTH_DOMAIN",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "REPLACE_WITH_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "REPLACE_BUCKET",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "REPLACE_MSG_SENDER",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "REPLACE_APP_ID",
};

// GitHub commit endpoint (serverless). To commit safely to GitHub you should use
// a server-side function. The example serverless function is included in the
// README section of this file. Set REACT_APP_GITHUB_COMMIT_ENDPOINT to the
// URL of the endpoint.
const GITHUB_COMMIT_ENDPOINT = process.env.REACT_APP_GITHUB_COMMIT_ENDPOINT || "/api/github-commit";

// -----------------------------
// Initialize Firebase
// -----------------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// -----------------------------
// Utility: device id to de-duplicate likes per device
// -----------------------------
function getOrCreateDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// -----------------------------
// Main component
// -----------------------------
export default function TextPage() {
  const [user, setUser] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const deviceId = useRef(getOrCreateDeviceId());

  useEffect(() => {
    // Auth: try anonymous sign-in so we have a uid for likes/comments if user doesn't register
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else {
        // sign in anonymously if nobody
        signInAnonymously(auth).catch((e) => console.error(e));
      }
    });

    // Firestore: listen to 'library' collection, ordered by createdAt
    const q = query(collection(db, "library"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          // get likes count (stored as map or number) and comments count summary
          // For performance you may store aggregated counters; here we read counts live.
          // We'll attach a small shape used by UI.
          return {
            id: d.id,
            ...data,
          };
        })
      );
      setTexts(items);
      setLoading(false);
    });

    return () => {
      unsub();
      unsubAuth();
    };
  }, []);

  // Helper: check if current user/device already liked a text
  async function checkIfLiked(textId) {
    const uid = user?.uid || deviceId.current;
    const likeDoc = await getDoc(doc(db, "library", textId, "likes", uid));
    return likeDoc.exists();
  }

  // Toggle like: single click registers a like (idempotent). We enforce unique like by
  // using a document per user/device in subcollection 'likes'.
  async function handleLike(textId) {
    try {
      const uid = user?.uid || deviceId.current;
      const likeRef = doc(db, "library", textId, "likes", uid);
      const liked = (await getDoc(likeRef)).exists();
      if (liked) {
        // unlike: delete the doc
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          by: uid,
          userDisplayName: user?.displayName || null,
          deviceId: deviceId.current,
          createdAt: serverTimestamp(),
        });
      }
      // Optimistic UI: Firestore listener will update counts; but we can also update local state
      // Trigger GitHub sync in background (fire-and-forget)
      syncToGitHub({ action: liked ? "unlike" : "like", textId, by: uid });
    } catch (e) {
      console.error("Like failed", e);
    }
  }

  // Add comment: only for authenticated (not anonymous) users who have a displayName.
  async function handleAddComment(textId) {
    const content = (commentInputs[textId] || "").trim();
    if (!content) return;
    const u = auth.currentUser;
    if (!u || u.isAnonymous) {
      alert("Veuillez vous connecter pour commenter.");
      return;
    }
    try {
      const c = collection(db, "library", textId, "comments");
      await addDoc(c, {
        text: content,
        by: u.uid,
        displayName: u.displayName || u.email || "Utilisateur",
        createdAt: serverTimestamp(),
      });
      setCommentInputs((s) => ({ ...s, [textId]: "" }));
      syncToGitHub({ action: "comment", textId, by: u.uid, text: content });
    } catch (e) {
      console.error(e);
    }
  }

  // Share text using Web Share API or fallback to copy
  async function handleShare(text) {
    const payload = {
      title: text.title || "Texte",
      text: text.content || "",
      url: window.location.href + "#text-" + text.id,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch (e) {
        console.error("Share failed", e);
      }
    } else {
      // fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${payload.title}\n\n${payload.text}\n\n${payload.url}`);
        alert("Texte copié dans le presse-papier — vous pouvez le coller où vous voulez.");
      } catch (e) {
        console.error(e);
        alert("Impossible de copier automatiquement — sélectionnez et copiez manuellement.");
      }
    }
  }

  // Sync to GitHub: POST to your serverless endpoint which holds a GitHub token.
  // We do not recommend having a GitHub PAT in the browser. The endpoint should
  // commit a small JSON or append to a file, depending on your repo strategy.
  async function syncToGitHub(payload) {
    try {
      await fetch(GITHUB_COMMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("GitHub sync failed (this won't break Firestore):", e);
    }
  }

  // Render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library — Textes partagés</h1>
        <AuthWidget />
      </header>

      <main className="max-w-4xl mx-auto space-y-4">
        {loading && <div>Chargement...</div>}
        {!loading && texts.length === 0 && <div>Aucun texte dans la library.</div>}

        {texts.map((t) => (
          <ArticleCard
            key={t.id}
            textItem={t}
            onLike={() => handleLike(t.id)}
            onShare={() => handleShare(t)}
            commentValue={commentInputs[t.id] || ""}
            onCommentChange={(v) => setCommentInputs((s) => ({ ...s, [t.id]: v }))}
            onAddComment={() => handleAddComment(t.id)}            currentUser={user}
          />
        ))}
      </main>
    </div>
  );
}

// -----------------------------
// Small helper components
// -----------------------------
function ArticleCard({ textItem, onLike, onShare, commentValue, onCommentChange, onAddComment, currentUser }) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // Listen to likes and comments counts for this item
    const likesCol = collection(getFirestore(), "library", textItem.id, "likes");
    const commentsCol = collection(getFirestore(), "library", textItem.id, "comments");

    // lightweight subscriptions: we only need counts and last comments preview in this UI.
    const unsubLikes = onSnapshot(likesCol, (snap) => {
      setLikeCount(snap.size);
      const uid = currentUser?.uid || localStorage.getItem("deviceId");
      setLiked(snap.docs.some((d) => d.id === uid));
    });

    const q = query(commentsCol, orderBy("createdAt", "desc"));
    const unsubComments = onSnapshot(q, (snap) => {
      setComments(snap.docs.slice(0, 5).map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLikes();
      unsubComments();
    };
  }, [textItem.id, currentUser]);

  return (
    <article id={`text-${textItem.id}`} className="bg-white rounded-2xl shadow p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-lg">{textItem.title || "(Sans titre)"}</h2>
          <p className="text-sm text-gray-600">{textItem.author || "Anonyme"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            className={`px-3 py-1 rounded-full border transition-colors ${liked ? "bg-red-600 text-white" : "bg-white text-gray-700"}`}>
            ❤️ {likeCount}
          </button>
          <button onClick={onShare} className="px-3 py-1 rounded-full border">Partager</button>
        </div>
      </div>

      <div className="mt-3 whitespace-pre-wrap">{textItem.content}</div>

      <div className="mt-4">
        <h3 className="text-sm font-medium">Commentaires</h3>
        <div className="space-y-2 mt-2">
          {comments.length === 0 && <div className="text-sm text-gray-500">Aucun commentaire — soyez le premier.</div>}
          {comments.map((c) => (
            <div key={c.id} className="text-sm border rounded p-2">
              <div className="text-xs text-gray-500">{c.displayName}</div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={commentValue}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Écrire un commentaire..."
            className="flex-1 rounded border p-2"
          />
          <button onClick={onAddComment} className="px-4 rounded bg-blue-600 text-white">Envoyer</button>
        </div>
      </div>
    </article>
  );
}

// -----------------------------
// Simple Auth widget for display + quick login/signup (email)
// -----------------------------
function AuthWidget() {
  const [u, setU] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => onAuthStateChanged(getAuth(), (user) => setU(user)), []);

  async function register() {
    try {
      const res = await createUserWithEmailAndPassword(getAuth(), email, pass);
      // Optionally update displayName elsewhere
      console.log("Registered", res.user.uid);
    } catch (e) {
      alert("Erreur inscription: " + e.message);
    }
  }
  async function login() {
    try {
      await signInWithEmailAndPassword(getAuth(), email, pass);
    } catch (e) {
      alert("Erreur login: " + e.message);
    }
  }
  async function logout() {
    await signOut(getAuth());
  }

  if (!u) {
    return (
      <div className="flex items-center gap-2">
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-2 py-1" />
        <input placeholder="mot de passe" value={pass} onChange={(e) => setPass(e.target.value)} type="password" className="border rounded px-2 py-1" />
        <button onClick={login} className="px-3 py-1 bg-blue-600 text-white rounded">Se connecter</button>
        <button onClick={register} className="px-2 py-1 border rounded">S'inscrire</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">{u.displayName || u.email || "Utilisateur"}</div>
      <button onClick={logout} className="px-3 py-1 border rounded">Déconnexion</button>
    </div>
  );
}

/*
README / Serverless example (Node.js / Next.js / Vercel style)
--------------------------------------------------------------
Save this snippet as /api/github-commit.js on your server (Vercel/Cloud Functions).
It expects the following env vars in your server environment:
  GITHUB_TOKEN - a GitHub personal access token (scopes: repo)
  GITHUB_REPO - owner/repo (e.g. yourname/yourrepo)
  GITHUB_BRANCH - branch to commit to (e.g. main)
  GITHUB_PATH - path inside repo where to store events, e.g. data/events.json

This endpoint accepts POST with JSON payload describing the event. The implementation
below commits (creates/updates) a JSON file appending the event to an array.

NOTE: Keep the token on server only. Do NOT embed it in browser code.
*/

// Example serverless handler (Node/Express or Next.js API route):
// (This code is provided as reference — save on your server environment)

/*
const fetch = require('node-fetch');
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // owner/repo
  const branch = process.env.GITHUB_BRANCH || 'main';
  const path = process.env.GITHUB_PATH || 'data/events.json';
  if (!token || !repo) return res.status(500).json({ error: 'Missing server env vars' });

  const payload = req.body;

  // 1) Get current file content (if exists)
  const getUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
  const headers = { Authorization: `token ${token}`, 'User-Agent': 'TextPage-App' };
  let sha = null;
  let events = [];
  const getRes = await fetch(getUrl, { headers });
  if (getRes.status === 200) {
    const j = await getRes.json();
    sha = j.sha;
    const decoded = Buffer.from(j.content, 'base64').toString('utf8');
    try { events = JSON.parse(decoded); } catch(e){ events = []; }
  }

  // append event
  events.push({ ...payload, ts: new Date().toISOString() });
  const newContent = Buffer.from(JSON.stringify(events, null, 2)).toString('base64');

  const commitRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Update events from TextPage',
      content: newContent,
      sha: sha || undefined,
      branch,
    }),
  });
  const commitJson = await commitRes.json();
  if (commitRes.status >= 200 && commitRes.status < 300) return res.status(200).json({ ok: true, commit: commitJson });
  return res.status(500).json({ error: commitJson });
};
*/

/*
Deployment notes & security
- Do not put GITHUB_TOKEN in the browser code. Use the serverless endpoint.
- For very large apps, avoid committing every user event to GitHub (rate limits). Use batching.
- Consider adding authentication to your /api/github-commit endpoint to avoid abuse.

How it stores data:
- Firestore:
  - Collection `library` with documents for each text: { title, content, author, createdAt }
  - Subcollection `likes` under each text: doc id = userId or deviceId
  - Subcollection `comments` under each text
- GitHub:
  - Serverless endpoint appends events to a JSON file in your repo (data/events.json)

This React component uses real-time listeners (onSnapshot) so the page updates without reload.

Optional improvements
- Pagination / infinite scroll
- Aggregated counters stored in parent doc for efficiency
- Rich text / markdown rendering
- Replace anonymous default sign-in with OAuth providers (Google/GitHub)
*/
