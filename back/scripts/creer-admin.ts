/**
 * Crée le premier compte administrateur (niveau 5), qui pourra ensuite créer les autres comptes.
 * Usage : docker compose run --rm api npm run creer-admin -- <login> <motDePasse>
 */

import { lireConfig } from '../src/config.js';
import { creerPool } from '../src/db/pool.js';
import { creerUtilisateurDepot } from '../src/depots/utilisateur.depot.js';
import { hacherMotDePasse } from '../src/services/auth.service.js';

const [login, motDePasse] = process.argv.slice(2);

if (!login || !motDePasse || motDePasse.length < 12) {
  console.error('Erreur : arguments manquants.');
  console.error('Syntaxe : npm run creer-admin -- <identifiant> <mot de passe>');
  console.error('Le mot de passe doit contenir au moins 12 caractères.');
  process.exit(1);
}

const pool = creerPool(lireConfig().DATABASE_URL);

try {
  const id = await creerUtilisateurDepot(pool).creer(login, await hacherMotDePasse(motDePasse), 5, false);
  console.log(`Administrateur « ${login} » créé (id ${id}).`);
} finally {
  await pool.end();
}
