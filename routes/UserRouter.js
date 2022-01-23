import Router from 'express-promise-router';
import db from '../db/postgres.js';
import fetch from 'node-fetch';
import JSONWebToken from '../models/JSONWebToken.js';
import {middleware} from '../util/JWTMiddleware.js';

export function create() {
  const UserRouter = new Router();

  // UserRouter.use('/', JWTMiddleware.middleware);

  UserRouter.get('/', middleware(), async (req, res) => {
    res.json(await db.getUser(req.jwt.user));
  });

  UserRouter.get('/keys', middleware(), async (req, res) => {
    res.json(await db.getUserKeys(req.jwt.user));
  });

  UserRouter.post('/keys', middleware(), async (req, res) => {
    let {key} = req.body;
    let account;
    try {
      let apiRes = await fetch(`https://api.guildwars2.com/v2/account?access_token=${key}`);
      let api = await apiRes.json();
      account = api.name;
    } catch (e) {
      res.json({error: e.toString()});
      return;
    }
    if (!account) {
      res.json({error: 'missing account name'});
      return;
    }
    await db.addUserKey(req.jwt.user, key, account);
    res.json({account});
  });

  UserRouter.delete('/keys/:keyId', middleware(), async (req, res) => {
    let {keyId} = req.params;
    let error = await db.deleteUserKey(req.jwt.user, keyId);
    if (typeof error === 'number') {
      res.json({count: error});
      return;
    }
    res.json({error});
  });

  UserRouter.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    await db.insertUser(username, email, password);
    res.redirect('/user');
  });

  UserRouter.post('/login', async (req, res) => {
    const {username, password} = req.body;
    let user = await db.attemptLogin(username, password);
    if (!user) {
      res.sendStatus(400);
      return;
    }
    const jwt = await JSONWebToken.issueToken(user);
    res.json({jwt});
  });

  return UserRouter;
}

export default {
  create,
};

