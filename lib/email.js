// lib/email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    const response = await resend.emails.send({
      from: "Lisible <noreply@lisible.com>",
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {
    console.error("Erreur d'envoi d'email :", error);
    throw error;
  }
}