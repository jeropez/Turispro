import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { autenticar } from '../middlewares/autenticacion';
import { validar, validarId } from '../middlewares/validar';
import { asincrono as a } from '../utils/asincrono';
import { authControlador } from '../controladores/authControlador';
import { catalogoControlador } from '../controladores/catalogoControlador';
import { planControlador } from '../controladores/planControlador';
import { iaControlador } from '../controladores/iaControlador';
import { reporteControlador } from '../controladores/reporteControlador';
import * as e from '../controladores/esquemas';

const r = Router();
const limiteLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiados intentos. Espera unos minutos.' } });

r.get('/salud', (_req, res) => res.json({ estado: 'ok', servicio: 'TurisPro API' }));

// HU01 · acceso (sin registro público)
r.post('/auth/login', limiteLogin, validar(e.esquemaLogin), a(authControlador.login));

// Todo lo demás exige JWT
r.use(autenticar);
r.get('/auth/yo', a(authControlador.yo));

// HU07 · destinos
r.get('/destinos', a(catalogoControlador.listarDestinos));
r.post('/destinos', validar(e.esquemaDestino), a(catalogoControlador.crearDestino));
r.put('/destinos/:id', validarId, validar(e.esquemaDestino), a(catalogoControlador.actualizarDestino));

// HU08 · recursos (alojamientos, actividades, transportes)
r.get('/recursos', a(catalogoControlador.listarRecursos));
r.post('/recursos', validar(e.esquemaRecurso), a(catalogoControlador.crearRecurso));
r.put('/recursos/:id', validarId, validar(e.esquemaRecurso), a(catalogoControlador.actualizarRecurso));

// HU02–HU06, HU11–HU13 · planes
r.get('/planes', validar(e.esquemaFiltroPlanes, 'query'), a(planControlador.listar));
r.post('/planes', validar(e.esquemaPlanNuevo), a(planControlador.crear));
r.get('/planes/:id', validarId, a(planControlador.obtener));
r.put('/planes/:id', validarId, validar(e.esquemaPlanActualizar), a(planControlador.actualizar));
r.get('/planes/:id/validacion', validarId, a(planControlador.validar));
r.post('/planes/:id/publicar', validarId, a(planControlador.publicar));
r.post('/planes/:id/archivar', validarId, a(planControlador.archivar));
r.post('/planes/:id/volver-a-publicar', validarId, a(planControlador.volverAPublicar));
r.get('/planes/:id/ficha', validarId, a(planControlador.ficha));

// HU09–HU10 · IA
r.post('/ia/propuesta', validar(e.esquemaSolicitudIA), a(iaControlador.propuesta));
r.post('/ia/usar', validar(e.esquemaUsarPropuesta), a(iaControlador.usar));

// HU14 · reportes
r.get('/reportes/planes-por-estado', validar(e.esquemaFiltroPlanes, 'query'), a(reporteControlador.planesPorEstado));
r.get('/reportes/costos-por-destino', validar(e.esquemaFiltroPlanes, 'query'), a(reporteControlador.costosPorDestino));

export default r;
