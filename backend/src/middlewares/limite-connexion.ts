import { rateLimit } from 'express-rate-limit';

/** Au plus 10 essais de connexion par minute et par adresse IP*/


/** rateLimit vient de la bibliothèque express-rate-limit. Elle fabrique un intergiciel
 * Express qui compte les requêtes de chaque client et les bloque au-delà d’un certain nombre.
 * Au-delà de la limite, le client reçoit une réponse 429 (Too Many Requests). */


export const limiteConnexion = rateLimit({

  /** la durée de la fenêtre de comptage, en millisecondes : 60 × 1000 = 60 000 ms, soit 1 minute. */
  windowMs: 60 * 1000,
  /** 10 essais maximum comme définit dans le ADR */
  limit: 10,
  /** Message à afficher si on dépasse la limite */
  message: { code: 'TROP_DE_TENTATIVES', message: 'Trop de tentatives, réessayez dans une minute' },

});
