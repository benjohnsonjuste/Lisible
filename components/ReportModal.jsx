"use client";
import { useState } from "react";
import { X, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReportModal({ isOpen, onClose, textId, textTitle, userEmail }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reportReasons = [
    "Plagiat ou violation de droits d'auteur",
    "Contenu haineux ou harcèlement",
    "Contenu inapproprié ou sexuel",
    "Spam ou publicité déguisée",
    "Autre"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error("Veuillez choisir un motif.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textId,
          reporterEmail: userEmail || "Anonyme",
          reason,
          details
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setReason("");
          setDetails("");
        }, 3000);
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du signalement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle size={24} />
            <h3 className="font-black text-lg">Signaler un contenu</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-slate-500 italic">
                Vous signalez le texte : <span className="font-bold text-slate-800">"{textTitle}"</span>
              </p>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Motif du signalement</label>
                <div className="grid gap-2">
                  {reportReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all border ${
                        reason === r 
                        ? "bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]" 
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:border-rose-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Détails (Optionnel)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Expliquez-nous brièvement le problème..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !reason}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "ENVOYER LE SIGNALEMENT"}
              </button>
            </form>
          ) : (
            <div className="py-10 text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h4 className="font-black text-xl text-slate-900 mb-2">Merci pour votre vigilance</h4>
              <p className="text-slate-500 text-sm">
                Notre équipe de modération va examiner <br /> ce texte dans les plus brefs délais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
