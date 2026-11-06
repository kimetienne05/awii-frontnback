import type pg from 'pg';

/** Le problème : créer une réservation écrit dans plusieurs tables, reservation puis reservation_zone. Si la première écriture réussit et
 * que la seconde échoue (capacité dépassée, panne…), la base reste à moitié modifiée : une réservation sans tables. C’est une incohérence.
 * La solution est une transaction : un groupe d’écritures que PostgreSQL applique toutes, ou aucune. */

/**
 * Exécute `travail` dans une transaction : COMMIT si tout réussit, ROLLBACK sinon.
 * Le même client est passé à tous les dépôts concernés (ADR-005).
 */

export async function avecTransaction<T>(

  pool: pg.Pool,
  travail: (client: pg.PoolClient) => Promise<T>,): Promise<T> {

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const resultat = await travail(client);
    await client.query('COMMIT');
    return resultat;
  } catch (erreur) {
    await client.query('ROLLBACK');
    throw erreur;
  } finally {
    client.release();
  }
}
