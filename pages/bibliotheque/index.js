import { useEffect, useState } from "react";
import TextCard from "@/components/TextCard";

export default function BibliothequePage() {
  const [texts, setTexts] = useState([]);

  const fetchTexts = async () => {
    const res = await fetch("/api/github-texts");
    const json = await res.json();
    if (res.ok) setTexts(json.data);
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  return (
    <main className="max-w-6xl mx-auto py-10 px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {texts.map((text) => (
        <TextCard key={text.id} text={text} />
      ))}
    </main>
  );
}
