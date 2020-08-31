import express from 'express';
import path from 'path';


import PGDatabase from './db/postgres.js';
import StatsModel from './models/StatsModel.js';
import APIRouter from './routes/APIRouter.js';

const app = express();
// const logsDir = '../arcdps.cbtlogs';
const db = new PGDatabase();

async function startServer() {
  // await db.create();
  let statsModel = new StatsModel(db);
  // await statsModel.readLogs(logsDir);

  console.log('yeah I read the logs');
  app.use('/api/v0', APIRouter.create(statsModel));
}
app.use('/', express.static('static'));

app.listen(31337);
console.log('http://localhost:31337');

startServer();
