"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Upload,
  FileText,
  X,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const CHARS_PER_PAGE = 1800;
const MAX_TOTAL_CHARS = 2000000;
const PDFJS_VERSION = "4.2.67";

function paginate(text, charsPerPage = CHARS_PER_PAGE) {
  const paras = String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const pages = [];
  let cur = "";
  for (const p of paras) {
    const next = cur ? cur + "\n\n" + p : p;
    if (next.length > charsPerPage && cur) {
      pages.push(cur.trim());
      cur = p;
    } else {
      cur = next;
    }
  }
  if (cur.trim()) pages.push(cur.trim());
  return pages;
}

async function parsePdf(arrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((it) => (it.str ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }
  try { await pdf.destroy(); } catch {}
  return pages;
}

async function parseEpub(arrayBuffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new Error("EPUB invalide");
  const containerXml = await containerFile.async("text");
  const cdoc = new DOMParser().parseFromString(containerXml, "application/xml");
  const rootfile = cdoc.querySelector("rootfile");
  if (!rootfile) throw new Error("EPUB invalide");
  const opfPath = rootfile.getAttribute("full-path");
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const opfText = await zip.file(opfPath).async("text");
  const odoc = new DOMParser().parseFromString(opfText, "application/xml");
  const manifest = {};
  odoc.querySelectorAll("manifest > item").forEach((it) => {
    manifest[it.getAttribute("id")] = it.getAttribute("href");
  });
  const spine = [...odoc.querySelectorAll("spine > itemref")].map((r) => r.getAttribute("idref"));
  let fullText = "";
  for (const idref of spine) {
    const href = manifest[idref];
    if (!href) continue;
    const f = zip.file(decodeURIComponent(opfDir + href));
    if (!f) continue;
    const html = await f.async("text");
    const hdoc = new DOMParser().parseFromString(html, "text/html");
    const t = (hdoc.body && hdoc.body.innerText ? hdoc.body.innerText : "").trim();
    if (t) fullText += "\n\n" + t;
  }
  return paginate(fullText);
}

async function parseDocx(arrayBuffer) {
  const mammoth = await import("mammoth");
  const res = await mammoth.convertToHtml({ arrayBuffer });
  const tmp = document.createElement("div");
  tmp.innerHTML = res.value || "";
  const text = (tmp.innerText || "").trim();
  return paginate(text);
}

export default function PublierLivrePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [coverPreview, setCoverPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [sourceFormat, setSourceFormat] = useState("");
  const [pages, setPages] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("lisible_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(raw);
    setUser(u);
    setAuthorName(u.penName || u.name || "");
    setChecking(false);
  }, [router]);

  const handleCover = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_W = 800;
        const scale = Math.min(1, MAX_W / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCoverPreview(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "epub", "docx"].includes(ext)) {
      toast.error("Format accepté : PDF, EPUB ou Word (.docx).");
      return;
    }
    setParsing(true);
    setFileName(file.name);
    setSourceFormat(ext);
    setPages([]);
    const toastId = toast.loading("Lecture du fichier...");
    try {
      const buf = await file.arrayBuffer();
      let result = [];
      if (ext === "pdf") result = await parsePdf(buf);
      else if (ext === "epub") result = await parseEpub(buf);
      else result = await parseDocx(buf);
      if (!result.length) throw new Error("empty");
      const total = result.reduce((n, p) => n + p.length, 0);
      if (total > MAX_TOTAL_CHARS) {
        toast.error("Ce livre est trop volumineux pour la publication en ligne.", { id: toastId });
        setPages([]);
        return;
      }
      setPages(result);
      toast.success(`${result.length} pages détectées.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Impossible de lire ce fichier. Vérifiez qu'il n'est pas protégé.", { id: toastId });
      setPages([]);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (publishing || parsing) return;
    if (!title.trim()) return toast.error("Votre livre a besoin d'un titre.");
    if (!pages.length) return toast.error("Ajoutez le fichier de votre livre (PDF, EPUB ou Word).");
    setPublishing(true);
    const toastId = toast.loading("Publication de votre livre...");
    try {
      const res = await fetch("/api/livres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish_livre",
          id: `livre_${Date.now()}`,
          title: title.trim(),
          authorName: authorName.trim() || user.penName || user.name || "Une Plume",
          authorEmail: user.email.toLowerCase().trim(),
          authorPic: user.profilePic || null,
          description: description.trim(),
          coverBase64: coverPreview,
          pages,
          sourceFormat,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Échec de la publication.");
      toast.success("Livre publié avec succès !", { id: toastId });
      router.push(`/livres/${json.id}`);
    } catch (err) {
      toast.error(err.message || "Échec de la publication.", { id: toastId });
    } finally {
      setPublishing(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/livres"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 mb-8"
        >
          <ArrowLeft size={14} /> Bibliothèque des livres
        </Link>

        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4">
            <BookOpen size={14} /> Grand format
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900">
            Publier un livre
          </h1>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            Partagez votre œuvre complète (PDF, EPUB ou Word). Elle sera lisible
            page par page dans un lecteur protégé contre la copie.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-12 space-y-8"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Titre du livre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Le titre de votre œuvre"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-lg font-serif italic text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Nom d'auteur affiché
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Votre nom de plume"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Résumé, quatrième de couverture..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                Couverture
              </label>
              {coverPreview ? (
                <div className="relative w-32">
                  <img src={coverPreview} alt="Couverture" className="w-32 aspect-[2/3] object-cover rounded-2xl shadow-md" />
                  <button
                    type="button"
                    onClick={() => setCoverPreview(null)}
                    className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-teal-500 transition-colors">
                  <ImageIcon size={24} className="text-slate-300" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Choisir une image</span>
                  <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                Fichier du livre *
              </label>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-teal-500 transition-colors">
                {parsing ? (
                  <Loader2 size={24} className="animate-spin text-teal-600" />
                ) : (
                  <Upload size={24} className="text-slate-300" />
                )}
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
                  {parsing ? "Lecture en cours..." : "PDF, EPUB ou Word"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.epub,.docx"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
              {fileName ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
                  <FileText size={16} className="text-teal-600 shrink-0" />
                  <span className="truncate font-medium">{fileName}</span>
                </div>
              ) : null}
            </div>
          </div>

          {pages.length > 0 && (
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <div className="text-sm text-teal-900">
                <p className="font-black">{pages.length} pages détectées</p>
                <p className="mt-1 text-teal-700 line-clamp-3 italic">
                  « {pages[0].slice(0, 220)}{pages[0].length > 220 ? "..." : ""} »
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={publishing || parsing}
            className="w-full bg-slate-950 hover:bg-teal-600 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[1.5rem] py-5 transition-colors flex items-center justify-center gap-3"
          >
            {publishing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <BookOpen size={18} />
            )}
            {publishing ? "Publication..." : "Publier le livre"}
          </button>

          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">
            Lecteur protégé contre la copie
          </p>
        </form>
      </div>
    </div>
  );
}
