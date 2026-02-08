"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, Sparkles, Lock, ScrollText } from "lucide-react";
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
  // Calcul du temps de lecture (1s pour 15 mots, min 8s)
  const waitTime = Math.max(8, Math.floor((wordCount || 50) / 15)); 
  const [seconds, setSeconds] = useState(waitTime);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Synchronisation avec le stockage local pour éviter la double certification
  useEffect(() => {
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) {
      setIsValidated(true);
      setProgress(100);
      setSeconds(0);
    }
  }, [fileName]);

  // Chronomètre de lecture immersive
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

  // Génération du Parchemin Officiel (jsPDF)
  const generateCertificate = async () => {
    try {
      const { default: confetti } = await import("canvas-confetti");
      const { default: jsPDF } = await import("jspdf");
      
      confetti({ 
        particleCount: 200, 
        spread: 90, 
        origin: { y: 0.7 }, 
        colors: ['#0d9488', '#f59e0b', '#1e293b'] 
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      // Design "Atelier Lisible"
      doc.setFillColor(252, 251, 249); 
      doc.rect(0, 0, 297, 210, "F");
      doc.setLineWidth(1); 
      doc.setDrawColor(226, 232, 240); 
      doc.rect(8, 8, 281, 194);
      doc.setLineWidth(0.5);
      doc.rect(12, 12, 273, 186);
      
      doc.setTextColor(15, 23, 42); 
      doc.setFont("times", "bolditalic"); 
      doc.setFontSize(48);
      doc.text("Parchemin de Publication", 148.5, 60, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14); 
      doc.setTextColor(100);
      doc.text("L'ARCHIVE LISIBLE ATTESTE QUE L'ŒUVRE", 148.5, 80, { align: "center" });
      
      doc.setFont("times", "bolditalic"); 
      doc.setFontSize(32);
      doc.setTextColor(13, 148, 136);
      doc.text(`${textTitle.toUpperCase()}`, 148.5, 105, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14); 
      doc.setTextColor(100);
      doc.text(`Une création originale de la plume de ${authorName || "Anonyme"}`, 148.5, 125, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Scellé avec ${certifiedCount} certifications de lecture vérifiées`, 148.5, 150, { align: "center" });
      
      doc.setDrawColor(13, 148, 136);
      doc.line(110, 165, 187, 165);
      doc.setFontSize(10);
      doc.text("SCEAU OFFICIEL LISIBLE.BIZ", 148.5, 172, { align: "center" });

      doc.save(`Lisible_Certificat_${fileName}.pdf`);
    } catch (error) {
      toast.error("Échec de l'invocation du parchemin.");
    }
  };

  const validate = async () => {
    if (seconds > 0) return toast.info(`L'encre doit encore sécher pendant ${seconds}s.`);
    if (isValidated || isProcessing) return;
    
    setIsProcessing(true);
    const t = toast.loading("Apposition du sceau de cire...");
    
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
        toast.success("Sceau apposé. Votre lecture est immortalisée.", { id: t });
        if (onValidated) onValidated(); 
      } else {
        throw new Error();
      }
    } catch (e) { 
      toast.error("Le Grand Livre est inaccessible.", { id: t }); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="my-32 flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-1000">
      
      <div className="relative group">
        {/* L'Anneau de Progression */}
        <svg className="w-56 h-56 -rotate-90 drop-shadow-2xl">
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={628} strokeDashoffset={628 - (628 * progress) / 100}
            className={`transition-all duration-1000 ease-linear ${isValidated ? "text-teal-600" : "text-slate-900"}`}
            strokeLinecap="round"
          />
        </svg>

        {/* Le Sceau Central */}
        <div 
          onClick={validate} 
          className={`absolute inset-8 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-700 shadow-2xl ${
            isValidated 
            ? 'bg-teal-600 shadow-teal-600/30 rotate-[360deg]' 
            : 'bg-slate-950 shadow-slate-950/40 hover:scale-105 active:scale-90 group-hover:bg-slate-900'
          } ${isProcessing ? 'animate-pulse' : ''}`}
        >
          {isValidated ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <ShieldCheck size={64} className="text-white mb-1" />
              <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase">Vérifié</span>
            </div>
          ) : (
            <div className="text-center text-white p-6">
              <span className="block text-3xl font-black italic tracking-tighter mb-1">LS</span>
              <div className="h-[1px] w-6 bg-white/30 mx-auto mb-2" />
              <span className="block text-[10px] font-black uppercase tracking-[0.4em] opacity-80">
                {seconds > 0 ? `${seconds}s` : "Sceller"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* Badge de Reconnaissance */}
        <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="relative">
            <Sparkles size={18} className="text-amber-500 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest leading-none">
              {Number(certifiedCount) || 0} Lectures
            </span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Sceau de reconnaissance</span>
          </div>
        </div>

        {/* Action du Parchemin */}
        <div className="relative group">
          <button 
            onClick={generateCertificate} 
            disabled={Number(certifiedCount) < 5}
            className={`flex items-center gap-3 px-10 py-6 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl relative z-10 ${
              Number(certifiedCount) >= 5 
              ? "bg-slate-950 text-white hover:bg-teal-600 hover:-translate-y-1 active:translate-y-0" 
              : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
            }`}
          >
            {Number(certifiedCount) >= 5 ? <Download size={18} /> : <Lock size={18} />}
            {Number(certifiedCount) >= 5 ? "Invoquer le Parchemin" : "Palier de 5 certifications requis"}
          </button>
          
          {Number(certifiedCount) >= 5 && (
            <div className="absolute inset-0 bg-teal-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          )}
        </div>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-[250px] text-center leading-relaxed">
          Chaque certification renforce la preuve d'existence de l'œuvre sur la plateforme Lisible.
        </p>
      </div>
    </div>
  );
}
