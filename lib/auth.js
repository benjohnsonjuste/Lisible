import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

export const listenAuth = (cb) =>
  onAuthStateChanged(auth, (user) => cb(user));