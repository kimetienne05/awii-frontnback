import type { RequestHandler } from 'express';
import { NOM_COOKIE_JETON } from '../config.js';
import { ErreurNonAuthentifie } from '../erreurs.js';
import type { AuthService } from '../services/auth.service.js';

/** Lit le jeton dans le cookie, le vérifie et renseigne `req.utilisateur`. Sinon : 401. */

/** RequestHandler est un type d’Express côté serveur : il désigne une fonction (req, res, next) */

/** CreerAuthentifier est une fabrique :
 * - lit le cookie jeton dans la requête reçue (req.cookies, rempli par cookie-parser) ;
 * - refuse avec un 401 s’il est absent ou vide ;
 * - vérifie sa signature et sa date d’expiration avec authService.verifierJeton. S’il est falsifié ou expiré, le service lève lui-même un 401 ;
 * - range le compte connecté dans req.utilisateur, pour que la suite (contrôle des droits, contrôleur, service) sache qui fait la requête ;
 * - appelle next(), ce qui passe la main à l’étape suivante.
 */

export function creerAuthentifier(authService: AuthService): RequestHandler {

  return (req, _res, next) => {

    const jeton: unknown = req.cookies?.[NOM_COOKIE_JETON];

    if (typeof jeton !== 'string' || jeton === '') {
      throw new ErreurNonAuthentifie();
    }
    req.utilisateur = authService.verifierJeton(jeton);

    /** passe la main à la fonction d'après : ici exigerNiveau */
    next();
  };
}
