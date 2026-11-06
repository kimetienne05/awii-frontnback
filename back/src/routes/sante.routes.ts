import { Router } from 'express';
import type { Executeur } from '../db/pool.js';

/** Test de santé utilisé par le job de déploiement : 200 si la base répond, 503 sinon. */

/** TODO MATHIEU : Le job deploy du pipeline (section 8 du DAT). Après docker compose up -d sur la VM, il appelle
 * TODO : /sante plusieurs fois, jusqu’à obtenir un 200 ou jusqu’à 60 secondes. Si la réponse n’arrive pas, le déploiement est marqué en échec, et on sait qu’il faut lancer le rollback. C’est sa raison d’être.
 *  TODO : et/ou : + Docker, un healthcheck dans docker-compose.yml peut l’appeler régulièrement, par exemple toutes les 30 secondes, et marquer le conteneur unhealthy en cas d’échec.
 */

export function creerSanteRoutes(db: Executeur): Router {

  const routeur = Router();

  routeur.get('/', async (_req, res) => {
    try {

      await db.query('SELECT 1');

      /** C’est la requête SQL la plus légère possible : elle ne lit aucune table et renvoie simplement 1. Elle sert seulement à vérifier
       *  que l’API arrive à joindre PostgreSQL. Si la base est arrêtée ou injoignable, la requête échoue et la route répond 503
       *  (service indisponible). Une API qui tourne mais ne peut pas parler à sa base est inutilisable : le test doit donc la considérer en panne.
       */


      res.status(200).json({ statut: 'ok' });
    } catch {
      res.status(503).json({ code: 'SERVICE_INDISPONIBLE', message: 'Base de données injoignable' });
    }
  });
  return routeur;
}
