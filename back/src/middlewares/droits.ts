import type { RequestHandler } from 'express';
import { ErreurDroits, ErreurNonAuthentifie } from '../erreurs.js';
import type { Niveau } from '../types/auth.types.js';

/**
 * Accepte tout compte de niveau supérieur ou égal à `niveauMinimum` :
 * un rôle inclut les droits des rôles inférieurs.
 * À placer après `authentifier`.
 */

export function exigerNiveau(niveauMinimum: Niveau): RequestHandler {

  return (req, _res, next) => {

    if (!req.utilisateur) throw new ErreurNonAuthentifie();
    if (req.utilisateur.niveau < niveauMinimum) throw new ErreurDroits();
    next();
  };
}

/** Accepte seulement le trésorier, rôle parallèle à la hiérarchie. */

export function exigerRole(role: 'tresorier'): RequestHandler {

  return (req, _res, next) => {

    if (!req.utilisateur) throw new ErreurNonAuthentifie();
    if (role === 'tresorier' && !req.utilisateur.estTresorier) throw new ErreurDroits();
    next();
  };
}

/** Accepte un niveau suffisant OU le trésorier (lectures ouvertes au trésorier, matrice des droits). */

export function exigerNiveauOuTresorier(niveauMinimum: Niveau): RequestHandler {

  return (req, _res, next) => {

    if (!req.utilisateur) throw new ErreurNonAuthentifie();
    if (req.utilisateur.niveau < niveauMinimum && !req.utilisateur.estTresorier) throw new ErreurDroits();
    next();
  };
}
