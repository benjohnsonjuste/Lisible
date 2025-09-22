// Fonction utilitaire pour combiner des classes Tailwind
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
