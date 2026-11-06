/**
 * Tests de l'authentification et des droits.
 * Ils tournent sans PostgreSQL : le service reçoit un faux dépôt en mémoire,
 * et supertest envoie de vraies requêtes HTTP à l'application, sans ouvrir de port.
 */

import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { creerApp } from '../src/app.js';
import { creerAuthentifier } from '../src/middlewares/authentifier.js';
import { exigerNiveau, exigerRole } from '../src/middlewares/droits.js';
import { gestionErreurs } from '../src/middlewares/gestion-erreurs.js';
import { creerAuthService } from '../src/services/auth.service.js';

const SECRET = 'secret-de-test-suffisamment-long-pour-hs256';
const MOT_DE_PASSE = 'bon-mot-de-passe';

// Données de test

// Coût bcrypt de 4 (au lieu de 12) : les tests restent rapides.

const hache = bcrypt.hashSync(MOT_DE_PASSE, 4);

// Trois comptes : un commercial (niveau 4), un trésorier de niveau 1, un compte désactivé.

const comptes = [
  { id: 1, login: 'commercial', motDePasseHash: hache, niveau: 4 as const, estTresorier: false, actif: true },
  { id: 2, login: 'tresorier', motDePasseHash: hache, niveau: 1 as const, estTresorier: true, actif: true },
  { id: 3, login: 'ancien', motDePasseHash: hache, niveau: 4 as const, estTresorier: false, actif: false },
];

// Faux dépôt : cherche dans la liste ci-dessus au lieu de la base.

const depotFactice = {
  trouverParLogin: async (login: string) => comptes.find((c) => c.login === login) ?? null,
};

const authService = creerAuthService(depotFactice, SECRET);

// Application complète, avec une fausse base (seule la route /sante l'utiliserait).

const app = creerApp({ db: { query: async () => ({ rows: [] }) } as never, secretJwt: SECRET, cookieSecurise: true, authService });

/** Renvoie l'en-tête Cookie d'un compte connecté, prêt à être joint à une requête. */

async function cookiePour(login: string): Promise<string> {
  const { jeton } = await authService.connecter(login, MOT_DE_PASSE);
  return `jeton=${jeton}`;
}

// Connexion

describe('POST /api/v1/auth/connexion', () => {
  it('connecte et pose un cookie HttpOnly, Secure, SameSite=Strict', async () => {
    const rep = await request(app).post('/api/v1/auth/connexion').send({ login: 'commercial', motDePasse: MOT_DE_PASSE });

    expect(rep.status).toBe(200);
    // Le front reçoit le profil…
    expect(rep.body).toEqual({ id: 1, login: 'commercial', niveau: 4, tresorier: false });
    // … mais jamais le jeton, qui reste dans le cookie (ADR-006).
    expect(rep.body).not.toHaveProperty('jeton');

    const cookie = String(rep.headers['set-cookie']);
    expect(cookie).toMatch(/jeton=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  // Même réponse dans les trois cas : on ne révèle pas si le login existe.
  it.each([
    ['mauvais mot de passe', 'commercial', 'faux'],
    ['login inconnu', 'personne', MOT_DE_PASSE],
    ['compte désactivé', 'ancien', MOT_DE_PASSE],
  ])('renvoie le même 401 pour : %s', async (_cas, login, motDePasse) => {
    const rep = await request(app).post('/api/v1/auth/connexion').send({ login, motDePasse });
    expect(rep.status).toBe(401);
    expect(rep.body.code).toBe('IDENTIFIANTS_INVALIDES');
  });

  it('renvoie 400 si le corps est invalide', async () => {
    const rep = await request(app).post('/api/v1/auth/connexion').send({ login: '' });
    expect(rep.status).toBe(400);
    expect(rep.body.code).toBe('DONNEES_INVALIDES');
  });
});

// Profil du compte connecté

describe('GET /api/v1/auth/moi', () => {
  it('renvoie 401 sans cookie', async () => {
    const rep = await request(app).get('/api/v1/auth/moi');
    expect(rep.status).toBe(401);
  });

  it('renvoie le profil avec un cookie valide', async () => {
    const rep = await request(app).get('/api/v1/auth/moi').set('Cookie', await cookiePour('tresorier'));
    expect(rep.status).toBe(200);
    expect(rep.body).toEqual({ id: 2, login: 'tresorier', niveau: 1, tresorier: true });
  });
});

// Droits

describe('exigerNiveau et exigerRole', () => {
  // Petite application avec deux routes protégées, pour tester les intergiciels seuls.
  const appDroits = express();
  appDroits.use(cookieParser());
  const authentifier = creerAuthentifier(authService);
  appDroits.get('/commercial', authentifier, exigerNiveau(4), (_req, res) => { res.sendStatus(200); });
  appDroits.get('/tresorier', authentifier, exigerRole('tresorier'), (_req, res) => { res.sendStatus(200); });
  appDroits.use(gestionErreurs);

  it('accepte un niveau suffisant, refuse un niveau trop bas (403)', async () => {
    expect((await request(appDroits).get('/commercial').set('Cookie', await cookiePour('commercial'))).status).toBe(200);
    expect((await request(appDroits).get('/commercial').set('Cookie', await cookiePour('tresorier'))).status).toBe(403);
  });

  it('réserve les routes du trésorier au trésorier', async () => {
    expect((await request(appDroits).get('/tresorier').set('Cookie', await cookiePour('tresorier'))).status).toBe(200);
    expect((await request(appDroits).get('/tresorier').set('Cookie', await cookiePour('commercial'))).status).toBe(403);
  });

  it('refuse un jeton falsifié (401)', async () => {
    const rep = await request(appDroits).get('/commercial').set('Cookie', 'jeton=faux.jeton.signe');
    expect(rep.status).toBe(401);
    expect(rep.body.code).toBe('JETON_INVALIDE');
  });

  it('refuse un jeton bien signé mais sans niveau (401)', async () => {
    // Sans cette vérification, un niveau manquant passerait exigerNiveau (undefined < 4 vaut false).
    const jetonSansNiveau = jwt.sign({ id: 1, login: 'commercial' }, SECRET, { algorithm: 'HS256' });
    const rep = await request(appDroits).get('/commercial').set('Cookie', `jeton=${jetonSansNiveau}`);
    expect(rep.status).toBe(401);
    expect(rep.body.code).toBe('JETON_INVALIDE');
  });
});