import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import yargs from 'yargs';


import db from './db/postgres.js';
import StatsModel from './models/StatsModel.js';
import APIRouter from './routes/APIRouter.js';
import UserRouter from './routes/UserRouter.js';

const app = express();
// const logsDir = '../arcdps.cbtlogs';

const argv = yargs(process.argv.slice(2)).argv;
const create = argv.create;

async function startServer() {
  if (create) {
    await db.create();
  }
  let statsModel = new StatsModel(db);
  if (create) {
    await statsModel.readLogs('../arcdps.cbtlogs');
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use('/api/v0', APIRouter.create(statsModel));
  app.use('/api/v0/user', UserRouter.create());
  app.use(express.static(path.join('frontend', 'build')));
  app.use('/*', function(req, res) {
    res.sendFile(path.resolve(path.join('frontend', 'build', 'index.html')));
  });
  app.listen(31337);
  console.log('http://localhost:31337');
}


startServer();
