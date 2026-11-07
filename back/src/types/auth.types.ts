
/** Niveaux hiérarchiques. Les noms ne sont que dans le code. */

export const NIVEAUX = {
  membre_orga: 1,
  gestionnaire_jeux: 2,
  gestionnaire_plan: 3,
  commercial: 4,
  admin: 5,
} as const;

export type Niveau = 1 | 2 | 3 | 4 | 5;

/** Ce que l'API sait du compte connecté, lu dans le jeton. */

export interface UtilisateurConnecte {
  id: number;
  login: string;
  niveau: Niveau;
  estTresorier: boolean;
}

/** Ligne de la table `utilisateur` utile à l'authentification. */

export interface CompteAuthentification extends UtilisateurConnecte {
  motDePasseHash: string;
  actif: boolean;
}

