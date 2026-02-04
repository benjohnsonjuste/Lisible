"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SceauCertification({ wordCount, fileName, userEmail, onValidated, certifiedCount, authorName, textTitle }) {
  const waitTime = Math.max(8, Math.floor((wordCount || 50) / 5));
  const [seconds, setSeconds] = useState(waitTime);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const generateCertificate = async () => {
    const { default: confetti } = await import("canvas-confetti");
    const { default: jsPDF } = await import("jspdf");
    
    confetti({ 
      particleCount: 150, 
      spread: 70, 
      origin: { y: 0.6 }, 
      colors: ['#0d9488', '#1e293b', '#ffffff'] 
    });

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    // Design du certificat
    doc.setFillColor(253, 251, 247); doc.rect(0, 0, 297, 210, "F");
    doc.setLineWidth(2); doc.setDrawColor(13, 148, 136); doc.rect(10, 10, 277, 190);
    doc.setTextColor(15, 23, 42); doc.setFont("times", "bold"); doc.setFontSize(40);
    doc.text("CERTIFICAT DE PUBLICATION", 148.5, 60, { align: "center" });
    doc.setFontSize(16); doc.text("La plateforme LISIBLE certifie que l'œuvre intitulée", 148.5, 85, { align: "center" });
    doc.setFont("times", "italic"); doc.setFontSize(28);
    doc.text(`"${textTitle}"`, 148.5, 105, { align: "center" });
    doc.setFontSize(16); doc.text("a été officiellement publiée et reconnue avec", 148.5, 125, { align: "center" });
    doc.text(`${certifiedCount} CERTIFICATIONS DE LECTURE`, 148.5, 140, { align: "center" });
    doc.text(`Auteur : ${authorName || "Anonyme"}`, 148.5, 160, { align: "center" });
    
    doc.save(`Certificat_Lisible_${textTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const validate = async () => {
    if (seconds > 0) return toast.info(`Lecture en cours... Attendez encore ${seconds}s.`);
    if (isValidated || isProcessing) return;
    
    setIsProcessing(true);
    const t = toast.loading("Apposition du sceau officiel...");
    
    try {
      const res = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          textId: fileName, 
          readerEmail: userEmail || "anonymous@lisible.biz" 
        })
      });

      if (res.ok) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Sceau apposé avec succès !", { id: t });
        onValidated(); 
        
        // Optionnel : Revalidation manuelle
        try { await fetch(`/api/revalidate?path=/texte/${fileName}`); } catch(e){}
      } else {
        toast.error("Le protocole a échoué.", { id: t });
      }
    } catch (e) { 
      toast.error("Erreur de connexion au serveur.", { id: t }); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="my-24 flex flex-col items-center gap-8 animate-in fade-in duration-1000">
      <div className="relative group">
        {/* Cercle de progression SVG */}
        <svg className="w-40 h-40 -rotate-90">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={440} strokeDashoffset={440 - (440 * progress) / 100}
            className={`transition-all duration-1000 ${isValidated ? "text-teal-500" : "text-rose-600"}`}
            strokeLinecap="round"
          />
        </svg>

        {/* Bouton central */}
        <div 
          onClick={validate} 
          className={`absolute inset-5 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${
            isValidated 
            ? 'bg-teal-500 shadow-teal-500/40' 
            : 'bg-slate-950 dark:bg-slate-900 shadow-xl hover:scale-105 active:scale-95'
          } ${isProcessing ? 'opacity-50' : ''}`}
        >
          {isValidated ? (
            <ShieldCheck size={48} className="text-white animate-in zoom-in" />
          ) : (
            <div className="text-center text-white">
              <span className="block text-xl font-black italic tracking-tighter">LISIBLE</span>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                {seconds > 0 ? `${seconds}S` : "CERTIFIER"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <Sparkles size={16} className="text-teal-500" />
          <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">
            {Number(certifiedCount) || 0} Certifications
          </span>
        </div>

        {Number(certifiedCount) >= 10 && (
          <button 
            onClick={generateCertificate} 
            className="group flex items-center gap-3 px-8 py-4 bg-slate-950 dark:bg-teal-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-teal-500 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
          >
            <Download size={16} className="group-hover:animate-bounce" /> 
            Télécharger le Certificat
          </button>
        )}
      </div>
    </div>
  );
}
