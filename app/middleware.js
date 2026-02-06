import { NextResponse } from 'next/server';

export function middleware(request) {
  // Récupération du cookie de session (ou token)
  // Note : Le localStorage n'est pas accessible ici (côté serveur)
  // On vérifie donc la présence d'un cookie de session
  const authCookie = request.cookies.get('lisible_session');
  const { pathname } = request.nextUrl;

  // 1. Définir les routes qui nécessitent une connexion
  const protectedRoutes = ['/dashboard', '/account', '/publier', '/edit'];

  // 2. Si l'utilisateur tente d'accéder à une route protégée sans être connecté
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!authCookie) {
      // Redirection vers la page de connexion
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configuration pour ne filtrer que les routes concernées (optimise les performances)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/publier/:path*',
    '/edit/:path*',
  ],
};
