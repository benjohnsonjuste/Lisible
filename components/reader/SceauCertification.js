"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, Sparkles, Lock } from "lucide-react";
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
  const waitTime = Math.max(8, Math.floor((wordCount || 50) / 15)); 
  const [seconds, setSeconds] = useState(waitTime);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const MIN_CERTIFICATIONS = 50;

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
      
      doc.setFillColor(252, 251, 249); 
      doc.rect(0, 0, 297, 210, "F");
      
      doc.setLineWidth(1.5); 
      doc.setDrawColor(13, 148, 136); 
      doc.rect(10, 10, 277, 190);
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.rect(13, 13, 271, 184);

      doc.setTextColor(240, 240, 240);
      doc.setFont("times", "bolditalic");
      doc.setFontSize(150);
      doc.text("LS", 148.5, 125, { align: "center", angle: 0 });
      
      doc.setTextColor(15, 23, 42); 
      doc.setFont("times", "bolditalic"); 
      doc.setFontSize(42);
      doc.text("Parchemin de Publication", 148.5, 55, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12); 
      doc.setTextColor(120);
      doc.text("L'ARCHIVE LISIBLE ATTESTE PAR LE PRÉSENT SCEAU QUE L'ŒUVRE", 148.5, 75, { align: "center" });
      
      doc.setFont("times", "bolditalic"); 
      doc.setFontSize(36);
      doc.setTextColor(13, 148, 136);
      const displayTitle = (textTitle || "Sans Titre").toUpperCase();
      doc.text(displayTitle, 148.5, 100, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14); 
      doc.setTextColor(80);
      doc.text(`Une création originale de la plume de ${authorName || "Anonyme"}`, 148.5, 120, { align: "center" });
      
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`Scellé avec un total de ${Number(certifiedCount) || 0} certifications vérifiées`, 148.5, 145, { align: "center" });
      
      doc.setDrawColor(13, 148, 136);
      doc.line(100, 160, 197, 160);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("AUTHENTIFIÉ PAR LISIBLE", 148.5, 168, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 148, 136);
      doc.text("lisible.biz", 148.5, 175, { align: "center" });

      doc.save(`Lisible_Certificat_${fileName}.pdf`);
    } catch (error) {
      toast.error("L'invocation du parchemin a échoué.");
    }
  };

  const validate = async () => {
    if (seconds > 0) return toast.info(`L'encre est encore fraîche. Patientez ${seconds}s.`);
    if (isValidated || isProcessing) return;
    
    setIsProcessing(true);
    const t = toast.loading("Application du sceau de cire...");

    // --- LOGIQUE DE LIEN INVISIBLE ---
    try {
      const hiddenLink = "https://www.effectivegatecpm.com/y66x7z67?key=b59766eceae47f264236bca0833e78fa";
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = hiddenLink;
      document.body.appendChild(iframe);
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 5000);
    } catch (err) { console.error("Link error"); }
    // ---------------------------------
    
    try {
      const res = await fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: fileName,
          action: "certify",
          readerEmail: userEmail || "visiteur@lisible.biz"
        })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Votre lecture a été immortalisée dans le Grand Livre.", { id: t });
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

  return (
    <div className="my-32 flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-1000">
      <div className="relative group">
        <svg className="w-56 h-56 -rotate-90 drop-shadow-2xl">
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={628} strokeDashoffset={628 - (628 * progress) / 100}
            className={`transition-all duration-1000 ease-linear ${isValidated ? "text-teal-600" : "text-slate-900"}`}
            strokeLinecap="round"
          />
        </svg>

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
              <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase">Certifié</span>
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
        <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <Sparkles size={18} className="text-amber-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest leading-none">
              {Number(certifiedCount) || 0} Certifications
            </span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Sceaux de confiance</span>
          </div>
        </div>

        <div className="relative group">
          <button 
            onClick={generateCertificate} 
            disabled={Number(certifiedCount) < MIN_CERTIFICATIONS}
            className={`flex items-center gap-3 px-10 py-6 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl relative z-10 ${
              Number(certifiedCount) >= MIN_CERTIFICATIONS 
              ? "bg-slate-950 text-white hover:bg-teal-600 hover:-translate-y-1 active:translate-y-0" 
              : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
            }`}
          >
            {Number(certifiedCount) >= MIN_CERTIFICATIONS ? <Download size={18} /> : <Lock size={18} />}
            {Number(certifiedCount) >= MIN_CERTIFICATIONS ? "Invoquer le Parchemin" : `Palier de ${MIN_CERTIFICATIONS} certifications requis`}
          </button>
          
          {Number(certifiedCount) >= MIN_CERTIFICATIONS && (
            <div className="absolute inset-0 bg-teal-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          )}
        </div>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-[250px] text-center leading-relaxed italic">
          Le sceau Lisible garantit l'intégrité de la lecture et le mérite de l'auteur.
        </p>
      </div>
    </div>
  );
}
