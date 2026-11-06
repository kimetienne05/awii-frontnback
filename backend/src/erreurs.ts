
/** Erreurs métier : les services les lèvent, l'intergiciel de gestion des erreurs les traduit en HTTP. */

export class ErreurMetier extends Error {
  constructor(
    readonly statut: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ErreurNonAuthentifie extends ErreurMetier {
  constructor(code = 'NON_AUTHENTIFIE', message = 'Authentification requise') {
    super(401, code, message);
  }
}

export class ErreurDroits extends ErreurMetier {
  constructor(message = 'Droits insuffisants') {
    super(403, 'DROITS_INSUFFISANTS', message);
  }
}

export class ErreurIntrouvable extends ErreurMetier {
  constructor(message = 'Ressource introuvable') {
    super(404, 'INTROUVABLE', message);
  }
}

export class ErreurConflit extends ErreurMetier {
  constructor(code: string, message: string, details?: unknown) {
    super(409, code, message, details);
  }
}
