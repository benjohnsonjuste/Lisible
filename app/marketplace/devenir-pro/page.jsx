"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { apiGet, apiPost, getSessionToken, getSessionUser, CATEGORIES } from "@/components/freelance/api";

export default function DevenirProPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState(null);
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [languages, setLanguages] = useState("");
  const [priceHint, setPriceHint] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [cgu, setCgu] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      router.push("/login");
      return;
    }
    async function check() {
      try {
        const dash = await apiGet("dashboard", { sessionToken: token });
        const p = dash.proProfile;
        if (p) {
          setExisting(p);
          setBio(p.bio || "");
          setSpecialties(p.specialties || []);
          setLanguages((p.languages || []).join(", "));
          setPriceHint(p.priceHint != null ? String(p.priceHint) : "");
          setPaypalEmail(p.paypalEmail || "");
          setPortfolio((p.portfolio || []).join("\n"));
          setCgu(true);
        } else {
          const u = getSessionUser();
          if (u?.email) setPaypalEmail(u.email);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  function toggleSpecialty(c) {
    setSpecialties((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!bio.trim()) return setError("Veuillez rédiger une courte présentation.");
    if (!specialties.length) return setError("Veuillez choisir au moins une spécialité.");
    if (!paypalEmail.trim()) return setError("Veuillez saisir votre adresse e-mail PayPal.");
    if (!cgu) return setError("Veuillez accepter les conditions générales pour continuer.");
    setSaving(true);
    try {
      const payload = {
        bio: bio.trim(),
        specialties,
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        priceHint: priceHint ? parseFloat(priceHint) : null,
        paypalEmail: paypalEmail.trim(),
        portfolio: portfolio.split("\n").map((s) => s.trim()).filter(Boolean),
        cguAccepted: true,
      };
      if (existing) {
        await apiPost("update_pro_profile", payload);
      } else {
        await apiPost("create_pro_profile", payload);
      }
      router.push("/marketplace/tableau-de-bord");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center min-h-screen bg-[#FCFBF9]">
        <div className="inline-block w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium mt-4">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">Espace Freelance</p>
      <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
        {existing ? "Modifier mon profil pro" : "Devenir professionnel"}
      </h1>
      <p className="text-slate-500 font-medium text-sm mb-8">
        Proposez vos services aux écrivains de la communauté et recevez vos paiements via PayPal.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold">
            {error}
          </div>
        )}

        <Field label="Présentation *">
          <textarea
            value={bio} onChange={(e) => setBio(e.target.value)} rows={5}
            placeholder="Parlez de votre expérience, de votre parcours et de ce que vous proposez…"
            className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
          />
        </Field>

        <Field label="Spécialités *">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c} type="button" onClick={() => toggleSpecialty(c)}
                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                  specialties.includes(c)
                    ? "bg-teal-600 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Langues (séparées par des virgules)">
            <input
              type="text" value={languages} onChange={(e) => setLanguages(e.target.value)}
              placeholder="Français, Anglais…"
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
            />
          </Field>
          <Field label="Tarif indicatif ($CA)">
            <input
              type="number" min="0" step="0.01" value={priceHint} onChange={(e) => setPriceHint(e.target.value)}
              placeholder="Ex. : 50"
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
            />
          </Field>
        </div>

        <Field label="Adresse e-mail PayPal (pour vos paiements) *">
          <input
            type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
          />
        </Field>

        <Field label="Portfolio (un URL par ligne)">
          <textarea
            value={portfolio} onChange={(e) => setPortfolio(e.target.value)} rows={3}
            placeholder={"https://mon-portfolio.com\nhttps://autre-exemple.com"}
            className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
          />
        </Field>

        <label className="flex items-start gap-3 cursor-pointer bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} className="mt-1 w-5 h-5 accent-teal-600" />
          <span className="text-sm font-medium text-slate-700">
            J&apos;accepte les conditions générales de l&apos;Espace Freelance *
          </span>
        </label>

        <button
          type="submit" disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-teal-700 transition-all disabled:opacity-50 shadow"
        >
          <CheckCircle2 size={18} /> {saving ? "Enregistrement…" : existing ? "Enregistrer mes modifications" : "Créer mon profil pro"}
        </button>
      </form>
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
