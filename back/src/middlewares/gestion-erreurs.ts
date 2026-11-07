import type { ErrorRequestHandler } from 'express';
import { ErreurMetier } from '../erreurs.js';

/**
 * Cette partie est dédiée à la gestion des erreurs : on veut traduire les erreurs en JSON
 * { code, message, details }.
 * On a pensé qu'il est intéressant que les erreurs 500 soient journalisées
 * sans que leur détail soit envoyé au client.
 */

export const gestionErreurs: ErrorRequestHandler = (erreur, _req, res, _next) => {

  // Erreurs métier levées par les contrôleurs et les services (400, 401, 403, 404, 409…)

  if (erreur instanceof ErreurMetier) {
    res.status(erreur.statut).json({ code: erreur.code, message: erreur.message, details: erreur.details });
    return;
  }

  // Corps de requête illisible ou trop gros, détecté par express.json()

  if (erreur?.type === 'entity.parse.failed') {
    res.status(400).json({ code: 'JSON_INVALIDE', message: 'Le corps de la requête n\'est pas un JSON valide' });
    return;
  }
  if (erreur?.type === 'entity.too.large') {
    res.status(413).json({ code: 'REQUETE_TROP_GROSSE', message: 'Le corps de la requête est trop volumineux' });
    return;
  }

  // Toute autre erreur : un bug. On la journalise, sans rien en révéler au client.

  console.error(erreur);
  res.status(500).json({ code: 'ERREUR_INTERNE', message: 'Erreur interne du serveur' });
};