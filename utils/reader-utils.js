// /utils/reader-utils.js
import { Ghost, Sun, Sword, Coffee, Moon, Flame, Anchor, Zap } from "lucide-react";

export const getMood = (content) => {
  if (!content) return null;
  const text = content.toLowerCase();
  const moods = [
    { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure', 'vide', 'souvenir', 'froid', 'absence'] },
    { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair', 'vie', 'rire', 'éclat', 'matin', 'espoir', 'lumière'] },
    { label: "Épique", icon: <Sword size={12}/>, color: "bg-rose-50 text-rose-600", words: ['force', 'guerre', 'feu', 'épée', 'sang', 'destin', 'combat', 'gloire', 'empire', 'brave'] },
    { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600", words: ['silence', 'calme', 'paix', 'vent', 'doux', 'plage', 'repos', 'songe', 'nuage', 'caresse'] },
    { label: "Mystérieux", icon: <Moon size={12}/>, color: "bg-purple-50 text-purple-600", words: ['secret', 'brume', 'masque', 'étrange', 'caché', 'insaisissable', 'forêt', 'rêve', 'inconnu', 'ombre'] },
    { label: "Passionné", icon: <Flame size={12}/>, color: "bg-orange-50 text-orange-600", words: ['désir', 'corps', 'peau', 'brûle', 'rouge', 'cœur', 'fièvre', 'baiser', 'étreinte', 'âme'] },
    { label: "Nostalgique", icon: <Anchor size={12}/>, color: "bg-blue-50 text-blue-600", words: ['autrefois', 'jadis', 'antan', 'vieux', 'enfance', 'regret', 'maison', 'temps', 'passé', 'poussière'] },
    { label: "Électrique", icon: <Zap size={12}/>, color: "bg-yellow-50 text-yellow-600", words: ['vitesse', 'ville', 'acier', 'bpm', 'néon', 'flash', 'urbain', 'bruit', 'métal', 'asphalte'] }
  ];
  const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (text.split(word).length - 1), 0) }));
  return scores.reduce((p, c) => (p.score > c.score) ? p : c);
};
