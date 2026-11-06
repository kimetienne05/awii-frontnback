
/**
 * Ajoute la propriété `utilisateur` au type `Request` d'Express.
 *
 * Express ne connaît que ses propres propriétés (body, cookies, params…).
 * Or l'intergiciel `authentifier` range le compte connecté dans `req.utilisateur`.
 * Sans ce fichier, TypeScript refuserait toute ligne qui lit ou écrit `req.utilisateur`.
 *
 * Ce fichier ne contient que des types : il disparaît à la compilation
 * et ne change rien au fonctionnement de l'API.
 */

import type { UtilisateurConnecte } from './auth.types.js';

// On complète le type global `Express.Request` : TypeScript fusionne cette
// déclaration avec celle d'Express.

declare global {
  namespace Express {
    interface Request {

      /**
       * Compte connecté, rempli par l'intergiciel `authentifier` après vérification du jeton.
       * Facultatif (`?`) : absent sur les routes publiques (connexion, santé…),
       * d'où le `if (!req.utilisateur)` dans les intergiciels de droits et les contrôleurs.
       */

      utilisateur?: UtilisateurConnecte;
    }
  }
}

// Fait de ce fichier un module : obligatoire pour que `declare global` soit accepté.

export {};