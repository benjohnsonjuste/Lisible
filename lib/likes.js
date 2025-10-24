import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// Ajoute un like si l'utilisateur n'a pas encore liké
export async function toggleLike(textId, userId) {
  if (!textId || !userId) return false;
  const ref = doc(db, "likes", textId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Nouveau document pour ce texte
    await setDoc(ref, {
      count: 1,
      users: { [userId]: true },
    });
    return { liked: true, count: 1 };
  }

  const data = snap.data();
  const alreadyLiked = data.users?.[userId];

  if (alreadyLiked) {
    // Retirer le like
    await updateDoc(ref, {
      count: Math.max(0, (data.count || 1) - 1),
      [`users.${userId}`]: false,
    });
    return { liked: false, count: Math.max(0, (data.count || 1) - 1) };
  } else {
    // Ajouter le like
    await updateDoc(ref, {
      count: (data.count || 0) + 1,
      [`users.${userId}`]: true,
    });
    return { liked: true, count: (data.count || 0) + 1 };
  }
}

// Récupère les infos de like
export async function getLikes(textId) {
  const ref = doc(db, "likes", textId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { count: 0, users: {} };
  return snap.data();
}