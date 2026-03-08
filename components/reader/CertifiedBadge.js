"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Certification({ 
  wordCount, 
  fileName,     // ID du texte
  userEmail,    // Email du lecteur
  authorEmail,  // IMPORTANT: Email de l'auteur à qui envoyer les Li
  onValidated, 
  certifiedCount, 
  authorName, 
  textTitle 
}) {
  const waitTime = Math.max(8, Math.floor((wordCount || 50) / 15)); 
  const [seconds, setSeconds] = useState(waitTime);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const MIN_CERTIFICATIONS = 50;

  // Persistance locale pour éviter le double-sceau sur le même appareil
  useEffect(() => {
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) {
      setIsValidated(true);
      setProgress(100);
      setSeconds(0);
    }
  }, [fileName]);

  useEffect(() => {
    if (isValidated || seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds(s => {
        const next = s - 1;
        setProgress(((waitTime - next) / waitTime) * 100);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, isValidated, waitTime]);

  // --- LOGIQUE DE CERTIFICATION & TRANSFERT DE LI ---
  const validate = async () => {
    if (seconds > 0) return toast.info(`L'encre est encore fraîche. Patientez ${seconds}s.`);
    if (isValidated || isProcessing) return;
    
    setIsProcessing(true);
    const t = toast.loading("Application du sceau et transfert de mérite...");
    
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST', // On utilise POST pour l'API github-db générale
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "certify_content",
          textId: fileName,
          readerEmail: userEmail || "visiteur@lisible.biz",
          authorEmail: authorEmail, // C'est ici que l'API saura quel profil modifier
          textTitle: textTitle
        })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Sceau apposé ! +1 Li transféré à l'auteur.", { id: t });
        if (onValidated) onValidated(); 
      } else {
        throw new Error(data.error || "Indisponible");
      }
    } catch (e) { 
      toast.error("Échec de la liaison au Grand Livre.", { id: t }); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  // --- GÉNÉRATION DU PDF (Inchangée mais optimisée pour le titre) ---
  const generateCertificate = async () => {
    try {
      const { default: confetti } = await import("canvas-confetti");
      const { default: jsPDF } = await import("jspdf");
      
      confetti({ 
        particleCount: 200, spread: 90, origin: { y: 0.7 }, colors: ['#0d9488', '#f59e0b', '#1e293b'] 
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const dateActuelle = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      
      doc.setFillColor(252, 251, 249); 
      doc.rect(0, 0, 297, 210, "F");
      doc.setLineWidth(1.5); 
      doc.setDrawColor(13, 148, 136); 
      doc.rect(10, 10, 277, 190);

      doc.setTextColor(15, 23, 42); 
      doc.setFont("times", "bolditalic"); 
      doc.setFontSize(42);
      doc.text("Parchemin de Publication", 148.5, 55, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text((textTitle || "Sans Titre").toUpperCase(), 148.5, 100, { align: "center" });
      
      doc.setFontSize(14); 
      doc.setTextColor(80);
      doc.text(`Signé par ${authorName || "Anonyme"}`, 148.5, 120, { align: "center" });

      doc.save(`Certificat_${fileName}.pdf`);
    } catch (error) {
      toast.error("L'invocation du parchemin a échoué.");
    }
  };

  return (
    <div className="my-32 flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-1000">
      <div className="relative group">
        {/* Cercle de Progression */}
        <svg className="w-56 h-56 -rotate-90 drop-shadow-2xl">
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={628} strokeDashoffset={628 - (628 * progress) / 100}
            className={`transition-all duration-1000 ease-linear ${isValidated ? "text-teal-600" : "text-slate-900"}`}
            strokeLinecap="round"
          />
        </svg>

        {/* Bouton Central Interactif */}
        <div 
          onClick={validate} 
          className={`absolute inset-8 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-700 shadow-2xl ${
            isValidated 
            ? 'bg-teal-600 shadow-teal-600/30 rotate-[360deg]' 
            : 'bg-slate-950 shadow-slate-950/40 hover:scale-105 active:scale-95 group-hover:bg-slate-900'
          } ${isProcessing ? 'animate-pulse' : ''}`}
        >
          {isValidated ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <ShieldCheck size={64} className="text-white mb-1" />
              <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase">Scellé</span>
            </div>
          ) : (
            <div className="text-center text-white p-6">
              <span className="block text-3xl font-black italic tracking-tighter mb-1">LISIBLE</span>
              <div className="h-[1px] w-6 bg-white/30 mx-auto mb-2" />
              <span className="block text-[10px] font-black uppercase tracking-[0.4em] opacity-80">
                {seconds > 0 ? `${seconds}s` : "Sceller"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats et Téléchargement */}
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <Sparkles size={18} className="text-amber-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest leading-none">
              {Number(certifiedCount) || 0} Certifications
            </span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Mérite accumulé</span>
          </div>
        </div>

        <button 
          onClick={generateCertificate} 
          disabled={Number(certifiedCount) < MIN_CERTIFICATIONS}
          className={`flex items-center gap-3 px-10 py-6 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl ${
            Number(certifiedCount) >= MIN_CERTIFICATIONS 
            ? "bg-slate-950 text-white hover:bg-teal-600" 
            : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
          }`}
        >
          {Number(certifiedCount) >= MIN_CERTIFICATIONS ? <Download size={18} /> : <Lock size={18} />}
          {Number(certifiedCount) >= MIN_CERTIFICATIONS ? "Invoquer le Parchemin" : `Palier de ${MIN_CERTIFICATIONS} requis`}
        </button>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center max-w-[280px] leading-relaxed italic">
          Chaque sceau transfère 1 Li de la banque Lisible vers le compte de l'auteur.
        </p>
      </div>
    </div>
  );
}
