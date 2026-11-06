import pg from 'pg';

/**
 * Crée le « pool » de connexions à PostgreSQL.
 *
 * Ouvrir une connexion à la base est lent (réseau, authentification).
 * Plutôt que d'en ouvrir une à chaque requête, on garde une réserve
 * de connexions ouvertes, que l'API emprunte puis rend.
 *
 * - connectionString : adresse de la base, lue dans .env (DATABASE_URL)
 * - max: 10 : au plus 10 connexions en même temps ; une 11e requête attend
 *   qu'une connexion se libère, ce qui évite de surcharger PostgreSQL.
 *
 * Le pool est créé une seule fois, au démarrage (serveur.ts), et partagé par toute l'API.
 * Il ouvre tout seul une connexion perdue (si PostgreSQL redémarre, par exemple).
 */

export function creerPool(urlBase: string): pg.Pool {
  return new pg.Pool({ connectionString: urlBase, max: 10 });
}

/**
 * « Quelque chose qui sait exécuter une requête SQL » (qui a une méthode `query`).
 *
 * Ce peut être :
 *
 * - le pool entier : il prend une connexion libre, exécute la requête et la rend aussitôt ;
 *   c'est le cas pour une lecture ou une écriture simple ;
 * - une connexion précise empruntée au pool (PoolClient) : c'est le cas dans une
 *   transaction, où toutes les requêtes doivent passer par la même connexion.
 *
 * Les dépôts reçoivent un Executeur : le même code de dépôt marche donc
 * dans les deux cas, sans le savoir.
 */

export type Executeur = Pick<pg.Pool | pg.PoolClient, 'query'>;