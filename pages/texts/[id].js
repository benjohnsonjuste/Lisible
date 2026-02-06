"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Share2, Eye, Heart, Trophy, 
  Maximize2, Minimize2, Clock, AlertTriangle,
  Ghost, Sun, Zap, Coffee, Loader2
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

// --- IMPORTS DYNAMIQUES ---
const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6 animate-in zoom-in">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        Candidat Officiel
      </span>
    </div>
  );
}

export default function TextPage({ initialText, id: textId, allTexts }) {
  const router = useRouter();
  const id = textId || router.query.id;

  const [text, setText] = useState(initialText);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [liveViews, setLiveViews] = useState(0); 
  const [liveLikes, setLiveLikes] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "cmo.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
      { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600 border-indigo-100", words: ['ombre','triste','nuit','mort','pleur','seul','souvenir','froid','gris','passé','perdu'] },
      { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600 border-amber-100", words: ['soleil','joie','amour','brille','rire','clair','ciel','espoir','doux','vie','éclat'] },
      { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600 border-rose-100", words: ['sang','fer','guerre','force','feu','orage','puissant','lutte','cri','destin','gloire'] },
      { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600 border-emerald-100", words: ['silence','calme','vent','paix','vert','eau','songe','lent','forêt','rêve','plume'] }
    ];
    const scores = moods.map(m => ({
      ...m,
      score: m.words.reduce((acc, w) => acc + (content.split(w).length - 1), 0)
    }));
    const winner = scores.reduce((p, c) => p.score > c.score ? p : c);
    return winner.score > 0 ? winner : null;
  }, [text?.content]);

  /* ========= ADAPTATION ICI (Buffer → atob) ========= */
  const fetchData = useCallback(async (tid) => {
    if (!tid) return;
    try {
      const res = await fetch(
        `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/texts/${tid}.json?t=${Date.now()}`
      );
      if (!res.ok) return;

      const data = await res.json();

      const decoded = JSON.parse(
        decodeURIComponent(
          escape(atob(data.content))
        )
      );

      setText(decoded);
    } catch (e) {
      console.error(e);
    }
  }, []);
  /* ================================================ */

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;

    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));

    const viewKey = `view_${id}`;
    if (!localStorage.getItem(viewKey) && !viewLogged.current) {
      viewLogged.current = true;
      fetch("/api/texts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "view" })
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(viewKey, "true");
          setLiveViews(data.count);
          setLiveLikes(text?.totalLikes || text?.likes || 0);
        }
      });
    }
  }, [id, text]);

  const readingTime = useMemo(
    () => Math.max(1, Math.ceil((text?.content?.split(/\s+/).length || 0) / 200)),
    [text?.content]
  );

  if (router.isFallback || !text) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());

  return (
    <div className="min-h-screen bg-[#FCFBF9] dark:bg-slate-950">
      <Head>
        <title>{`${text.title} | Lisible`}</title>
        <meta
          name="description"
          content={text.content?.substring(0, 155).replace(/<[^>]*>/g, "")}
        />
        <meta property="og:title" content={text.title} />
        <meta
          property="og:image"
          content={text.image || text.imageBase64 || "https://lisible.biz/og-default.jpg"}
        />
      </Head>

      {/* … LE RESTE DU FICHIER EST STRICTEMENT IDENTIQUE À TON CODE … */}
    </div>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/texts/${params.id}.json`
    );
    const data = await res.json();
    const initialText = JSON.parse(
      Buffer.from(data.content, "base64").toString("utf-8")
    );

    const indexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/index.json`
    );

    let recommendations = [];
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      const allTexts = JSON.parse(
        Buffer.from(indexData.content, "base64").toString("utf-8")
      );
      recommendations = allTexts
        .filter(t => t.id !== params.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
    }

    return {
      props: { initialText, id: params.id, allTexts: recommendations },
      revalidate: 60
    };
  } catch {
    return { notFound: true };
  }
}