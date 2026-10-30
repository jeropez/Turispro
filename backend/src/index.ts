import express from 'express';
import { aplicacion } from './aplicacion';

const app = express();
app.set('trust proxy', 1);
app.use(aplicacion);

export default app;
