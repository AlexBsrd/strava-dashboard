const fs = require('fs');
const path = require('path');
const successColor = '\x1b[32m%s\x1b[0m';
const checkSign = '\u{2705}';
require('dotenv').config({
  path: '.env'
});

const envFile = `export const environment = {
  production: ${process.env.IS_PRODUCTION},
  stravaClientId: '${process.env.STRAVA_CLIENT_ID}',
  stravaClientSecret: '${process.env.STRAVA_CLIENT_SECRET}',
  redirectUri: '${process.env.REDIRECT_URI}',
};`

const environmentsPath = path.join(__dirname, 'src/app/environments');
const targetPath = path.join(environmentsPath, 'environment.ts');

// Créer le dossier environments s'il n'existe pas
if (!fs.existsSync(environmentsPath)) {
  fs.mkdirSync(environmentsPath, {recursive: true});
  console.log(successColor, `${checkSign} Created environments directory`);
}

// Écrire le fichier environment.ts
fs.writeFileSync(targetPath, envFile);
console.log(successColor, `${checkSign} Successfully generated environment file at ${targetPath}`);
