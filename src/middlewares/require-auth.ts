const jwt = require('express-jwt');
const jwks = require('jwks-rsa');

export const requireAuth = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://dev-appoh.us.auth0.com/.well-known/jwks.json',
  }),
  audience: 'http://hola/api',
  issuer: 'https://dev-appoh.us.auth0.com/',
  algorithms: ['RS256'],
});
