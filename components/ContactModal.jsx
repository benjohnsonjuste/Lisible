"use client";
import { useState } from "react";
import { X, Send, Loader2, CheckCircle, MessageSquare, Mic2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ContactModal({ isOpen, onClose, userEmail, userName }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Liste blanche de l'administration
  const adminEmails = [
    "cmo.lablitteraire7@gmail.com",
    "benjohnsonjuste@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhainiedarha@gmail.com"
  ];

  const hasFullAccess = adminEmails.includes(userEmail);

  const contactSubjects = [
    { label: "Demande d'accréditation Bronze", restricted: false },
    { label: "Difficultés lié à l'enregistrement", restricted: true },
    { label: "Suggestion d'amélioration", restricted: true },
    { label: "Requête spéciale pour la promotion", restricted: true },
    { label: "Autre", restricted: false }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) return toast.error("Veuillez choisir un objet.");
    if (message.length < 10) return toast.error("Votre message est trop court.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactData: {
            senderName: userName || "Auteur Lisible",
            senderEmail: userEmail,
            subject,
            message,
            context: "Studio Podcast",
            date: new Date().toLocaleString("fr-FR")
          }
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            setIsSuccess(false);
            setSubject("");
            setMessage("");
          }, 500);
        }, 3000);
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (error) {
      console.error("Contact error:", error);
      toast.error("Impossible d'envoyer le message pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="bg-rose-600 p-2 rounded-xl text-white">
                <Mic2 size={20} />
            </div>
            <div>
                <h3 className="font-black text-lg tracking-tighter italic">Assistance <span className="text-rose-600">Studio.</span></h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Lisible Support Team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Quel est l'objet de votre message ?</label>
                <div className="grid grid-cols-1 gap-2">
                  {contactSubjects.map((s) => {
                    const isDisabled = s.restricted && !hasFullAccess;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSubject(s.label)}
                        className={`group text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all border flex items-center justify-between ${
                          isDisabled 
                          ? "bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed opacity-60" 
                          : subject === s.label 
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg translate-x-1" 
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:border-rose-200"
                        }`}
                      >
                        <span>{s.label}</span>
                        {isDisabled && <Lock size={12} className="text-slate-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Votre message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre besoin avec précision..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none min-h-[120px] resize-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !subject || !message}
                className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl hover:bg-slate-900 shadow-lg shadow-rose-200 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Envoyer à Lisible Support Team</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="py-10 text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h4 className="font-black text-xl text-slate-900 mb-2">Message Envoyé</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Votre demande a été transmise à l'équipe <span className="text-rose-600 font-bold italic">Lisible</span>. <br /> 
                Nous vous répondrons par e-mail sous peu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
