import { useState, useEffect } from "react";
import { UserPlus, Users } from "lucide-react";

export default function AuteursPage() {
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    const fetchAuthors = async () => {
      const res = await fetch("/api/get-authors");
      const data = await res.json();
      setAuthors(data);

      // Charger compteurs
      data.forEach(async (author) => {
        const resCount = await fetch(
          `/api/get-followers-count?authorId=${author.uid}`
        );
        const json = await resCount.json();
        setFollowersCount((prev) => ({
          ...prev,
          [author.uid]: json.followersCount || 0,
        }));
      });
    };
    fetchAuthors();
  }, []);

  const toggleFollow = async (author) => {
    if (!currentUser) return alert("Connectez-vous pour suivre un auteur.");

    try {
      const res = await fetch("/api/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower: currentUser, author }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowing((prev) =>
          data.isFollowing
            ? [...prev, author.uid]
            : prev.filter((id) => id !== author.uid)
        );
        setFollowersCount((prev) => ({
          ...prev,
          [author.uid]: data.followersCount,
        }));
      }
    } catch (err) {
      console.error("Erreur abonnement :", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold text-center mb-8">✍️ Auteurs Lisible</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {authors.map((author) => {
          const isFollowing = following.includes(author.uid);
          const count = followersCount[author.uid] || 0;

          return (
            <div
              key={author.uid}
              className="bg-white rounded-xl shadow p-5 flex flex-col items-center space-y-3 hover:shadow-lg transition"
            >
              <img
                src={author.photoURL || "/avatar.png"}
                alt={author.displayName || author.email}
                className="w-20 h-20 rounded-full object-cover"
              />
              <h3 className="font-semibold text-center">
                {author.displayName || author.email}
              </h3>

              <button
                onClick={() => toggleFollow(author)}
                className="mt-2 transition"
                title={isFollowing ? "Se désabonner" : "Suivre"}
              >
                <UserPlus
                  size={24}
                  className={`${
                    isFollowing ? "text-blue-600" : "text-gray-400"
                  } transition`}
                  fill={isFollowing ? "currentColor" : "none"}
                />
              </button>

              <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                <Users size={16} />
                <span>{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}