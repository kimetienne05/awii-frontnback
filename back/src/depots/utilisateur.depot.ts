import type { Executeur } from '../db/pool.js';
import type { CompteAuthentification, Niveau } from '../types/auth.types.js';

interface LigneUtilisateur {
  id: number;
  login: string;
  mot_de_passe_hash: string;
  niveau: number;
  est_tresorier: boolean;
  actif: boolean;
}

function versCompte(ligne: LigneUtilisateur): CompteAuthentification {
  return {
    id: ligne.id,
    login: ligne.login,
    motDePasseHash: ligne.mot_de_passe_hash,
    niveau: ligne.niveau as Niveau,
    estTresorier: ligne.est_tresorier,
    actif: ligne.actif,
  };
}

/** Seul fichier de l'authentification qui contient du SQL (ADR-005). Requêtes paramétrées uniquement. */

export function creerUtilisateurDepot(db: Executeur) {

  return {

    async trouverParLogin(login: string): Promise<CompteAuthentification | null> {
      const res = await db.query<LigneUtilisateur>(
        `SELECT id, login, mot_de_passe_hash, niveau, est_tresorier, actif
           FROM utilisateur
          WHERE login = $1`,
        [login],
      );
      const ligne = res.rows[0];
      return ligne ? versCompte(ligne) : null;
    },

    async trouverParId(id: number): Promise<CompteAuthentification | null> {

      const res = await db.query<LigneUtilisateur>(
        `SELECT id, login, mot_de_passe_hash, niveau, est_tresorier, actif
           FROM utilisateur
          WHERE id = $1`,
        [id],
      );
      const ligne = res.rows[0];
      return ligne ? versCompte(ligne) : null;
    },

    async creer(login: string, motDePasseHash: string, niveau: Niveau, estTresorier: boolean): Promise<number> {

      const res = await db.query<{ id: number }>(
        `INSERT INTO utilisateur (login, mot_de_passe_hash, niveau, est_tresorier)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [login, motDePasseHash, niveau, estTresorier],
      );
      return res.rows[0]!.id;
    },
  };
}

export type UtilisateurDepot = ReturnType<typeof creerUtilisateurDepot>;
