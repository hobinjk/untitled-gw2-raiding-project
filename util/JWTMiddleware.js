/**
 * JWT authorization middleware.
 *
 * Contains logic to create a middleware which validates the presence of a JWT
 * token in either the header or query parameters (for websockets).
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import Constants from '../Constants.js';
import JSONWebToken from '../models/JSONWebToken.js';

const AUTH_TYPE = 'Bearer';

/**
 * Attempt to find the JWT in query parameters.
 *
 * @param {Request} req incoming http request.
 * @return {string|false} JWT string or false.
 */
function extractJWTQS(req) {
  if (typeof req.query === 'object' && req.query.jwt) {
    return req.query.jwt;
  }
  return false;
}

/**
 *  Attempt to find the JWT in the Authorization header.
 *
 * @param {Request} req incoming http request.
 * @return {string|false} JWT string or false.
 */
function extractJWTHeader(req) {
  const {authorization} = req.headers;
  if (!authorization) {
    return false;
  }
  const [type, sig] = authorization.split(' ');
  if (type !== AUTH_TYPE) {
    console.warn('JWT header extraction failed: invalid auth type');
    return false;
  }
  return sig;
}

/**
 * Authenticate the incoming call by checking its JWT.
 *
 * TODO: User error messages.
 */
export async function authenticate(req) {
  const sig = extractJWTHeader(req) || extractJWTQS(req);
  if (!sig) {
    return false;
  }
  return await JSONWebToken.verifyJWT(sig);
}


export function middlewareInsecure() {
  return (req, res, next) => {
    authenticate(req, res).
      then((jwt) => {
        req.jwt = jwt;
        next();
      }).
      catch((err) => {
        console.error('error running jwt middleware', err.stack);
        next(err);
      });
  };
}

export function middleware() {
  return (req, res, next) => {
    authenticate(req, res).
      then((jwt) => {
        if (!jwt) {
          res.status(401).end();
          return;
        }
        if (jwt.payload.role !== Constants.USER_TOKEN) {
          res.status(400)
            .send('Unknown role');
          return;
        }

        req.jwt = jwt;
        next();
      }).
      catch((err) => {
        console.error('error running jwt middleware', err.stack);
        next(err);
      });
  };
}
