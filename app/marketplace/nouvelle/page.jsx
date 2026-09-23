"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";
import { apiPost, getSessionToken, CATEGORIES } from "@/components/freelance/api";
import { formatMontant } from "@/components/freelance/Money";
import { formatDateFR } from "@/components/freelance/api";

const STEPS = ["Mission", "Budget", "Paiement"];

export default function NouvelleMissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [briefLink, setBriefLink] = useState("");
  const [budget, setBudget] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [cgu, setCgu] = useState(false);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  const budgetNum = parseFloat(budget);
  const budgetValid = Number.isFinite(budgetNum) && budgetNum >= 10;
  const proAmount = budgetValid ? budgetNum * 0.85 : 0;
  const fee = budgetValid ? budgetNum * 0.15 : 0;

  function next() {
    setError(null);
    if (step === 0) {
      if (!title.trim()) return setError("Veuillez saisir un titre pour votre mission.");
      if (!description.trim()) return setError("Veuillez décrire votre mission.");
      setStep(1);
    } else if (step === 1) {
      if (!budgetValid) return setError("Le budget minimum est de 10 $CA.");
      if (!cgu) return setError("Veuillez accepter les conditions générales pour continuer.");
      setStep(2);
    }
  }

  async function handlePay() {
    if (!getSessionToken()) {
      router.push("/login");
      return;
    }
    setError(null);
    setPaying(true);
    try {
      const created = await apiPost("create_task", {
        title: title.trim(),
        category,
        description: description.trim(),
        ...(wordCount ? { wordCount: parseInt(wordCount, 10) } : {}),
        ...(briefLink.trim() ? { briefLink: briefLink.trim() } : {}),
        budget: budgetNum,
        ...(desiredDate ? { desiredDate } : {}),
        cguAccepted: true,
      });
      const order = await apiPost("create_paypal_order", { taskId: created.taskId });
      if (order.demo) {
        // Mode test : approveUrl interne, on informe avant de rediriger
      }
      window.location.href = order.approveUrl;
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">Espace Freelance</p>
      <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-8">Publier une mission</h1>

      {/* Étapes */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                i <= step ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm font-bold ${i <= step ? "text-slate-900" : "text-slate-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="flex-1 h-0.5 bg-slate-200 rounded mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold mb-6">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <Field label="Titre de la mission *">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. : Relecture de mon roman (80 000 mots)"
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              />
            </Field>
            <Field label="Catégorie *">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description *">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Décrivez précisément le travail attendu, le style, les délais…"
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Nombre de mots (optionnel)">
                <input
                  type="number"
                  min="0"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  placeholder="Ex. : 80000"
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                />
              </Field>
              <Field label="Lien du brief (optionnel)">
                <input
                  type="url"
                  value={briefLink}
                  onChange={(e) => setBriefLink(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Budget ($CA) *">
              <input
                type="number"
                min="10"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Minimum 10 $CA"
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-lg"
              />
            </Field>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-2">Décomposition du budget</p>
              {budgetValid ? (
                <p className="text-slate-800 font-medium">
                  {formatMontant(budgetNum)} →{" "}
                  <span className="font-black text-teal-700">{formatMontant(proAmount)}</span> au professionnel
                  {" · "}
                  <span className="font-black">{formatMontant(fee)}</span> commission Lisible
                </p>
              ) : (
                <p className="text-slate-500 text-sm italic">Saisissez un budget pour voir la décomposition.</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Le montant est conservé en séquestre et versé au professionnel uniquement après validation de votre part.
              </p>
            </div>
            <Field label="Date de remise souhaitée (optionnel)">
              <input
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              />
            </Field>
            <label className="flex items-start gap-3 cursor-pointer bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <input
                type="checkbox"
                checked={cgu}
                onChange={(e) => setCgu(e.target.checked)}
                className="mt-1 w-5 h-5 accent-teal-600"
              />
              <span className="text-sm font-medium text-slate-700">
                J&apos;accepte les conditions générales de l&apos;Espace Freelance *
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-bold text-amber-800">
              <FlaskConical size={18} /> Mode test — aucun argent réel ne sera débité.
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Récapitulatif</p>
              <Row label="Titre" value={title} />
              <Row label="Catégorie" value={category} />
              <Row label="Description" value={description} />
              {wordCount && <Row label="Nombre de mots" value={wordCount} />}
              {briefLink && <Row label="Lien du brief" value={briefLink} />}
              {desiredDate && <Row label="Date souhaitée" value={formatDateFR(desiredDate)} />}
              <Row label="Budget" value={formatMontant(budgetNum)} strong />
              <Row label="Au professionnel" value={formatMontant(proAmount)} strong />
              <Row label="Commission Lisible" value={formatMontant(fee)} />
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-teal-700 transition-all disabled:opacity-50 shadow"
            >
              {paying ? "Redirection vers PayPal…" : "Payer avec PayPal"}
            </button>
            <p className="text-xs text-slate-400 text-center">
              Vous serez redirigé vers PayPal pour sécuriser le montant en séquestre.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => { setError(null); setStep(step - 1); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm bg-white border border-slate-200 text-slate-600 hover:border-teal-500"
            >
              <ArrowLeft size={16} /> Retour
            </button>
          ) : <span />}
          {step < 2 && (
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm bg-slate-900 text-white hover:bg-slate-800"
            >
              Continuer <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`text-slate-900 text-right ${strong ? "font-black" : "font-medium"}`}>{value}</span>
    </div>
  );
}
