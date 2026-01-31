import { toast } from "sonner";

export const trackActivity = async ({ 
  type,          // 'subscription', 'like', 'certified_read', 'comment'
  senderName,    // Nom de celui qui fait l'action
  targetEmail,   // Email de l'auteur qui reçoit
  amountLi = 0,  // Gain éventuel
  textTitle = "", // Titre du texte concerné
  link = ""      // Lien vers l'action
}) => {
  
  // 1. Déclenchement de la Notification via votre API Pusher/GitHub
  try {
    const notifRes = await fetch("/api/create-notif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        targetEmail,
        message: generateMessage(type, senderName, textTitle, amountLi),
        link,
        amountLi
      })
    });

    // 2. Mise à jour des stats réelles (via votre API update-user existante)
    // On incrémente les compteurs de l'auteur cible
    await fetch("/api/update-author-stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            email: targetEmail, 
            type, 
            incrementLi: amountLi 
        })
    });

    if (notifRes.ok && type === 'certified_read') {
        toast.success(`Lecture certifiée ! +${amountLi} Li pour l'auteur`);
    }

  } catch (error) {
    console.error("Erreur d'enregistrement d'activité:", error);
  }
};

// Générateur de messages intelligents
const generateMessage = (type, sender, title, li) => {
  switch(type) {
    case 'subscription': return `${sender} s'est abonné à votre plume !`;
    case 'like': return `${sender} a aimé votre texte "${title}".`;
    case 'certified_read': return `Lecture Certifiée : "${title}". Vous avez gagné ${li} Li.`;
    case 'comment': return `${sender} a laissé un commentaire sur "${title}".`;
    default: return `Nouvelle interaction de ${sender}.`;
  }
};
