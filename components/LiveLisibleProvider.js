import { useEffect, useState, createContext, useContext } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const LiveContext = createContext();

export function LiveLisibleProvider({ children }) {
  const [texts, setTexts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubTexts = onSnapshot(query(collection(db, "texts"), orderBy("createdAt", "desc")),
      snapshot => setTexts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubPosts = onSnapshot(query(collection(db, "clubPosts"), orderBy("createdAt", "desc")),
      snapshot => setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubEvents = onSnapshot(query(collection(db, "events"), orderBy("startDate", "asc")),
      snapshot => setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      unsubTexts();
      unsubPosts();
      unsubEvents();
    };
  }, []);

  return (
    <LiveContext.Provider value={{ texts, posts, events }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLiveLisible() {
  return useContext(LiveContext);
}