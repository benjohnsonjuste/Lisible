import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  increment,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Publier un texte dans la bibliothèque
 */
export async function publishText({ title, genre, caractere, authorId, authorName }) {
  try {
    const ref = collection(db, "bibliotheque");
    const docRef = await addDoc(ref, {
      title,
      genre,
      caractere,
      authorId,
      authorName,
      createdAt: serverTimestamp(),
      likes: 0,
      views: 0,
    });
    return docRef.id;
  } catch (err) {
    console.error("Erreur publishText:", err);
  }
}

/**
 * Publier un média (image, vidéo, audio) ou un post texte dans Lisible Club
 */
export async function publishMedia({ type, content, url, authorId, authorName }) {
  try {
    const ref = collection(db, "clubPosts");
    const docRef = await addDoc(ref, {
      type, // "text", "image", "video", "audio", "live_video", "live_audio"
      content,
      url: url || null,
      authorId,
      authorName,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      views: 0,
    });
    return docRef.id;
  } catch (err) {
    console.error("Erreur publishMedia:", err);
  }
}

/**
 * Ajouter un like à une publication
 */
export async function likePost(postId, userId) {
  try {
    const ref = doc(db, "clubPosts", postId);
    await updateDoc(ref, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
  } catch (err) {
    console.error("Erreur likePost:", err);
  }
}

/**
 * Incrémenter le compteur de vues
 */
export async function incrementViews(postId) {
  try {
    const ref = doc(db, "clubPosts", postId);
    await updateDoc(ref, {
      views: increment(1),
    });
  } catch (err) {
    console.error("Erreur incrementViews:", err);
  }
}

/**
 * Ajouter un commentaire sur un post
 */
export async function addComment(postId, { authorId, authorName, text }) {
  try {
    const ref = collection(db, "clubPosts", postId, "comments");
    await addDoc(ref, {
      authorId,
      authorName,
      text,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Erreur addComment:", err);
  }
}

/**
 * Récupérer toutes les publications de Lisible Club
 */
export async function getAllClubPosts() {
  try {
    const ref = collection(db, "clubPosts");
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Erreur getAllClubPosts:", err);
    return [];
  }
}