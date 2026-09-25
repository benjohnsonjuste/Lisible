"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wallet, Coins, History, Banknote, ShieldCheck, Loader2, CreditCard, ArrowLeft, Check, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

// Paiement automatique via boutons intelligents PayPal.
// methode "paypal" → bouton PayPal ; methode "carte" → bouton carte bancaire
// (sans compte PayPal requis). Le crédit des Li est instantané après capture.
function PaypalSmartCheckout({ pack, methode, paypalClientId, userEmail, onSuccess }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!paypalClientId) return;
    if (window.paypal) { setSdkReady(true); return; }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&components=buttons&enable-funding=card&locale=fr_CA`;
    s.onload = () => setSdkReady(true);
    s.onerror = () => toast.error("Paiement en ligne indisponible pour le moment.");
    document.body.appendChild(s);
  }, [paypalClientId]);

  const demarrer = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "paypal-creer-ordre", userEmail, packId: pack.id }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Paiement impossible.");
      setPaypalOrderId(j.paypalOrderId);
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!sdkReady || !paypalOrderId || !containerRef.current || !window.paypal) return;
    containerRef.current.innerHTML = "";
    const fundingSource = methode === "carte" ? window.paypal.FUNDING.CARD : window.paypal.FUNDING.PAYPAL;
    try {
      window.paypal.Buttons({
        fundingSource,
        style: { layout: "vertical", shape: "pill", label: "pay", height: 48 },
        createOrder: () => paypalOrderId,
        onApprove: async () => {
          setCapturing(true);
          try {
            const res = await fetch("/api/economie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "paypal-capturer", userEmail, paypalOrderId }),
            });
            const j = await res.json();
            if (!res.ok) return toast.error(j.error || "Paiement non confirmé.");
            toast.success(`Paiement accepté : +${Number(j.li || pack.li).toLocaleString("fr-FR")} Li crédités ! 🎉`);
            onSuccess(j.nouveauSolde);
          } catch {
            toast.error("Erreur réseau pendant la confirmation.");
          } finally {
            setCapturing(false);
          }
        },
        onError: () => toast.error("Le paiement a échoué, réessayez."),
        onCancel: () => toast.info("Paiement annulé."),
      }).render(containerRef.current);
    } catch {
      toast.error("Paiement indisponible pour le moment.");
    }
  }, [sdkReady, paypalOrderId]);

  if (capturing) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-3 text-teal-600" size={28} />
        <p className="text-sm font-bold text-slate-600">Confirmation du paiement, crédit de vos Li…</p>
      </div>
    );
  }

  if (!paypalOrderId) {
    return (
      <button onClick={demarrer} disabled={processing || !sdkReady}
        className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
        {processing || !sdkReady ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
        {processing ? "Préparation..." : !sdkReady ? "Chargement du paiement..." : `Payer ${pack.prixUsd.toFixed(2)} $ US`}
      </button>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-bold text-slate-500 text-center mb-3">
        {methode === "carte" ? "Payez par carte bancaire (sans compte PayPal) :" : "Finalisez avec votre compte PayPal :"}
      </p>
      <div ref={containerRef} className="min-h-[60px]" />
    </div>
  );
}

const TABS = [
  { id: "acheter", label: "Acheter des Li", icon: Coins },
  { id: "historique", label: "Historique", icon: History },
  { id: "retraits", label: "Mes gains", icon: Banknote },
];

export default function PortefeuillePage() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [paypalClientId, setPaypalClientId] = useState(null);
  const [tab, setTab] = useState("acheter");
  const [solde, setSolde] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [packSel, setPackSel] = useState(null);
  const [methode, setMethode] = useState("interac");
  const [order, setOrder] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [creating, setCreating] = useState(false);
  const [kycForm, setKycForm] = useState({ nom: "", prenom: "", dateNaissance: "", pays: "Canada", pieceType: "Passeport", pieceNumero: "", moyenPaiement: "PayPal", coordonnees: "" });
  const [kycSending, setKycSending] = useState(false);
  const [montantRetrait, setMontantRetrait] = useState("");
  const [retraitSending, setRetraitSending] = useState(false);

  useEffect(() => {
    try {
      const logged = localStorage.getItem("lisible_user");
      if (logged) {
        const u = JSON.parse(logged);
        setUser(u);
        setKycForm((f) => ({ ...f, nom: u.name || "" }));
      }
    } catch {}
    fetch("/api/economie?action=config", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (j.success) { setConfig(j.config); if (j.paypalClientId) setPaypalClientId(j.paypalClientId); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/economie?action=solde&userEmail=${encodeURIComponent(user.email)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setSolde(j.solde))
      .catch(() => {});
    fetch(`/api/economie?action=historique&userEmail=${encodeURIComponent(user.email)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setHistorique(j.historique))
      .catch(() => {});
  }, [user?.email]);

  const refreshSolde = () => {
    if (!user?.email) return;
    fetch(`/api/economie?action=solde&userEmail=${encodeURIComponent(user.email)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setSolde(j.solde))
      .catch(() => {});
  };

  const creerCommande = async () => {
    if (!packSel || !user) return;
    setCreating(true);
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "creer-commande", userEmail: user.email, packId: packSel.id, methode }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Commande impossible.");
      setOrder(j.commande);
      setInstructions(j.instructions || null);
      toast.success("Commande créée !");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setCreating(false);
    }
  };

  const soumettreKyc = async (e) => {
    e.preventDefault();
    setKycSending(true);
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kyc-soumettre", userEmail: user.email, ...kycForm }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Envoi impossible.");
      toast.success("Dossier envoyé ! Vérification sous 48 h.");
      refreshSolde();
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setKycSending(false);
    }
  };

  const demanderRetrait = async (e) => {
    e.preventDefault();
    setRetraitSending(true);
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demande-retrait", userEmail: user.email, montantLi: montantRetrait, moyen: kycForm.moyenPaiement, coordonnees: kycForm.coordonnees }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Demande impossible.");
      toast.success(`Retrait de ${Number(j.retrait.montantLi).toLocaleString("fr-FR")} Li demandé !`);
      setMontantRetrait("");
      refreshSolde();
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setRetraitSending(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <Wallet size={40} className="mx-auto mb-4 text-teal-600" />
          <h1 className="text-2xl font-black mb-2">Votre portefeuille</h1>
          <p className="text-sm text-slate-500 mb-6">Connectez-vous pour gérer vos Li.</p>
          <Link href="/login" className="px-8 py-3.5 rounded-2xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest">Se connecter</Link>
        </div>
      </main>
    );
  }

  const kyc = solde?.kyc || { statut: "non_verifie" };
  const paiements = config?.paiements || {};

  return (
    <main className="min-h-screen bg-[#fafafa] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
          <ArrowLeft size={14} /> Accueil
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-teal-600 rounded-[1.5rem] text-white shadow-lg shadow-teal-600/30"><Wallet size={28} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tight">Portefeuille</h1>
            <p className="text-xs text-slate-500 font-bold">1 Li = 0,01 $ US, partout sur Lisible</p>
          </div>
        </div>

        {/* Soldes */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-950 text-white rounded-[1.75rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mes Li</p>
            <p className="text-3xl font-black text-teal-300">{(solde?.li ?? user.li ?? 0).toLocaleString("fr-FR")}</p>
            <p className="text-[10px] text-slate-500 mt-1">pour offrir des cadeaux</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-[1.75rem] p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mes gains</p>
            <p className="text-3xl font-black text-amber-600">{(solde?.gainsLi ?? 0).toLocaleString("fr-FR")}</p>
            <p className="text-[10px] text-slate-500 mt-1">reçus des lecteurs • 85 %</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[110px] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === t.id ? "bg-slate-950 text-white" : "text-slate-500"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ===== ACHETER ===== */}
        {tab === "acheter" && config && (
          <div>
            {!order ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {config.packs.map((p) => (
                    <button key={p.id} onClick={() => setPackSel(p)}
                      className={`rounded-[1.75rem] border-2 p-6 text-left transition-all ${packSel?.id === p.id ? "border-teal-500 bg-teal-50/50 shadow-lg" : "border-slate-100 bg-white hover:border-teal-200"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black">{p.nom}</span>
                        {packSel?.id === p.id && <Check size={18} className="text-teal-600" />}
                      </div>
                      <p className="text-2xl font-black text-teal-700">{p.li.toLocaleString("fr-FR")} <span className="text-sm">Li</span></p>
                      <p className="text-sm font-bold text-slate-500">{p.prixUsd.toFixed(2)} $ US</p>
                    </button>
                  ))}
                </div>

                {packSel && (
                  <div className="bg-white border border-slate-100 rounded-[1.75rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Moyen de paiement</p>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {Object.entries(paiements).map(([key, pm]) => (
                        <button key={key} disabled={!pm.actif} onClick={() => setMethode(key)}
                          className={`rounded-2xl border-2 p-4 text-center transition-all ${!pm.actif ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50" : methode === key ? "border-teal-500 bg-teal-50/50" : "border-slate-100 bg-white hover:border-teal-200"}`}>
                          <CreditCard size={20} className="mx-auto mb-1.5 text-slate-600" />
                          <p className="text-xs font-black">{pm.label}</p>
                          {!pm.actif && <p className="text-[9px] text-slate-400 mt-1">Bientôt</p>}
                        </button>
                      ))}
                    </div>
                    {(methode === "paypal" || methode === "carte") ? (
                      paypalClientId ? (
                        <PaypalSmartCheckout
                          key={packSel.id + methode}
                          pack={packSel}
                          methode={methode}
                          paypalClientId={paypalClientId}
                          userEmail={user.email}
                          onSuccess={() => { setPackSel(null); setMethode("interac"); refreshSolde(); }}
                        />
                      ) : (
                        <p className="text-center text-xs font-bold text-amber-600 py-4">Activation du paiement en ligne en cours…</p>
                      )
                    ) : (
                      <>
                        <button onClick={creerCommande} disabled={creating}
                          className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                          {creating ? <Loader2 className="animate-spin" size={16} /> : <Coins size={16} />}
                          {creating ? "Création..." : `Acheter ${packSel.li.toLocaleString("fr-FR")} Li — ${packSel.prixUsd.toFixed(2)} $ US`}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center mt-3">Paiement unique • les frais bancaires sont groupés • Li non remboursables (<Link href="/terms" className="underline">CGU</Link>)</p>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-100 rounded-[1.75rem] p-8 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4"><Check size={28} /></div>
                <h3 className="font-black text-lg mb-1">Commande {order.id}</h3>
                <p className="text-sm text-slate-500 mb-6">{order.li.toLocaleString("fr-FR")} Li • {order.prixUsd.toFixed(2)} $ US</p>
                {instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-6">
                    <p className="font-black text-sm text-amber-800 mb-3">{instructions.titre}</p>
                    {instructions.lignes.map((l, i) => (
                      <p key={i} className="text-xs text-amber-900 font-bold mb-1.5 flex items-start gap-2">
                        {i === 1 && <button onClick={() => { navigator.clipboard.writeText(l); toast.success("Copié !"); }} className="shrink-0 mt-0.5"><Copy size={12} /></button>}
                        <span className={i === 1 ? "font-black text-sm break-all" : ""}>{l}</span>
                      </p>
                    ))}
                  </div>
                )}
                <button onClick={() => { setOrder(null); setInstructions(null); setPackSel(null); }} className="text-[11px] font-black uppercase tracking-widest text-slate-400 underline">
                  Faire une autre commande
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== HISTORIQUE ===== */}
        {tab === "historique" && (
          <div className="bg-white border border-slate-100 rounded-[1.75rem] p-6 shadow-sm">
            {historique.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Aucune transaction pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {historique.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">
                        {h.type === "cadeau" && `🎁 ${h.cadeauNom} ${h.de === user.email.toLowerCase() ? `→ ${h.versNom}` : `← ${h.deNom}`}`}
                        {h.type === "achat" && `💰 Achat ${h.li.toLocaleString("fr-FR")} Li`}
                        {h.type === "retrait_demande" && `📤 Retrait demandé`}
                        {h.type === "retrait_paye" && `✅ Retrait payé`}
                      </p>
                      <p className="text-[10px] text-slate-400">{new Date(h.date).toLocaleString("fr-FR")}</p>
                    </div>
                    <p className={`text-sm font-black shrink-0 ${h.vers === user.email.toLowerCase() ? "text-teal-600" : "text-slate-700"}`}>
                      {h.vers === user.email.toLowerCase() ? "+" : "−"}{Number(h.li).toLocaleString("fr-FR")} Li
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== RETRAITS / GAINS ===== */}
        {tab === "retraits" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-[1.75rem] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={18} className={kyc.statut === "verifie" ? "text-teal-600" : "text-amber-500"} />
                <h3 className="font-black">Vérification d'identité (KYC)</h3>
              </div>
              {kyc.statut === "verifie" ? (
                <p className="text-sm text-teal-700 font-bold bg-teal-50 rounded-2xl p-4">✅ Identité vérifiée — vous pouvez demander des retraits.</p>
              ) : kyc.statut === "en_attente" ? (
                <p className="text-sm text-amber-700 font-bold bg-amber-50 rounded-2xl p-4">⏳ Dossier en cours de vérification (sous 48 h).</p>
              ) : (
                <form onSubmit={soumettreKyc} className="grid sm:grid-cols-2 gap-3">
                  <input required placeholder="Prénom" value={kycForm.prenom} onChange={(e) => setKycForm({ ...kycForm, prenom: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500/30" />
                  <input required placeholder="Nom" value={kycForm.nom} onChange={(e) => setKycForm({ ...kycForm, nom: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500/30" />
                  <input required type="date" value={kycForm.dateNaissance} onChange={(e) => setKycForm({ ...kycForm, dateNaissance: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500/30" />
                  <input required placeholder="Pays" value={kycForm.pays} onChange={(e) => setKycForm({ ...kycForm, pays: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500/30" />
                  <select value={kycForm.pieceType} onChange={(e) => setKycForm({ ...kycForm, pieceType: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                    <option>Passeport</option><option>Permis de conduire</option><option>Carte d'identité</option>
                  </select>
                  <input required placeholder="N° de pièce" value={kycForm.pieceNumero} onChange={(e) => setKycForm({ ...kycForm, pieceNumero: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500/30" />
                  <select value={kycForm.moyenPaiement} onChange={(e) => setKycForm({ ...kycForm, moyenPaiement: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                    {(config?.moyensRetrait || ["PayPal"]).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input required placeholder={
                    kycForm.moyenPaiement === "PayPal" ? "Courriel PayPal" :
                    kycForm.moyenPaiement === "Interac" ? "Courriel Interac" :
                    (kycForm.moyenPaiement === "MonCash" || kycForm.moyenPaiement === "NatCash") ? "Numéro de téléphone" :
                    kycForm.moyenPaiement === "Virement bancaire" ? "IBAN / coordonnées bancaires" :
                    "Nom complet + pays"
                  } value={kycForm.coordonnees} onChange={(e) => setKycForm({ ...kycForm, coordonnees: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500/30" />
                  <button disabled={kycSending} className="sm:col-span-2 py-4 rounded-2xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                    {kycSending ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                    {kycSending ? "Envoi..." : "Soumettre ma vérification"}
                  </button>
                  {kyc.statut === "refuse" && <p className="sm:col-span-2 text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12} /> Dossier refusé — vérifiez vos informations et renvoyez.</p>}
                </form>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-[1.75rem] p-6 shadow-sm">
              <h3 className="font-black mb-1">Demander un retrait</h3>
              <p className="text-[11px] text-slate-500 mb-4">
                Minimum {config ? config.seuilRetraitLi.toLocaleString("fr-FR") : "25 000"} Li • Réserve chargeback de {config?.reserveChargebackPct || 5} % • Frais bancaires déduits de votre part
              </p>
              <form onSubmit={demanderRetrait} className="flex gap-3">
                <input required type="number" min={config?.seuilRetraitLi || 25000} max={solde?.gainsLi || 0} placeholder="Montant en Li"
                  value={montantRetrait} onChange={(e) => setMontantRetrait(e.target.value)}
                  className="flex-1 bg-slate-50 rounded-2xl px-4 py-3.5 text-lg font-black outline-none focus:ring-2 ring-teal-500/30" />
                <button disabled={retraitSending || kyc.statut !== "verifie"} className="px-8 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center gap-2">
                  {retraitSending ? <Loader2 className="animate-spin" size={16} /> : <Banknote size={16} />} Retirer
                </button>
              </form>
              {kyc.statut !== "verifie" && <p className="text-[11px] text-amber-600 font-bold mt-2">Vérifiez d'abord votre identité ci-dessus.</p>}
              {montantRetrait && (
                <p className="text-[11px] text-slate-500 mt-2">
                  Vous recevrez ≈ {(Number(montantRetrait) * (1 - (config?.reserveChargebackPct || 5) / 100) * (config?.tauxUsdParLi || 0.01)).toFixed(2)} $ US
                  (réserve de {config?.reserveChargebackPct || 5} % déduite, libérée après 60 jours sans litige).
                </p>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400 mt-8 leading-relaxed">
          Les Li sont des jetons d'usage internes, ni remboursables ni échangeables entre lecteurs.<br />
          1 Li = 0,01 $ US sur toute la plateforme. <Link href="/terms" className="underline">CGU — Monnaie Li</Link>
        </p>
      </div>
    </main>
  );
}
