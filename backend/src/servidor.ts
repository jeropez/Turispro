import { aplicacion } from './aplicacion';
import { entorno } from './config/entorno';

aplicacion.listen(entorno.PUERTO, () => console.log(`TurisPro API escuchando en http://localhost:${entorno.PUERTO}`));
