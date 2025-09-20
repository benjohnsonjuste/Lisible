import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function AuthorPage({ author }) {
  return (
    <div>
      <img
        src={author.avatarUrl || "/images/avatar-default.png"}
        alt="Avatar"
        style={{ width: 150, borderRadius: "50%" }}
      />
      <h1>{author.name}</h1>
      {/* Afficher ses textes */}
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const docRef = doc(db, "authors", params.id);
  const docSnap = await getDoc(docRef);
  const author = docSnap.exists() ? docSnap.data() : null;

  return { props: { author } };
}