
/** Lit une variable obligatoire ; arrête l'API si elle manque. */

function obligatoire(env: NodeJS.ProcessEnv, nom: string): string {
  const valeur = env[nom];
  if (!valeur) {
    throw new Error(`Variable d'environnement manquante : ${nom}`);
  }
  return valeur;
}

export interface Config {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  COOKIE_SECURE: boolean;
}

/** Variables d'environnement, vérifiées au démarrage : l'API refuse de démarrer si l'une manque. */

export function lireConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT doit être un entier positif');
  }

  const secret = obligatoire(env, 'JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET doit faire au moins 32 caractères');
  }

  return {
    PORT: port,
    DATABASE_URL: obligatoire(env, 'DATABASE_URL'),
    JWT_SECRET: secret,
    COOKIE_SECURE: env.COOKIE_SECURE !== 'false', // vrai par défaut, faux seulement si on écrit "false"
  };
}

/** Paramètres fixés par l'ADR-006.
 * dans le config.ts mieux car si dans le .env on peut pas avoir accès aux changements */

export const DUREE_JETON_HEURES = 8;
export const NOM_COOKIE_JETON = 'jeton';
export const COUT_BCRYPT = 12;