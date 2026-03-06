import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const identity = searchParams.get('identity');

  // Vérification des paramètres
  if (!room || !identity) {
    return NextResponse.json(
      { error: 'Paramètres "room" et "identity" requis' }, 
      { status: 400 }
    );
  }

  // Récupération des clés depuis les variables d'environnement Vercel
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Configuration serveur manquante (Clés API)' }, 
      { status: 500 }
    );
  }

  try {
    // Création du jeton d'accès
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: identity.split('@')[0], // Utilise le début de l'email comme nom d'affichage
    });

    // Définition des permissions (Rejoindre, Parler, Écouter)
    at.addGrant({ 
      roomJoin: true, 
      room: room, 
      canPublish: true, 
      canSubscribe: true 
    });

    return NextResponse.json({ token: await at.toJwt() });
  } catch (error) {
    console.error("Erreur génération Token:", error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du jeton' }, 
      { status: 500 }
    );
  }
}
