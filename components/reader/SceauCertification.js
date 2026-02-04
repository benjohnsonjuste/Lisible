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
    if (localStorage.getItem(deviceKey)) setIsValidated(true);
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
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0d9488', '#1e293b', '#ffffff'] });
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
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
    doc.save(`Certificat_Lisible_${textTitle}.pdf`);
  };

  const validate = async () => {
    if (seconds > 0) return toast.info(`Attendez ${seconds}s pour certifier votre lecture.`);
    if (isValidated || isProcessing) return;
    setIsProcessing(true);
    const t = toast.loading("Protocole de scellage...");
    try {
      const res = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textId: fileName, readerEmail: userEmail || "anonymous@lisible.biz" })
      });
      if (res.ok) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Sceau apposé !", { id: t });
        onValidated(); 
      }
    } catch (e) { toast.error("Échec de connexion."); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="my-20 flex flex-col items-center gap-6">
      <div className="relative group">
        <svg className="w-36 h-36 -rotate-90">
          <circle cx="72" cy="72" r="64" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
          <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={402} strokeDashoffset={402 - (402 * progress) / 100}
            className={`transition-all duration-1000 ${isValidated ? "text-teal-500" : "text-rose-600"}`}
            strokeLinecap="round"
          />
        </svg>
        <div onClick={validate} className={`absolute inset-4 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${isValidated ? 'bg-teal-500 shadow-teal-500/40' : 'bg-slate-900 shadow-rose-900/20 hover:scale-105 active:scale-95'}`}>
          {isValidated ? <ShieldCheck size={40} className="text-white animate-in zoom-in" /> : <div className="text-center text-white"><span className="block text-lg font-black italic tracking-tighter">LISIBLE</span><span className="block text-[9px] font-bold uppercase tracking-[0.2em]">{seconds > 0 ? `${seconds}S` : "SCELLER"}</span></div>}
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center gap-3">
          <Sparkles size={14} className="text-teal-500" />
          <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{Number(certifiedCount) || 0} CERTIFICATIONS</span>
        </div>
        {Number(certifiedCount) >= 10 && (
          <button onClick={generateCertificate} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-110 transition-all shadow-xl"><Download size={14} /> Télécharger le Certificat</button>
        )}
      </div>
    </div>
  );
}
