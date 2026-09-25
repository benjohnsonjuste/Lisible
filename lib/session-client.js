// Jeton de session client, vérifié côté serveur par les routes /api.
// Posé à la connexion par AuthForm (localStorage["lisible_session"], 24 h).
// À inclure dans chaque appel d'API sensible : { sessionToken: getSessionToken(), ... }
export function getSessionToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("lisible_session");
  } catch {
    return null;
  }
}
