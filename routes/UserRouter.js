import Router from 'express-promise-router';
import db from '../db/postgres.js';
import JSONWebToken from '../models/JSONWebToken.js';
import {middleware} from '../util/JWTMiddleware.js';

export function create() {
  const UserRouter = new Router();

  // UserRouter.use('/', JWTMiddleware.middleware);

  UserRouter.get('/', middleware(), async (req, res) => {
    res.json(await db.getUser(req.jwt.user));
  });

  UserRouter.get('/keys', middleware(), (req, res) => {
    res.json([]);
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

