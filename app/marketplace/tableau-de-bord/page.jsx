"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Wallet, Hourglass } from "lucide-react";
import { apiGet, getSessionToken, formatDateFR } from "@/components/freelance/api";
import StatusBadge from "@/components/freelance/StatusBadge";
import Money from "@/components/freelance/Money";

export default function TableauDeBordPage() {
  const router = useRouter();
  const [tab, setTab] = useState("writer");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        const j = await apiGet("dashboard", { sessionToken: token });
        setData(j);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center min-h-screen bg-[#FCFBF9]">
        <div className="inline-block w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium mt-4">Chargement du tableau de bord…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 min-h-screen bg-[#FCFBF9]">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold">{error}</div>
      </div>
    );
  }

  const writerTasks = data?.writerTasks || [];
  const proTasks = data?.proTasks || [];
  const payouts = data?.pendingPayouts || { count: 0, amount: 0 };
  const hasProProfile = !!data?.proProfile;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">Espace Freelance</p>
      <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-8">Mon tableau de bord</h1>

      {/* Gains */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <Hourglass className="text-teal-600" size={22} />
          </span>
          <div>
            <p className="text-3xl font-black text-slate-900">{payouts.count}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paiements en attente</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <Wallet className="text-teal-600" size={22} />
          </span>
          <div>
            <p className="text-3xl font-black text-teal-700"><Money amount={payouts.amount} /></p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Gains à venir</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "writer", label: "Écrivain" },
          { key: "pro", label: "Pro" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${
              tab === t.key ? "bg-slate-900 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:border-teal-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "writer" && (
        <>
          <div className="mb-6">
            <Link
              href="/marketplace/nouvelle"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-teal-700 transition-all"
            >
              Publier une nouvelle mission <ArrowRight size={16} />
            </Link>
          </div>
          {writerTasks.length === 0 ? (
            <EmptyBox text="Vous n'avez publié aucune mission pour le moment." />
          ) : (
            <div className="space-y-4">
              {writerTasks.map((t) => <TaskRow key={t.id} task={t} counterpart={t.proName} counterpartLabel="Pro" />)}
            </div>
          )}
        </>
      )}

      {tab === "pro" && (
        !hasProProfile ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <h3 className="font-black text-xl text-slate-900 mb-2">Vous n&apos;êtes pas encore pro</h3>
            <p className="text-slate-500 text-sm font-medium mb-6 max-w-md mx-auto">
              Créez votre profil professionnel pour accepter des missions et être payé.
            </p>
            <Link
              href="/marketplace/devenir-pro"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-teal-700 transition-all"
            >
              Devenir pro <ArrowRight size={16} />
            </Link>
          </div>
        ) : proTasks.length === 0 ? (
          <EmptyBox text="Vous n'avez accepté aucune mission pour le moment." />
        ) : (
          <div className="space-y-4">
            {proTasks.map((t) => <TaskRow key={t.id} task={t} counterpart={t.writerName} counterpartLabel="Écrivain" />)}
          </div>
        )
      )}
    </div>
  );
}

function TaskRow({ task, counterpart, counterpartLabel }) {
  return (
    <Link
      href={`/marketplace/missions/${task.id}`}
      className="block bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <StatusBadge status={task.status} />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{task.category}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{task.title}</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {counterpartLabel} : {counterpart || "—"}
            {task.deadline && <> · Échéance : {formatDateFR(task.deadline)}</>}
          </p>
        </div>
        <Money amount={task.budget} currency={task.currency || "CAD"} className="font-black text-teal-700 text-xl" />
      </div>
    </Link>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="text-center py-14 bg-white rounded-3xl border border-slate-100">
      <p className="text-slate-400 italic font-medium">{text}</p>
    </div>
  );
}
