"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, FlaskConical } from "lucide-react";
import { apiPost } from "@/components/freelance/api";

function RetourContent() {
  const params = useSearchParams();
  const taskId = params.get("taskId");
  const token = params.get("token");
  const demo = params.get("demo") === "1";

  const [state, setState] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!taskId) {
      setState("error");
      setMessage("Mission introuvable : paramètre manquant.");
      return;
    }
    let cancelled = false;
    async function capture() {
      try {
        await apiPost("capture_payment", { taskId, orderId: token || `DEMO-ORDER-${taskId}` });
        if (!cancelled) setState("success");
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setMessage(e.message);
        }
      }
    }
    capture();
    return () => { cancelled = true; };
  }, [taskId, token]);

  return (
    <div className="max-w-xl mx-auto px-6 py-16 min-h-screen bg-[#FCFBF9]">
      <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm text-center">
        {state === "loading" && (
          <>
            <div className="inline-block w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
            <h1 className="text-2xl font-black text-slate-900 mb-2">Confirmation du paiement…</h1>
            <p className="text-slate-500 font-medium text-sm">Veuillez patienter, nous vérifions votre paiement.</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 size={64} className="text-teal-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-slate-900 mb-2">Paiement confirmé</h1>
            <p className="text-slate-500 font-medium text-sm mb-2">
              Mission publiée. Le montant est conservé en séquestre jusqu&apos;à votre validation.
            </p>
            {demo && (
              <p className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-4">
                <FlaskConical size={14} /> Mode test — aucun argent réel
              </p>
            )}
            <Link
              href={`/marketplace/missions/${taskId}`}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-teal-700 transition-all mt-4"
            >
              Voir ma mission <ArrowRight size={16} />
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-slate-900 mb-2">Paiement non confirmé</h1>
            <p className="text-red-600 font-medium text-sm mb-6">{message}</p>
            <Link
              href="/marketplace/nouvelle"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all"
            >
              Recommencer
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function RetourPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium mt-4">Chargement…</p>
        </div>
      }
    >
      <RetourContent />
    </Suspense>
  );
}
