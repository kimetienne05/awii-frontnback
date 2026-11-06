import { creerApp } from './app.js';
import { lireConfig } from './config.js';
import { creerPool } from './db/pool.js';

const config = lireConfig();
const pool = creerPool(config.DATABASE_URL);
const app = creerApp({ db: pool, secretJwt: config.JWT_SECRET, cookieSecurise: config.COOKIE_SECURE });

app.listen(config.PORT, () => {
  console.log(`API démarrée sur le port ${config.PORT}`);
});
