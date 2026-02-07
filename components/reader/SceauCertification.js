"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SceauCertification({ 
  wordCount, 
  fileName, 
  userEmail, 
  onValidated, 
  certifiedCount, 
  authorName, 
  textTitle 
}) {
  // Calcul dynamique du temps d'attente basé sur la longueur du texte
  const waitTime = Math.max(8, Math.floor((wordCount || 50) / 10)); // Ajusté pour être plus réaliste
  const [seconds, setSeconds] = useState(waitTime);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérification de l'état de certification local
  useEffect(() => {
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) {
      setIsValidated(true);
      setProgress(100);
      setSeconds(0);
    }
  }, [fileName]);

  // Logique du chronomètre de lecture
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

  // Génération du certificat PDF (Côté Client)
  const generateCertificate = async () => {
    try {
      const { default: confetti } = await import("canvas-confetti");
      const { default: jsPDF } = await import("jspdf");
      
      confetti({ 
        particleCount: 150, 
        spread: 70, 
        origin: { y: 0.6 }, 
        colors: ['#0d9488', '#1e293b', '#ffffff'] 
      });

      const doc = new jsPDF({ 
        orientation: "landscape", 
        unit: "mm", 
        format: "a4" 
      });
      
      // Design du certificat "Sanctuaire"
      doc.setFillColor(253, 251, 247); 
      doc.rect(0, 0, 297, 210, "F");
      doc.setLineWidth(2); 
      doc.setDrawColor(13, 148, 136); 
      doc.rect(10, 10, 277, 190);
      
      doc.setTextColor(15, 23, 42); 
      doc.setFont("times", "bold"); 
      doc.setFontSize(40);
      doc.text("CERTIFICAT DE PUBLICATION", 148.5, 60, { align: "center" });
      
      doc.setFontSize(16); 
      doc.text("La plateforme LISIBLE certifie que l'œuvre intitulée", 148.5, 85, { align: "center" });
      
      doc.setFont("times", "italic"); 
      doc.setFontSize(28);
      doc.text(`"${textTitle}"`, 148.5, 105, { align: "center" });
      
      doc.setFontSize(16); 
      doc.text("a été officiellement publiée et reconnue avec", 148.5, 125, { align: "center" });
      doc.text(`${certifiedCount} CERTIFICATIONS DE LECTURE`, 148.5, 140, { align: "center" });
      doc.text(`Auteur : ${authorName || "Anonyme"}`, 148.5, 160, { align: "center" });
      
      doc.save(`Certificat_Lisible_${textTitle.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      toast.error("Impossible de générer le parchemin.");
    }
  };

  // Validation de la lecture
  const validate = async () => {
    if (seconds > 0) {
      return toast.info(`Lecture en cours... Savourez encore ${seconds}s de texte.`);
    }
    if (isValidated || isProcessing) return;
    
    setIsProcessing(true);
    const t = toast.loading("Apposition du sceau officiel...");
    
    try {
      const res = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          textId: fileName, 
          readerEmail: userEmail || "visiteur@lisible.biz" 
        })
      });

      if (res.ok) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Sceau apposé avec succès !", { id: t });
        
        // Notification au parent pour mettre à jour le compteur live
        if (onValidated) onValidated(); 
        
        // Revalidation Next.js pour purger le cache
        try { await fetch(`/api/revalidate?path=/texts/${fileName}`); } catch(e){}
      } else {
        toast.error("Le protocole de certification a échoué.", { id: t });
      }
    } catch (e) { 
      toast.error("Connexion au sanctuaire interrompue.", { id: t }); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="my-24 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="relative group scale-110">
        {/* Cercle de progression SVG */}
        <svg className="w-44 h-44 -rotate-90 drop-shadow-sm">
          <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
          <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={502} strokeDashoffset={502 - (502 * progress) / 100}
            className={`transition-all duration-1000 ease-out ${isValidated ? "text-teal-500" : "text-rose-600"}`}
            strokeLinecap="round"
          />
        </svg>

        {/* Bouton Sceau central */}
        <div 
          onClick={validate} 
          className={`absolute inset-6 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${
            isValidated 
            ? 'bg-teal-500 shadow-teal-500/40' 
            : 'bg-slate-900 dark:bg-slate-800 shadow-xl hover:scale-105 active:scale-95'
          } ${isProcessing ? 'opacity-50 grayscale' : ''}`}
        >
          {isValidated ? (
            <ShieldCheck size={52} className="text-white animate-in zoom-in duration-500" />
          ) : (
            <div className="text-center text-white p-4">
              <span className="block text-2xl font-black italic tracking-tighter leading-none mb-1">LISIBLE</span>
              <div className="h-[2px] w-8 bg-white/20 mx-auto mb-2" />
              <span className="block text-[9px] font-black uppercase tracking-[0.2em] opacity-90">
                {seconds > 0 ? `${seconds}S` : "CERTIFIER"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Compteur de certifications */}
        <div className="px-10 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center gap-3 shadow-sm group hover:border-teal-500/30 transition-colors">
          <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-full">
            <Sparkles size={16} className="text-teal-600 animate-pulse" />
          </div>
          <span className="text-[12px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">
            {Number(certifiedCount) || 0} Certifications
          </span>
        </div>

        {/* Condition de téléchargement (Ex: 10 certifications) */}
        {Number(certifiedCount) >= 10 && (
          <button 
            onClick={generateCertificate} 
            className="group flex items-center gap-3 px-10 py-5 bg-slate-950 dark:bg-teal-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-teal-500 transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-95"
          >
            <Download size={18} className="group-hover:animate-bounce" /> 
            Obtenir le Certificat Officiel
          </button>
        )}
      </div>
    </div>
  );
}
