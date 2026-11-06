import type { CookieOptions, Request, Response } from 'express';
import { DUREE_JETON_HEURES, NOM_COOKIE_JETON } from '../config.js';
import { ErreurMetier, ErreurNonAuthentifie } from '../erreurs.js';
import type { AuthService } from '../services/auth.service.js';
import type { UtilisateurConnecte } from '../types/auth.types.js';

/* TODO : Créer un fichier avec les codes d'erreurs et leurs messages */

/** Vérifie le corps de la requête de connexion ; sinon 400. */

function lireConnexion(corps: unknown): { login: string; motDePasse: string } {
  const { login, motDePasse } = (corps ?? {}) as Record<string, unknown>;

  if (typeof login !== 'string' || login.trim() === '' || login.length > 60) {
    throw new ErreurMetier(400, 'DONNEES_INVALIDES', 'Login manquant ou trop long');
  }
  if (typeof motDePasse !== 'string' || motDePasse === '' || motDePasse.length > 200) {
    throw new ErreurMetier(400, 'DONNEES_INVALIDES', 'Mot de passe manquant ou trop long');
  }

  return { login: login.trim(), motDePasse };
}

/** Ce que le front reçoit : le profil, jamais le jeton (ADR-006). */

function versProfil(u: UtilisateurConnecte) {
  return { id: u.id, login: u.login, niveau: u.niveau, tresorier: u.estTresorier };
}

/** Lit et valide la requête, appelle le service, choisit le code HTTP (ADR-005). */

export function creerAuthControleur(authService: AuthService, cookieSecurise: boolean) {
  const optionsCookie: CookieOptions = {
    httpOnly: true,
    secure: cookieSecurise,
    sameSite: 'strict',
    path: '/',
  };

  return {
    async connexion(req: Request, res: Response): Promise<void> {
      const { login, motDePasse } = lireConnexion(req.body);
      const { utilisateur, jeton } = await authService.connecter(login, motDePasse);
      res
          .cookie(NOM_COOKIE_JETON, jeton, { ...optionsCookie, maxAge: DUREE_JETON_HEURES * 3600 * 1000 })
          .status(200)
          .json(versProfil(utilisateur));
    },

    deconnexion(_req: Request, res: Response): void {
      res.clearCookie(NOM_COOKIE_JETON, optionsCookie).status(204).end();
    },

    moi(req: Request, res: Response): void {
      if (!req.utilisateur) throw new ErreurNonAuthentifie();
      res.status(200).json(versProfil(req.utilisateur));
    },
  };
}