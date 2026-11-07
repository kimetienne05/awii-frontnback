import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';

import helmet from 'helmet';

/** Le helmet ajoute automatiquement des en-têtes HTTP de sécurité à chaque réponse de l’API.
 * Ces en-têtes ne bloquent rien eux-mêmes : ce sont des consignes données au navigateur, qui les applique pour se protéger
 * contre certaines attaques.
 */

import { creerAuthControleur } from './controleurs/auth.controleur.js';
import type { Executeur } from './db/pool.js';
import { creerUtilisateurDepot } from './depots/utilisateur.depot.js';
import { creerAuthentifier } from './middlewares/authentifier.js';
import { gestionErreurs } from './middlewares/gestion-erreurs.js';
import { creerAuthRoutes } from './routes/auth.routes.js';
import { creerSanteRoutes } from './routes/sante.routes.js';
import { creerAuthService, type AuthService } from './services/auth.service.js';

/** Ce dont l'application a besoin pour être construite (fourni par serveur.ts, ou par les tests). */

export interface DependancesApp {
  db: Executeur;            // connexion à PostgreSQL
  secretJwt: string;        // clé de signature des jetons (variable JWT_SECRET)
  cookieSecurise: boolean;  // cookie envoyé seulement en HTTPS (vrai en production)
  authService?: AuthService; // facultatif : les tests fournissent un faux service, sans base
}

/**
 * Construit l'application Express.
 * Ce fichier ne contient aucune logique : il branche les couches entre elles
 * (dépôt → service → contrôleur → routes) et fixe l'ordre des intergiciels.
 * Il ne démarre pas le serveur : c'est le rôle de serveur.ts, ce qui permet aux tests
 * d'utiliser l'application sans ouvrir de port.
 */

export function creerApp({ db, secretJwt, cookieSecurise, authService }: DependancesApp): Express {

  const app = express();

  // Derrière nginx : lire la vraie adresse IP du client (utile à la limitation des connexions à 10).

  app.set('trust proxy', 1);

  // En-têtes HTTP de sécurité usuels (DAT, section 6).

  app.use(helmet());

  // Lit le corps JSON des requêtes ; transforme le JSON en req.body

  app.use(express.json());

  // Lit les cookies, dont celui qui contient le jeton.

  app.use(cookieParser());

  /** Assemblage des couches de l'authentification */

  const service = authService ?? creerAuthService(creerUtilisateurDepot(db), secretJwt);

  // Intergiciel à placer devant toute route réservée aux comptes connectés.

  const authentifier = creerAuthentifier(service);

  /** Les routes */

  app.use('/api/v1/sante', creerSanteRoutes(db));
  app.use('/api/v1/auth', creerAuthRoutes(creerAuthControleur(service, cookieSecurise), authentifier));

  // Les autres ressources s'ajouteront ici

  // Aucune route n'a répondu : 404 au format JSON de l'API.

  app.use((_req, res) => {
    res.status(404).json({ code: 'INTROUVABLE', message: 'Route inconnue' });
  });

  // Toute erreur levée plus haut arrive ici et devient une réponse JSON (400, 401, 403, 500…).
  app.use(gestionErreurs);

  return app;
}