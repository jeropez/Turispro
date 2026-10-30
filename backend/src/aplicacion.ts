import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { entorno } from './config/entorno';
import { manejarErrores, noEncontrada } from './middlewares/errores';
import rutas from './rutas';

export const aplicacion = express();
aplicacion.set('trust proxy', 1);
aplicacion.use(helmet());
aplicacion.use(cors({ origin: entorno.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, '')) }));
aplicacion.use(express.json({ limit: '1mb' }));
aplicacion.use('/api', rutas);
aplicacion.use(noEncontrada);
aplicacion.use(manejarErrores);
