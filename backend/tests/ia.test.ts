import { beforeEach, describe, expect, it, vi } from 'vitest';

const crear = vi.fn();
vi.mock('groq-sdk', () => ({ default: class { chat = { completions: { create: crear } }; } }));
vi.mock('../src/config/entorno', () => ({ entorno: { GROQ_API_KEY: 'clave-de-prueba', GROQ_MODELO: 'modelo-de-prueba' } }));
vi.mock('../src/config/supabase', () => ({ supabase: {} }));

const D = '11111111-1111-1111-1111-111111111111';
const rec = (id: string, tipo: string, unidad: string, costo: number) => ({ id, destino_id: D, tipo, nombre: `Recurso ${id}`, descripcion: null, costo_referencia_cop: costo, unidad });
const RECURSOS = [rec('a1', 'ACTIVIDAD', 'PERSONA', 100000), rec('a2', 'ACTIVIDAD', 'PERSONA', 200000), rec('h1', 'ALOJAMIENTO', 'HABITACION_NOCHE', 300000), rec('t1', 'TRANSPORTE', 'SERVICIO', 50000)];
let recursosActuales = RECURSOS;

vi.mock('../src/repositorios/destinoRepo', () => ({ destinoRepo: { buscarPorId: async () => ({ id: D, nombre: 'Cartagena', pais: 'Colombia', descripcion: null }) } }));
vi.mock('../src/repositorios/recursoRepo', () => ({ recursoRepo: { listar: async () => recursosActuales, buscarPorIds: async () => [] } }));
vi.mock('../src/repositorios/planRepo', () => ({ planRepo: {} }));
vi.mock('../src/servicios/planServicio', () => ({ planServicio: {} }));

import { iaServicio } from '../src/servicios/iaServicio';

const solicitud = { destino_id: D, duracion_dias: 2, numero_viajeros: 2, tipo_viajero: 'PAREJAS', presupuesto_por_persona_cop: 600000, intereses: ['Playa'] };
const respuesta = (obj: unknown) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });

beforeEach(() => { crear.mockReset(); recursosActuales = RECURSOS; });

describe('HU09 · propuesta con IA (Groq SDK)', () => {
  it('llama al SDK con el modelo configurado y modo JSON', async () => {
    crear.mockResolvedValue(respuesta({ dias: [{ numero_dia: 1, actividades: [{ recurso_id: 'a1', franja: 'MANANA' }] }] }));
    await iaServicio.generarPropuesta(solicitud);
    const args = crear.mock.calls[0][0];
    expect(args.model).toBe('modelo-de-prueba');
    expect(args.response_format).toEqual({ type: 'json_object' });
  });

  it('el sistema calcula el costo con las tarifas del catálogo, no la IA', async () => {
    crear.mockResolvedValue(respuesta({
      dias: [{ numero_dia: 1, actividades: [{ recurso_id: 'a1', franja: 'MANANA' }] }, { numero_dia: 2, actividades: [{ recurso_id: 'a2', franja: 'TARDE' }] }],
      alojamiento_id: 'h1', transporte_id: 't1', costo_total_cop: 1,
    }));
    const p = await iaServicio.generarPropuesta(solicitud);
    // actividades: (100000 + 200000) × 2 viajeros = 600000; alojamiento: 1 noche × 300000; transporte: 50000
    expect(p.costo_total_cop).toBe(950000);
    expect(p.costo_por_persona_cop).toBe(475000);
    expect(p.supera_presupuesto).toBe(false);
  });

  it('marca cuando el costo supera el presupuesto', async () => {
    crear.mockResolvedValue(respuesta({ dias: [{ numero_dia: 1, actividades: [{ recurso_id: 'a2', franja: 'MANANA' }] }], alojamiento_id: 'h1' }));
    const p = await iaServicio.generarPropuesta({ ...solicitud, presupuesto_por_persona_cop: 100000 });
    expect(p.supera_presupuesto).toBe(true);
  });

  it('descarta ids inventados y recursos de tipo equivocado', async () => {
    crear.mockResolvedValue(respuesta({
      dias: [{ numero_dia: 1, actividades: [{ recurso_id: 'inventado', franja: 'MANANA' }, { recurso_id: 'h1', franja: 'TARDE' }, { recurso_id: 'a1', franja: 'RARA' }] }],
      alojamiento_id: 'a1', transporte_id: 'no-existe',
    }));
    const p = await iaServicio.generarPropuesta(solicitud);
    expect(p.dias[0].actividades).toEqual([{ recurso_id: 'a1', nombre: 'Recurso a1', franja: 'MANANA' }]);
    expect(p.alojamiento).toBeNull();
    expect(p.transporte).toBeNull();
  });

  it('no excede la duración pedida', async () => {
    const dia = (n: number) => ({ numero_dia: n, actividades: [{ recurso_id: 'a1', franja: 'MANANA' }] });
    crear.mockResolvedValue(respuesta({ dias: [dia(1), dia(2), dia(3), dia(4)] }));
    expect((await iaServicio.generarPropuesta(solicitud)).dias).toHaveLength(2);
  });

  it('sin actividades en el destino responde 422 y no llama a la IA', async () => {
    recursosActuales = [RECURSOS[2]];
    await expect(iaServicio.generarPropuesta(solicitud)).rejects.toMatchObject({ estado: 422 });
    expect(crear).not.toHaveBeenCalled();
  });

  it('si el SDK falla, responde 502 e invita a la ruta manual', async () => {
    crear.mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }));
    await expect(iaServicio.generarPropuesta(solicitud)).rejects.toMatchObject({ estado: 502, message: expect.stringContaining('ruta manual') });
  });

  it('si Groq responde 429, el mensaje habla del límite de uso', async () => {
    crear.mockRejectedValue(Object.assign(new Error('rate'), { status: 429 }));
    await expect(iaServicio.generarPropuesta(solicitud)).rejects.toMatchObject({ estado: 502, message: expect.stringContaining('límite') });
  });

  it('si la IA devuelve algo que no es JSON válido, responde 502', async () => {
    crear.mockResolvedValue({ choices: [{ message: { content: 'esto no es json' } }] });
    await expect(iaServicio.generarPropuesta(solicitud)).rejects.toMatchObject({ estado: 502 });
  });
});
