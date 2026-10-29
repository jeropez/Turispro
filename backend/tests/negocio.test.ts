import { describe, expect, it } from 'vitest';
import { calcularCostos, construirConceptos } from '../src/dominio/costos';
import { pendientesDePublicacion } from '../src/dominio/validacion';
import { PlanCompleto, Recurso } from '../src/dominio/tipos';

const rec = (id: string, tipo: Recurso['tipo'], unidad: Recurso['unidad'], costo: number): Recurso =>
  ({ id, destino_id: 'd', tipo, nombre: id, descripcion: null, costo_referencia_cop: costo, unidad });

describe('HU06 · costos', () => {
  it('suma cantidad × costo unitario y divide entre viajeros', () => {
    const r = calcularCostos([{ cantidad: 2, costo_unitario_cop: 100 }, { cantidad: 1, costo_unitario_cop: 50 }], 5);
    expect(r).toEqual({ total: 250, porPersona: 50 });
  });
  it('no calcula valor por persona con cero viajeros', () => {
    expect(calcularCostos([{ cantidad: 1, costo_unitario_cop: 100 }], 0).porPersona).toBeNull();
  });
  it('deriva conceptos copiando la tarifa del catálogo', () => {
    const cat = new Map([['a', rec('a', 'ACTIVIDAD', 'PERSONA', 100)], ['h', rec('h', 'ALOJAMIENTO', 'HABITACION_NOCHE', 300)], ['t', rec('t', 'TRANSPORTE', 'SERVICIO', 80)]]);
    const c = construirConceptos({ actividades: ['a', 'a'], alojamientoId: 'h', transporteId: 't' }, cat, 4, 3);
    expect(c).toHaveLength(3);
    expect(c[0]).toMatchObject({ recurso_id: 'a', cantidad: 8, costo_unitario_cop: 100 }); // 2 veces × 4 viajeros
    expect(c[1]).toMatchObject({ recurso_id: 'h', cantidad: 3, costo_unitario_cop: 300 }); // noches
    expect(c[2]).toMatchObject({ recurso_id: 't', cantidad: 1 });
  });
});

const planBase = (): PlanCompleto => ({
  id: 'p', nombre: 'Plan', descripcion: null, destino_id: 'd', duracion_dias: 2, noches: 1, numero_viajeros: 2,
  tipo_viajero: 'PAREJAS', presupuesto_por_persona_cop: null, estado: 'BORRADOR', incluye: null, no_incluye: null,
  recomendaciones: null, origen_ia: false, creado_en: '', actualizado_en: '',
  dias: [
    { numero_dia: 1, actividades: [{ recurso_id: 'a', franja: 'MANANA', orden: 0 }] },
    { numero_dia: 2, actividades: [{ recurso_id: 'a', franja: 'TARDE', orden: 0 }] },
  ],
  conceptos: [{ recurso_id: 'a', descripcion: 'x', cantidad: 1, unidad: 'PERSONA', costo_unitario_cop: 10 }],
  costo_total_cop: 10, costo_por_persona_cop: 5,
});

describe('HU12 · validación para publicar', () => {
  it('un plan completo no tiene pendientes', () => expect(pendientesDePublicacion(planBase())).toEqual([]));
  it('detecta días distintos a la duración', () => {
    const p = planBase(); p.duracion_dias = 3;
    expect(pendientesDePublicacion(p).join(' ')).toMatch(/duración es de 3/);
  });
  it('detecta datos básicos faltantes, días vacíos y falta de costos', () => {
    const p = planBase(); p.destino_id = null; p.tipo_viajero = null; p.dias[1].actividades = []; p.conceptos = [];
    const t = pendientesDePublicacion(p).join(' | ');
    expect(t).toMatch(/destino/); expect(t).toMatch(/tipo de viajero/); expect(t).toMatch(/día 2/); expect(t).toMatch(/costos/);
  });
});
