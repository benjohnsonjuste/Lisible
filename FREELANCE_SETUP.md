# Espace Freelance — Guide d'installation et d'exploitation

> Document en français. L'Espace Freelance permet aux écrivains de publier des missions
> (relecture, correction, mise en pages, couverture, traduction…) et aux professionnels
> du livre de les accepter contre rémunération, avec **séquestre PayPal** des fonds.

## 1. Architecture

| Élément | Emplacement |
|---|---|
| Pages | `app/marketplace/` (hub, `nouvelle/`, `retour/`, `missions/[id]/`, `pro/[email]/`, `devenir-pro/`, `tableau-de-bord/`, `admin/`) |
| API | `app/api/freelance/route.js` (GET publics + POST avec `sessionToken`) |
| PayPal | `app/api/freelance/paypal.js` (Orders v2 + Payouts) |
| Couche données | `app/api/_lib/github.js` (fichiers JSON dans le repo GitHub) |
| Sessions | `app/api/_lib/session.js` — jeton `crypto.randomUUID()`, 30 jours, stocké dans `data/sessions/<token>.json` + tableau `sessions` du fichier utilisateur |
| Composants UI | `components/freelance/` |

### Données (repo GitHub `Lisible`)

- `data/freelance/tasks/<taskId>.json` — la mission complète (statut, séquestre, échéance, messages, livrable, litige…)
- `data/freelance/index.json` — index léger des missions (listes publiques, tableaux de bord, admin)
- `data/freelance/profiles/<email_sécurisé>.json` — profil professionnel (bio, spécialités, note moyenne, `paypalEmail`, `verified`…)
- `data/freelance/ledger.json` — journal financier **append-only** (séquestres, versements, commissions, remboursements)
- `data/freelance/payouts.json` — file des paiements à verser aux professionnels (`queued` → `paid` / `manual`)
- `data/sessions/<token>.json` — sessions de connexion

### Cycle de vie d'une mission

`draft` (brouillon) → paiement PayPal → `open` (séquestre `held`) → acceptée par un pro → `assigned`
→ livrée → `delivered` → validée par l'écrivain → `completed` (séquestre libéré, payout en file).
Cas particuliers : `cancelled` (remboursement), `disputed` (litige), `refunded`.

### Règles automatiques (« paresseuses », appliquées à chaque lecture)

- **Délai dépassé** (`assigned`, `now > deadline`, aucune prolongation en attente) : la mission
  repasse `open`, le retard est comptabilisé (`missedDeadlines`), écrivain et pro sont notifiés.
- **Validation auto** (`delivered` depuis plus de 7 jours, sans litige) : validation système, séquestre libéré.

## 2. Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PAYPAL_CLIENT_ID` | — | Identifiant de l'app REST PayPal (compte `woolsleypierre01@gmail.com`) |
| `PAYPAL_CLIENT_SECRET` | — | Secret de l'app REST PayPal |
| `PAYPAL_MODE` | `sandbox` | `sandbox` (tests) ou `live` (argent réel) |
| `PAYPAL_CURRENCY` | `CAD` | Devise des missions |
| `PLATFORM_FEE_PERCENT` | `0.15` | Commission Lisible (0.15 = 15 %, le pro reçoit 85 %) |
| `ADMIN_EMAILS` | `cmo.lablitteraire7@gmail.com` | Emails autorisés à trancher les litiges et exécuter les paiements (séparés par des virgules) |
| `GITHUB_TOKEN` | — | Déjà utilisé par le site (accès au repo de données) |

**Sans `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` : le site fonctionne en MODE DÉMO.**
Les paiements sont simulés (identifiants `DEMO-…`) et l'interface affiche
« Mode test — aucun argent réel ». Parfait pour tester tout le parcours sans risque.

## 3. Créer l'app REST PayPal (compte woolsleypierre01@gmail.com)

1. Connectez-vous sur <https://developer.paypal.com> avec le compte **woolsleypierre01@gmail.com**.
2. **Apps & Credentials** → **Create App** → nommez-la « Lisible Freelance ».
3. Choisissez le compte marchand (Business) associé.
4. Copiez le **Client ID** et le **Secret** → renseignez `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET`.
5. Testez d'abord en **Sandbox** (`PAYPAL_MODE=sandbox`) avec des comptes de test
   (acheteur + vendeur créés dans « Testing Tools → Sandbox Accounts »).
