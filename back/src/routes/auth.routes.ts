import { Router, type RequestHandler } from 'express';
import type { creerAuthControleur } from '../controleurs/auth.controleur.js';
import { limiteConnexion } from '../middlewares/limite-connexion.js';

/** Routes d'authentification : URL, méthode et rate-limit. */

export function creerAuthRoutes(
  controleur: ReturnType<typeof creerAuthControleur>,
  authentifier: RequestHandler,
): Router {

  const routeur = Router();

  routeur.post('/connexion', limiteConnexion, controleur.connexion);
  routeur.post('/deconnexion', controleur.deconnexion);
  routeur.get('/moi', authentifier, controleur.moi);

  // TODO : PATCH /moi/mot-de-passe : en attente de la réponse du client (le membre peut-il modifier son compte ?).

  return routeur;
}
