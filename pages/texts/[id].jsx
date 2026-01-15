"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { texts } from "@/lib/data";
import CommentForm from "@/components/CommentForm";

export default function TextPage() {
  const { id } = useParams();
  const text = texts.find((t) => t.id === id);
  const [comments, setComments] = useState(text?.comments || []);

  const handleLike = () => {
    if (!text.likes.includes("user1")) {
      text.likesCount += 1;
      text.likes.push("user1");
    }
  };

  const handleView = () => {
    if (!text.viewsList.includes("user1")) {
      text.views += 1;
      text.viewsList.push("user1");
    }
  };

  const handleComment = (message) => {
    const comment = {
      authorId: "user1",
      authorName: "Jean Dupont",
      message,
      createdAt: Date.now()
    };
    text.comments.push(comment);
    text.commentsCount += 1;
    setComments([...text.comments]);
  };

  useEffect(() => {
    handleView();
  }, []);

  if (!text) return <p>Texte introuvable</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-500">{text.authorName}</p>
      {text.imageUrl && <img src={text.imageUrl} alt="" className="my-4 w-full" />}
      <p className="mb-4">{text.content}</p>
      <div className="flex space-x-4 mb-4">
        <button onClick={handleLike}>❤️ J'aime ({text.likesCount})</button>
        <span>👁 Vues : {text.views}</span>
      </div>
      <div>
        <h2 className="font-semibold mb-2">Commentaires</h2>
        {comments.map((c, i) => (
          <div key={i} className="border p-2 rounded mb-2">
            <p className="text-sm font-medium">{c.authorName}</p>
            <p>{c.message}</p>
          </div>
        ))}
        <CommentForm onAdd={handleComment} />
      </div>
    </div>
  );
}