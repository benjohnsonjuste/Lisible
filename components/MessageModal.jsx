"use client";
import { useState } from "react";
import { X, Send, Loader2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export default function MessageModal({ isOpen, onClose, sender, recipient }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (message.length < 5) return toast.error("Message trop court.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportData: {
            textId: "DM", 
            textTitle: sender.name || sender.fullName, // Nom de l'expéditeur
            reporterEmail: sender.email,               // Email de l'expéditeur
            targetEmail: recipient.email,             // Email du destinataire (utilisé par l'API)
            reason: "DIRECT_MESSAGE",
            details: message,
            date: new Date().toLocaleString("fr-FR")
          }
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => { onClose(); setIsSuccess(false); setMessage(""); }, 2500);
      }
    } catch (error) {
      toast.error("Erreur d'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
        {!isSuccess ? (
          <form onSubmit={handleSend} className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                 <Mail size={24} />
               </div>
               <div>
                 <h3 className="font-black italic text-xl">Envoyer un <span className="text-blue-600">message.</span></h3>
                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">À : {recipient.name}</p>
               </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Écrivez à ${recipient.name}...`}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px] resize-none transition-all"
            />

            <button
              type="submit"
              disabled={isSubmitting || !message}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /><span>Envoyer le message</span></>}
            </button>
          </form>
        ) : (
          <div className="py-10 text-center">
            <CheckCircle size={60} className="mx-auto text-emerald-500 mb-4" />
            <h4 className="font-black text-xl">Message transmis !</h4>
            <p className="text-slate-400 text-sm mt-2">{recipient.name} recevra une notification par e-mail.</p>
          </div>
        )}
      </div>
    </div>
  );
}
