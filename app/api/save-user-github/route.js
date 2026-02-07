// app/api/save-user-github/route.js
import { getFile, updateFile } from "@/lib/github";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const userData = await req.json();
    
    if (!userData.email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // UNIFICATION : Encodage Base64 pour le nom de fichier
    const fileName = Buffer.from(userData.email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    const path = `data/users/${fileName}.json`;

    const userFile = await getFile(path);
    const oldProfile = userFile ? userFile.content : {};
    const fileSha = userFile ? userFile.sha : null;

    const newProfile = { 
      ...oldProfile,
      ...userData,
      // On protège les données sensibles pour qu'elles ne soient pas écrasées par erreur
      subscribers: oldProfile.subscribers || userData.subscribers || [],
      wallet: oldProfile.wallet || userData.wallet || { balance: 0, history: [] },
      lastUpdate: new Date().toISOString() 
    };

    const success = await updateFile(
      path, 
      newProfile, 
      fileSha, 
      `👤 Profil MAJ : ${userData.penName || userData.email}`
    );

    if (success) {
      try { 
        await sendAdminNotification(newProfile); 
      } catch (e) {
        console.error("Erreur notification admin:", e);
      }
      
      return new Response(JSON.stringify({ success: true, profile: newProfile }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error("Erreur GitHub");
  } catch (error) {
    console.error("Save User Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Ta fonction sendAdminNotification (inchangée)
async function sendAdminNotification(profile) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: '"Lisible Security" <security@lisible.biz>',
    to: "cmo.lablitteraire7@gmail.com",
    subject: `Mise à jour profil : ${profile.penName || profile.email}`,
    html: `<p>Un utilisateur a modifié son profil : <b>${profile.email}</b></p>`
  });
}
