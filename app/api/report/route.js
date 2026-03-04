import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { reportData } = await req.json();

    // Configuration EmailJS (à remplacer par vos clés après création du compte)
    const data = {
      service_id: 'YOUR_SERVICE_ID',
      template_id: 'YOUR_TEMPLATE_ID',
      user_id: 'YOUR_PUBLIC_KEY',
      template_params: {
        to_email: 'cmo.lablitteraire7@gmail.com',
        from_name: reportData.reporterEmail,
        subject: `🚨 SIGNALEMENT : ${reportData.reason}`,
        message: `
          TITRE : ${reportData.textTitle}
          MOTIF : ${reportData.reason}
          DÉTAILS : ${reportData.details}
          DATE : ${reportData.date}
        `
      }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
