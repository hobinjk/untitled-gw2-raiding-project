import express from 'express';
import path from 'path';


import PGDatabase from './db/postgres.js';
import StatsModel from './models/StatsModel.js';
import APIRouter from './routes/APIRouter.js';

const app = express();
// const logsDir = '../arcdps.cbtlogs';
const db = new PGDatabase();

const create = false;

async function startServer() {
  if (create) {
    await db.create();
  }
  let statsModel = new StatsModel(db);
  if (create) {
    await statsModel.readLogs('../arcdps.cbtlogs');
  }

  app.use('/api/v0', APIRouter.create(statsModel));
  app.use(express.static(path.join('frontend', 'build')));
  app.use('/*', function(req, res) {
    res.sendFile(path.resolve(path.join('frontend', 'build', 'index.html')));
  });
  app.listen(31337);
  console.log('http://localhost:31337');
}


startServer();
