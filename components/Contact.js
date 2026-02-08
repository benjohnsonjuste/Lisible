// components/Contact.jsx
"use client";

import Link from "next/link";
import { MessageCircle, Send, Mail, HeartHandshake } from "lucide-react";

export default function Contact() {
  const socialLinks = [
    {
      name: "WhatsApp",
      href: "https://wa.me/50948321317",
      icon: <MessageCircle size={28} />,
      color: "text-green-500",
      bg: "bg-green-50",
      hover: "hover:bg-green-500",
    },
    {
      name: "Messenger",
      href: "https://m.me/LaBelleLitteraire?mibextid=ZbWKwL",
      icon: <Send size={28} />,
      color: "text-blue-500",
      bg: "bg-blue-50",
      hover: "hover:bg-blue-500",
    },
    {
      name: "E-mail",
      href: "mailto:cmo.lablitteraire7@gmail.com",
      icon: <Mail size={28} />,
      color: "text-rose-500",
      bg: "bg-rose-50",
      hover: "hover:bg-rose-500",
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-10 md:p-16 text-center shadow-xl shadow-slate-200/50 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-2xl mb-2">
            <HeartHandshake size={32} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic">
            Besoin d'aide ?
          </h2>
          <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed text-sm md:text-base">
            Notre équipe est à votre écoute pour vous accompagner dans votre aventure littéraire.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              target={link.name !== "E-mail" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4"
            >
              {/* Icône circulaire */}
              <div className={`
                w-16 h-16 md:w-20 md:h-20 
                flex items-center justify-center 
                rounded-[1.8rem] transition-all duration-500
                ${link.bg} ${link.color}
                group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-current/20 group-hover:text-white
                ${link.hover}
              `}>
                {link.icon}
              </div>
              
              {/* Label */}
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors">
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="pt-6">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Disponible 7j/7 • Réponse sous 24h
          </p>
        </div>
      </div>
    </section>
  );
}