6. Quand tout est validé, basculez l'app en **Live** et passez `PAYPAL_MODE=live`.

> En mode réel, l'argent des missions est **capturé sur le compte PayPal propriétaire
> des identifiants API** (donc `woolsleypierre01@gmail.com`). C'est ce compte qui
> détient les fonds sous séquestre.

## 4. Activer les Payouts (versements aux professionnels)

Sans cela, les gains des pros restent en file `queued` et l'admin reçoit
`PAYOUTS_DISABLED` (avec possibilité de règlement manuel + référence).

1. Dans le tableau de bord développeur PayPal, ouvrez votre app « Lisible Freelance ».
2. Sous **Features**, cochez **Payouts** (et acceptez les conditions).
3. PayPal peut exiger une vérification du compte marchand : suivez la procédure indiquée.
4. Vérifiez ensuite depuis `/marketplace/admin` → « Exécuter les paiements en attente ».

Tant que les Payouts ne sont pas activés, utilisez le bouton
**« Marquer comme manuel »** (avec la référence de transaction PayPal) après avoir
payé le professionnel depuis votre compte PayPal.

## 5. Configuration dans Cloudflare (production)

Dans le dashboard Cloudflare → **Workers & Pages** → votre Worker → **Settings → Variables** :

- Ajoutez `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (marquez-les comme **secrets** chiffrés),
  `PAYPAL_MODE`, `PAYPAL_CURRENCY`, `PLATFORM_FEE_PERCENT`, `ADMIN_EMAILS`.
- Redéployez après chaque changement de variable.

## 6. Prérequis côté professionnels

Chaque professionnel doit renseigner dans son profil (`/marketplace/devenir-pro`)
une **adresse PayPal valide** (`paypalEmail`) : c'est l'adresse qui recevra ses gains
via l'API Payouts (ou manuellement). Sans adresse valide, le paiement reste en file.

## 7. Commission

`PLATFORM_FEE_PERCENT=0.15` → sur 100 $CA : **85,00 $CA** au professionnel,
**15,00 $CA** de commission Lisible. Modifiable via la variable d'environnement,
sans changer le code. La décomposition est affichée à l'écrivain avant paiement.

## 8. Sécurité

- L'identité des appelants est résolue **côté serveur** via `sessionToken`
  (`app/api/_lib/session.js`) : aucun email client n'est digne de confiance sur les flux d'argent.
- Connexion/inscription génèrent un jeton (`login`/`register` de `/api/github-db`) ;
  la déconnexion le révoque (`logout`).
- Course entre professionnels : relecture du fichier avec son `sha` juste avant écriture ;
  un conflit GitHub (409) renvoie « Mission déjà prise ».
- Limitation de débit : 30 requêtes/minute par IP et par action (best-effort, en mémoire).
- L'API n'expose jamais le `paypalEmail` des pros ni les `captureId` aux non-parties.

## 9. ⚠️ Avertissement — détention de fonds de tiers

La plateforme **encaisse et bloque temporairement l'argent des écrivains**
avant de le reverser aux professionnels. Selon votre juridiction (ex. Canada),
cette activité peut relever de la réglementation sur les **entreprises de services
monétaires** ou exiger des mentions/contrats spécifiques. **Faites valider le dispositif
(séquestre, CGU article 06, remboursements, litiges) par un juriste avant le passage
en `PAYPAL_MODE=live`.**

## 10. Test de bout en bout recommandé

1. Restez en `sandbox`/démo. Créez 2 comptes (écrivain + pro).
2. Écrivain : publie une mission (budget 10 $CA) → paie (démo) → mission `open`.
3. Pro : crée son profil → accepte avec un délai → livre (lien https).
4. Écrivain : valide avec une note → vérifiez le ledger, la file `payouts`,
   la note moyenne du pro.
5. Admin : exécutez les paiements, testez un litige (remboursement / partage).
6. Testez le dépassement de délai (mission `assigned` avec `deadline` passée).
