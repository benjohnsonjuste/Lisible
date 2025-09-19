import { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, addDoc, deleteDoc, getDocs, doc, updateDoc, increment } from "firebase/firestore";

export default function FollowButton({ authorId }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const checkFollow = async () => {
      const q = query(
        collection(db, "followers"),
        where("followerId", "==", auth.currentUser.uid),
        where("authorId", "==", authorId)
      );
      const snap = await getDocs(q);
      setIsFollowing(!snap.empty);
    };
    checkFollow();
  }, [authorId]);

  const handleFollow = async () => {
    setLoading(true);
    if (isFollowing) {
      // Se désabonner
      const q = query(
        collection(db, "followers"),
        where("followerId", "==", auth.currentUser.uid),
        where("authorId", "==", authorId)
      );
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(doc(db, "followers", d.id));
      });
      await updateDoc(doc(db, "users", authorId), { followers: increment(-1) });
      setIsFollowing(false);
    } else {
      // S'abonner
      await addDoc(collection(db, "followers"), {
        followerId: auth.currentUser.uid,
        authorId,
        followedAt: new Date(),
      });
      await updateDoc(doc(db, "users", authorId), { followers: increment(1) });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  return (
    <button onClick={handleFollow} disabled={loading}>
      {isFollowing ? "Se désabonner" : "S'abonner"}
    </button>
  );
}