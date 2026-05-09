"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Eye,
  Heart,
  Loader2,
  Trophy,
  ShieldCheck,
  Search,
  Sparkles,
  Megaphone,
  AlignLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque({ initialTexts = [] }) {
  // Sécurité : s'assurer que texts est toujours un tableau
  const [texts, setTexts] = useState(
    Array.isArray(initialTexts) ? initialTexts : []
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  const [activeGenre, setActiveGenre] = useState("Tous");
  const genres = [
    "Tous",
    "Poésie",
    "Nouvelle",
    "Roman",
    "Chronique",
    "Essai",
    "Battle Poétique",
  ];

  useEffect(() => {
    setMounted(true);
    fetchInitial();
    const interval = setInterval(fetchInitial, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitial = async () => {
    // On ne met loading=true que si on n'a vraiment rien à afficher
    if (!texts || texts.length === 0) setLoading(true);

    try {
      /**
       * API générale github-db
       * On récupère :
       * - data/texts
       * - data/publications
       * - data/users
       */
      const [textsRes, publicationsRes, usersRes] = await Promise.all([
        fetch(`/api/github-db?type=texts`),
        fetch(`/api/github-db?type=publications`),
        fetch(`/api/github-db?type=users`),
      ]);

      const [textsJson, publicationsJson, usersJson] = await Promise.all([
        textsRes.json(),
        publicationsRes.json(),
        usersRes.json(),
      ]);

      const rawTexts = Array.isArray(textsJson?.content)
        ? textsJson.content
        : [];

      const rawPublications = Array.isArray(publicationsJson?.content)
        ? publicationsJson.content
        : [];

      const rawUsers = Array.isArray(usersJson?.content)
        ? usersJson.content
        : [];

      /**
       * Index rapide des users
       */
      const usersMap = {};
      rawUsers.forEach((u) => {
        const key =
          u?.email ||
          u?.id ||
          u?.uid ||
          u?.username;

        if (key) usersMap[key] = u;
      });

      /**
       * Publications indexées par textId
       */
      const publicationMap = {};
      rawPublications.forEach((pub) => {
        const key =
          pub?.textId ||
          pub?.id ||
          pub?.publicationId;

        if (!key) return;

        publicationMap[key] = {
          ...publicationMap[key],
          ...pub,
        };
      });

      /**
       * Fusion des données
       */
      const mergedTexts = rawTexts
        .filter((t) => t && (t.id || t.textId))
        .map((text) => {
          const textId = text.id || text.textId;

          const publication =
            publicationMap[textId] || {};

          const user =
            usersMap[text.authorEmail] ||
            usersMap[text.userEmail] ||
            usersMap[text.authorId] ||
            {};

          return {
            ...text,
            ...publication,

            id: textId,

            title:
              text.title ||
              publication.title ||
              "Sans titre",

            summary:
              text.summary ||
              text.description ||
              publication.summary ||
              "",

            author:
              text.author ||
              text.authorName ||
              user.name ||
              user.username ||
              "Anonyme",

            authorName:
              text.authorName ||
              user.name ||
              user.username ||
              "Anonyme",

            authorEmail:
              text.authorEmail ||
              user.email ||
              "",

            image:
              text.image ||
              publication.image ||
              text.cover ||
              "",

            genre:
              text.genre ||
              publication.genre ||
              "Écrit",

            category:
              text.category ||
              publication.category ||
              text.genre ||
              "Écrit",

            date:
              text.date ||
              publication.date ||
              publication.createdAt ||
              text.createdAt ||
              new Date().toISOString(),

            /**
             * Statistiques consolidées
             */
            views: Number(
              publication.views ||
                text.views ||
                publication.totalViews ||
                0
            ),

            likes: Number(
              publication.likes ||
                text.likes ||
                publication.totalLikes ||
                0
            ),

            certified: Number(
              publication.certified ||
                text.certified ||
                publication.totalCertified ||
                0
            ),

            totalViews: Number(
              publication.totalViews ||
                publication.views ||
                text.views ||
                0
            ),

            totalLikes: Number(
              publication.totalLikes ||
                publication.likes ||
                text.likes ||
                0
            ),

            totalCertified: Number(
              publication.totalCertified ||
                publication.certified ||
                text.certified ||
                0
            ),
          };
        });

      const sorted = [...mergedTexts].sort((a, b) => {
        const certA = Number(
          a?.certified || a?.totalCertified || 0
        );
        const certB = Number(
          b?.certified || b?.totalCertified || 0
        );

        if (certB !== certA) return certB - certA;

        const likesA = Number(
          a?.likes || a?.totalLikes || 0
        );

        const likesB = Number(
          b?.likes || b?.totalLikes || 0
        );

        if (likesB !== likesA) return likesB - likesA;

        // Sécurité sur la date pour le tri
        const dateA = a?.date
          ? new Date(a.date).getTime()
          : 0;

        const dateB = b?.date
          ? new Date(b.date).getTime()
          : 0;

        return dateB - dateA;
      });

      setTexts(sorted);
    } catch (e) {
      console.error("Fetch error:", e);

      if (!texts || texts.length === 0) {
        toast.error(
          "Le Grand Livre des manuscrits est inaccessible."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTexts = useMemo(() => {
    if (!Array.isArray(texts)) return [];

    return texts.filter((t) => {
      if (!t) return false;

      const title = (t.title || "").toLowerCase();
      const author = (
        t.author ||
        t.authorName ||
        ""
      ).toLowerCase();

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        title.includes(search) ||
        author.includes(search);

      const matchesGenre =
        activeGenre === "Tous" ||
        t.genre === activeGenre ||
        t.category === activeGenre;

      return matchesSearch && matchesGenre;
    });
  }, [texts, searchTerm, activeGenre]);

  // Éviter l'erreur d'hydratation : ne rien rendre de dynamique avant le mount
  if (!mounted && initialTexts.length === 0) return null;

  if (loading && (!texts || texts.length === 0))
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
        <Loader2
          className="animate-spin text-teal-600"
          size={40}
        />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Ouverture des archives...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 font-sans bg-[#FCFBF9] min-h-screen">
      <div className="text-center mb-16 space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles
            size={14}
            className="text-teal-600"
          />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-teal-600">
            Patrimoine Littéraire
          </span>
        </div>

        <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
          Les Archives.
        </h1>
      </div>

      <div className="space-y-10 mb-20">
        <div className="relative max-w-2xl mx-auto group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"
            size={20}
          />

          <input
            type="text"
            placeholder="Rechercher une œuvre, une plume..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] pl-16 pr-8 py-7 text-sm font-bold outline-none focus:border-teal-500/20 transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-7 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                activeGenre === g
                  ? "bg-slate-950 border-slate-950 text-white shadow-xl scale-105"
                  : "bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600 shadow-sm"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
        {filteredTexts.map((item) => {
          if (!item || !item.id) return null;

          const isDuel =
            item.isConcours === true ||
            item.category === "Battle Poétique" ||
            item.genre === "Battle Poétique";

          const authorEmail =
            item.authorEmail || "";

          const isAnnouncementAccount = [
            "adm.lablitteraire7@gmail.com",
            "cmo.lablitteraire7@gmail.com",
          ].includes(authorEmail);

          const isOtherAdmin = [
            "jb7management@gmail.com",
          ].includes(authorEmail);

          const hasSceau =
            (item.certified ||
              item.totalCertified ||
              0) > 0;

          const displayViews =
            item.views ||
            item.totalViews ||
            0;

          const displayLikes =
            item.likes ||
            item.totalLikes ||
            0;

          const displayCerts =
            item.certified ||
            item.totalCertified ||
            0;

          return (
            <Link
              href={`/texts/${item.id}`}
              key={item.id}
              className="group"
            >
              <article
                className={`h-full bg-white rounded-[3.5rem] overflow-hidden border transition-all duration-500 flex flex-col relative ${
                  isDuel
                    ? "border-teal-100 shadow-teal-900/5"
                    : "border-slate-50 shadow-slate-200/50"
                } hover:-translate-y-2 hover:shadow-2xl hover:border-teal-500/10`}
              >
                {!isDuel ? (
                  <div className="h-64 bg-slate-100 relative overflow-hidden">
                    <img
                      src={
                        item.image ||
                        item.imageBase64 ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`
                      }
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1457369804593-54844a3964ad?q=80&w=800";
                      }}
                    />

                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {isAnnouncementAccount ? (
                        <span className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                          <Megaphone size={12} />{" "}
                          Annonce
                        </span>
                      ) : isOtherAdmin ? (
                        <span className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                          <ShieldCheck size={12} />{" "}
                          Officiel
                        </span>
                      ) : (
                        hasSceau && (
                          <span className="bg-teal-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                            <ShieldCheck size={12} />{" "}
                            Certifié
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-32 bg-teal-50/50 flex items-center px-10 border-b border-teal-100/50">
                    <span className="bg-teal-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <Trophy size={12} /> Duel de
                      Plume
                    </span>
                  </div>
                )}

                <div className="p-10 flex-grow flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1">
                      {isDuel && (
                        <AlignLeft size={10} />
                      )}{" "}
                      {item.category ||
                        item.genre ||
                        "Écrit"}
                    </span>

                    <span className="w-1 h-1 bg-slate-200 rounded-full" />

                    <span className="text-[10px] font-bold text-slate-300 tracking-tighter">
                      {mounted && item.date
                        ? new Date(
                            item.date
                          ).getFullYear()
                        : "2026"}
                    </span>

                    {hasSceau && (
                      <span className="ml-auto text-teal-600 animate-pulse">
                        <ShieldCheck size={16} />
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-black italic mb-4 tracking-tighter leading-none text-slate-900 group-hover:text-teal-600 transition-colors">
                    {item.title || "Sans titre"}
                  </h2>

                  <p className="text-slate-500 line-clamp-3 font-serif italic mb-10 text-[17px] leading-relaxed">
                    {item.summary ||
                      (isDuel
                        ? "Un défi lancé dans l'arène poétique..."
                        : "Un nouveau manuscrit scellé dans les registres de l'Atelier...")}
                  </p>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-[12px] font-black border-4 border-white">
                        {(
                          item.author ||
                          item.authorName ||
                          "L"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">
                          {item.author ||
                            item.authorName ||
                            "Anonyme"}
                        </span>

                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-1">
                          {isAnnouncementAccount
                            ? "Compte Officiel"
                            : hasSceau
                            ? "Plume Certifiée"
                            : "Auteur Scellé"}
                        </span>
                      </div>
                    </div>

                    {!isAnnouncementAccount && (
                      <div className="flex gap-5 text-slate-300 text-[11px] font-black">
                        <span className="flex items-center gap-2 transition-colors hover:text-teal-600">
                          <Eye size={18} />{" "}
                          {displayViews}
                        </span>

                        <span className="flex items-center gap-2 transition-colors hover:text-rose-500">
                          <Heart size={18} />{" "}
                          {displayLikes}
                        </span>

                        {displayCerts > 0 && (
                          <span className="flex items-center gap-2 transition-colors hover:text-teal-600">
                            <ShieldCheck size={18} />{" "}
                            {displayCerts}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {filteredTexts.length === 0 &&
        !loading &&
        mounted && (
          <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 mt-20">
            <Search
              className="text-slate-100 mx-auto mb-6"
              size={64}
            />

            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm mx-auto">
              Aucun manuscrit n'a été trouvé dans ce
              compartiment des archives.
            </p>
          </div>
        )}
    </div>
  );
}