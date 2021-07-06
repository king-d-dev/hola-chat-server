import http from 'http';
import express from 'express';
import 'express-async-errors';
import mongoose from 'mongoose';
import { MONGO_URI } from './config';

mongoose
  .connect(MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => console.log('DATABASE CONNECTED SUCCESSFULLY'))
  .catch((e) => console.log('DATABASE CONNECTION ERROR', e));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

import routes from './routes';
routes(app);

// import the realtime communication service

const PORT = process.env.PORT || 5000;
http
  .createServer(app)
  .listen(PORT)
  .once('listening', () => console.log(`Sever running on PORT ${PORT}`));
