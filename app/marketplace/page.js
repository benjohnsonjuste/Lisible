"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Briefcase, Users, FlaskConical, ArrowRight } from "lucide-react";
import { apiGet, CATEGORIES } from "@/components/freelance/api";
import TaskCard from "@/components/freelance/TaskCard";
import ProCard from "@/components/freelance/ProCard";

const TABS = [
  { key: "missions", label: "Missions" },
  { key: "pros", label: "Professionnels" },
];

export default function MarketplacePage() {
  const [tab, setTab] = useState("missions");
  const [tasks, setTasks] = useState([]);
  const [pros, setPros] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [t, p] = await Promise.all([
          apiGet("list_tasks", { status: "open" }),
          apiGet("list_pros"),
        ]);
        setTasks(t.tasks || []);
        setPros(p.pros || []);
        setDemo(!!(t.demo || p.demo));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (category && t.category !== category) return false;
      if (q && !`${t.title} ${t.writerName || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, search, category]);

  const filteredPros = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pros.filter((p) => {
      if (category && !(p.specialties || []).includes(category)) return false;
      if (q && !`${p.name} ${p.bio || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pros, search, category]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      {demo && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-3 text-sm font-bold">
          <FlaskConical size={18} /> Mode test — aucun paiement réel n&apos;est effectué.
        </div>
      )}

      {/* Hero */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">Espace Freelance</p>
          <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">
            Des pros pour vos livres
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm max-w-xl">
            Publiez une mission, confiez-la à un professionnel vérifié et payez en toute sécurité :
            les fonds sont conservés en séquestre jusqu&apos;à validation du travail.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/marketplace/nouvelle"
            className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-teal-700 transition-all shadow"
          >
            <Plus size={18} /> Publier une mission
          </Link>
          <Link
            href="/marketplace/devenir-pro"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-800 px-6 py-3.5 rounded-2xl font-black hover:border-teal-500 hover:text-teal-700 transition-all"
          >
            Devenir pro
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <Briefcase className="text-teal-600" size={22} />
          </span>
          <div>
            <p className="text-3xl font-black text-slate-900">{loading ? "…" : tasks.length}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Missions ouvertes</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <Users className="text-teal-600" size={22} />
          </span>
          <div>
            <p className="text-3xl font-black text-slate-900">{loading ? "…" : pros.length}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pros inscrits</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${
              tab === t.key
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-500 border border-slate-200 hover:border-teal-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Recherche + filtre */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "missions" ? "Rechercher une mission…" : "Rechercher un professionnel…"}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="py-4 px-5 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium mt-4">Chargement…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold mb-8">
          {error}
        </div>
      )}

      {!loading && !error && tab === "missions" && (
        filteredTasks.length ? (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredTasks.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        ) : (
          <EmptyState
            title="Aucune mission trouvée"
            text="Soyez le premier à publier une mission et recevez des candidatures de professionnels."
            cta={{ href: "/marketplace/nouvelle", label: "Publier une mission" }}
          />
        )
      )}

      {!loading && !error && tab === "pros" && (
        filteredPros.length ? (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredPros.map((p) => <ProCard key={p.email} pro={p} />)}
          </div>
        ) : (
          <EmptyState
            title="Aucun professionnel trouvé"
            text="Inscrivez-vous comme professionnel et proposez vos services à la communauté."
            cta={{ href: "/marketplace/devenir-pro", label: "Devenir pro" }}
          />
        )
      )}
    </div>
  );
}

function EmptyState({ title, text, cta }) {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
      <h3 className="font-black text-xl text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm font-medium mb-6 max-w-md mx-auto">{text}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-teal-700 transition-all"
      >
        {cta.label} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
