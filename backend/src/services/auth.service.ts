import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { COUT_BCRYPT, DUREE_JETON_HEURES } from '../config.js';
import { ErreurNonAuthentifie } from '../erreurs.js';
import type { UtilisateurDepot } from '../depots/utilisateur.depot.js';
import type { UtilisateurConnecte } from '../types/auth.types.js';

/**
 * Haché d'un faux mot de passe, calculé une fois au démarrage.
 * Si le login n'existe pas, on compare quand même le mot de passe à ce haché :
 * la réponse prend alors le même temps qu'avec un vrai compte, et un pirate
 * ne peut pas deviner quels logins existent en mesurant le temps de réponse.
 */

const HACHE_FACTICE = bcrypt.hashSync('mot-de-passe-factice', COUT_BCRYPT);

/**
 * Règles de l'authentification :
 * Le service ne connaît ni Express ni HTTP : il reçoit des valeurs et renvoie des valeurs.
 * Le dépôt est passé en paramètre, ce qui permet aux tests de fournir un faux dépôt.
 */

export function creerAuthService(depot: Pick<UtilisateurDepot, 'trouverParLogin'>, secretJwt: string) {

  return {

    /** Vérifie login et mot de passe, puis renvoie le profil et un jeton signé. */

    async connecter(login: string, motDePasse: string) {

      const compte = await depot.trouverParLogin(login);

      // bcrypt hache le mot de passe saisi et le compare au haché stocké en base.
      // On ne stocke et ne compare jamais le mot de passe en clair.

      const motDePasseOk = await bcrypt.compare(motDePasse, compte?.motDePasseHash ?? HACHE_FACTICE);

      // Même erreur dans les trois cas (login inconnu, mot de passe faux, compte désactivé),
      // pour ne pas révéler lequel est en cause.


      if (!compte || !motDePasseOk || !compte.actif) {
        throw new ErreurNonAuthentifie('IDENTIFIANTS_INVALIDES', 'Login ou mot de passe incorrect');
      }

      // Ce que le jeton contient : de quoi identifier le compte et vérifier ses droits
      // sans relire la base à chaque requête. Jamais le mot de passe ni son haché.

      const utilisateur: UtilisateurConnecte = {
        id: compte.id,
        login: compte.login,
        niveau: compte.niveau,
        estTresorier: compte.estTresorier,
      };

      // Signature avec la clé secrète de l'API (HS256) : toute modification du jeton
      // casse la signature. Le jeton expire au bout de 8 h, sans renouvellement.

      const jeton = jwt.sign(utilisateur, secretJwt, {
        algorithm: 'HS256',
        expiresIn: `${DUREE_JETON_HEURES}h`,
      });

      return { utilisateur, jeton };
    },

    /** Vérifie la signature et l'expiration du jeton, puis renvoie le compte qu'il décrit. */

    verifierJeton(jeton: string): UtilisateurConnecte {
      try {

        // On impose l'algorithme HS256 : un jeton signé autrement (ou non signé) est refusé.

        const contenu = jwt.verify(jeton, secretJwt, { algorithms: ['HS256'] }) as UtilisateurConnecte;

        // Un jeton bien signé mais au contenu inattendu
        // est refusé : sinon un niveau manquant pourrait passer les contrôles de droits (par exemple niveau = undefined).

        const formeValide =
            typeof contenu.id === 'number' &&
            typeof contenu.login === 'string' &&
            [1, 2, 3, 4, 5].includes(contenu.niveau) &&
            typeof contenu.estTresorier === 'boolean';
        if (!formeValide) {
          throw new ErreurNonAuthentifie('JETON_INVALIDE', 'Jeton invalide');
        }

        // On ne garde que nos champs (le jeton contient aussi ses dates de création et d'expiration).

        return {
          id: contenu.id,
          login: contenu.login,
          niveau: contenu.niveau,
          estTresorier: contenu.estTresorier,
        };
      } catch (erreur) {

        // Deux messages différents : le front peut afficher « session expirée » plutôt qu'une erreur.

        if (erreur instanceof jwt.TokenExpiredError) {
          throw new ErreurNonAuthentifie('JETON_EXPIRE', 'Session expirée, reconnectez-vous');
        }
        throw new ErreurNonAuthentifie('JETON_INVALIDE', 'Jeton invalide');
      }
    },  };
}

export type AuthService = ReturnType<typeof creerAuthService>;

/** Hache un mot de passe avant de l'enregistrer, par exemple à la création d'un compte. */

export function hacherMotDePasse(motDePasse: string): Promise<string> {
  return bcrypt.hash(motDePasse, COUT_BCRYPT);
}