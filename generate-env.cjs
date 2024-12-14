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

const targetPath = path.join(__dirname, `/src/app/environments/environment.ts`);
fs.writeFile(targetPath, envFile, (err) => {
  if (err) {
    console.error(err);
    throw err;
  } else {
    console.log(successColor, `${checkSign} Successfully generated environment file`);
  }
});
