import Groq from 'groq-sdk';
import { z } from 'zod';
import { entorno } from '../config/entorno';
import { calcularCostos, construirConceptos } from '../dominio/costos';
import { FRANJAS, FranjaHoraria, Recurso } from '../dominio/tipos';
import { destinoRepo } from '../repositorios/destinoRepo';
import { planRepo } from '../repositorios/planRepo';
import { recursoRepo } from '../repositorios/recursoRepo';
import { ErrorApp } from '../utils/errores';
import { planServicio } from './planServicio';

const MENSAJE_RUTA_MANUAL = 'Puedes continuar por la ruta manual.';

const respuestaIA = z.object({
  dias: z.array(z.object({
    numero_dia: z.coerce.number().optional(),
    actividades: z.array(z.object({ recurso_id: z.string(), franja: z.string().optional() })),
  })),
  alojamiento_id: z.string().nullish(),
  transporte_id: z.string().nullish(),
  recomendaciones: z.string().nullish(),
  incluye: z.string().nullish(),
  no_incluye: z.string().nullish(),
});

interface Solicitud {
  destino_id: string; duracion_dias: number; numero_viajeros: number;
  tipo_viajero: string; presupuesto_por_persona_cop: number; intereses: string[];
}

let cliente: Groq | null = null;
const obtenerCliente = () => (cliente ??= new Groq({ apiKey: entorno.GROQ_API_KEY, timeout: 45_000, maxRetries: 1 }));

/** Llama a GroqCloud con el SDK oficial (groq-sdk) y devuelve el JSON como texto. */
async function llamarIA(mensajes: { role: 'system' | 'user'; content: string }[]) {
  if (!entorno.GROQ_API_KEY) throw new ErrorApp(503, `La IA no está configurada. ${MENSAJE_RUTA_MANUAL}`);
  try {
    const r = await obtenerCliente().chat.completions.create({
      model: entorno.GROQ_MODELO,
      messages: mensajes,
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
    return r.choices[0]?.message?.content ?? undefined;
  } catch (e) {
    const estado = (e as { status?: number })?.status;
    console.error('[groq]', estado ?? 'sin respuesta', (e as Error)?.message);
    if (estado === 429) throw new ErrorApp(502, `Se alcanzó el límite de uso del servicio de IA. Intenta de nuevo en un momento. ${MENSAJE_RUTA_MANUAL}`);
    throw new ErrorApp(502, `El servicio de IA no respondió correctamente. ${MENSAJE_RUTA_MANUAL}`);
  }
}

export const iaServicio = {
  /**
   * HU09: la IA SOLO elige qué recursos registrados usar y cómo ordenarlos.
   * El costo lo calcula el sistema con las tarifas del catálogo; la IA no inventa precios.
   * La propuesta no se guarda: queda en pantalla hasta que se use (HU10).
   */
  async generarPropuesta(s: Solicitud) {
    const destino = await destinoRepo.buscarPorId(s.destino_id);
    if (!destino) throw new ErrorApp(400, 'El destino seleccionado no existe.');
    const recursos = await recursoRepo.listar({ destino_id: s.destino_id });
    if (!recursos.some((r) => r.tipo === 'ACTIVIDAD'))
      throw new ErrorApp(422, `No hay actividades registradas para ${destino.nombre}. ${MENSAJE_RUTA_MANUAL}`);

    const contenido = await llamarIA([
      { role: 'system', content: 'Eres un asesor de viajes de una agencia colombiana. Diseñas itinerarios en español. Usa EXCLUSIVAMENTE los recursos de la lista, referenciándolos por su id. No inventes lugares, precios, tarifas ni disponibilidad. Responde solo con JSON válido.' },
      { role: 'user', content: JSON.stringify({
        solicitud: { destino: destino.nombre, pais: destino.pais, dias: s.duracion_dias, viajeros: s.numero_viajeros, tipo_viajero: s.tipo_viajero, presupuesto_por_persona_cop: s.presupuesto_por_persona_cop, intereses: s.intereses },
        recursos: recursos.map((r) => ({ id: r.id, tipo: r.tipo, nombre: r.nombre, descripcion: r.descripcion, costo_referencia_cop: r.costo_referencia_cop, unidad: r.unidad })),
        reglas: ['Entre 1 y 3 actividades por día, distribuidas en MANANA, TARDE o NOCHE.', 'Solo recursos de tipo ACTIVIDAD dentro de los días.', 'Elige a lo sumo un alojamiento_id (tipo ALOJAMIENTO) y un transporte_id (tipo TRANSPORTE), o null.', 'Prioriza los intereses y procura no superar el presupuesto por persona.', 'Escribe recomendaciones, incluye y no_incluye en español, breves.'],
        formato_respuesta: { dias: [{ numero_dia: 1, actividades: [{ recurso_id: 'id', franja: 'MANANA|TARDE|NOCHE' }] }], alojamiento_id: 'id o null', transporte_id: 'id o null', recomendaciones: 'texto', incluye: 'texto', no_incluye: 'texto' },
      }) },
    ]);

    let datos: z.infer<typeof respuestaIA>;
    try { datos = respuestaIA.parse(JSON.parse(contenido ?? '')); }
    catch { throw new ErrorApp(502, `La IA devolvió una respuesta que no se pudo interpretar. ${MENSAJE_RUTA_MANUAL}`); }

    // Se descarta todo id que no exista en el catálogo del destino (anti-invención).
    const catalogo = new Map<string, Recurso>(recursos.map((r) => [r.id, r]));
    const dias = datos.dias.slice(0, s.duracion_dias).map((d, i) => ({
      numero_dia: i + 1,
      actividades: d.actividades
        .filter((a) => catalogo.get(a.recurso_id)?.tipo === 'ACTIVIDAD')
        .map((a) => ({ recurso_id: a.recurso_id, nombre: catalogo.get(a.recurso_id)!.nombre, franja: (FRANJAS.includes(a.franja as FranjaHoraria) ? a.franja : 'MANANA') as FranjaHoraria })),
    }));
    if (dias.every((d) => d.actividades.length === 0))
      throw new ErrorApp(502, `La IA no pudo armar un itinerario con los recursos disponibles. ${MENSAJE_RUTA_MANUAL}`);

    const aloj = datos.alojamiento_id && catalogo.get(datos.alojamiento_id)?.tipo === 'ALOJAMIENTO' ? datos.alojamiento_id : null;
    const trans = datos.transporte_id && catalogo.get(datos.transporte_id)?.tipo === 'TRANSPORTE' ? datos.transporte_id : null;
    const noches = Math.max(s.duracion_dias - 1, 1);
    const conceptos = construirConceptos({ actividades: dias.flatMap((d) => d.actividades.map((a) => a.recurso_id)), alojamientoId: aloj, transporteId: trans }, catalogo, s.numero_viajeros, noches);
    const { total, porPersona } = calcularCostos(conceptos, s.numero_viajeros);

    return {
      destino_id: s.destino_id, destino_nombre: destino.nombre,
      duracion_dias: s.duracion_dias, numero_viajeros: s.numero_viajeros, tipo_viajero: s.tipo_viajero,
      presupuesto_por_persona_cop: s.presupuesto_por_persona_cop,
      dias,
      alojamiento: aloj ? { recurso_id: aloj, nombre: catalogo.get(aloj)!.nombre } : null,
      transporte: trans ? { recurso_id: trans, nombre: catalogo.get(trans)!.nombre } : null,
      recomendaciones: datos.recomendaciones ?? '', incluye: datos.incluye ?? '', no_incluye: datos.no_incluye ?? '',
      conceptos, costo_total_cop: total, costo_por_persona_cop: porPersona,
      supera_presupuesto: porPersona !== null && porPersona > s.presupuesto_por_persona_cop,
    };
  },

  /**
   * HU10: «Usar y editar». Crea un plan en BORRADOR. Los costos se recalculan aquí con las
   * tarifas del catálogo; no se confía en los valores que envía el cliente.
   */
  async usarPropuesta(p: any, administradorId: string) {
    const ids: string[] = [...p.dias.flatMap((d: any) => d.actividades.map((a: any) => a.recurso_id)), p.alojamiento_id, p.transporte_id].filter(Boolean);
    const catalogo = new Map<string, Recurso>((await recursoRepo.buscarPorIds([...new Set(ids)])).map((r) => [r.id, r]));
    if (ids.some((id) => !catalogo.has(id))) throw new ErrorApp(400, 'La propuesta incluye recursos que ya no existen.');
    const destino = await destinoRepo.buscarPorId(p.destino_id);
    if (!destino) throw new ErrorApp(400, 'El destino seleccionado no existe.');

    const noches = Math.max(p.duracion_dias - 1, 1);
    const conceptos = construirConceptos({ actividades: p.dias.flatMap((d: any) => d.actividades.map((a: any) => a.recurso_id)), alojamientoId: p.alojamiento_id, transporteId: p.transporte_id }, catalogo, p.numero_viajeros, noches);
    const { id } = await planRepo.crear({
      nombre: p.nombre?.trim() || `Plan ${destino.nombre} · ${p.duracion_dias} días`,
      destino_id: p.destino_id, duracion_dias: p.duracion_dias, noches: p.duracion_dias - 1,
      numero_viajeros: p.numero_viajeros, tipo_viajero: p.tipo_viajero,
      presupuesto_por_persona_cop: p.presupuesto_por_persona_cop,
      recomendaciones: p.recomendaciones ?? null, incluye: p.incluye ?? null, no_incluye: p.no_incluye ?? null,
      estado: 'BORRADOR', origen_ia: true, administrador_id: administradorId,
    });
    await planRepo.reemplazarItinerario(id, p.dias.map((d: any) => ({
      numero_dia: d.numero_dia, actividades: d.actividades.map((a: any, orden: number) => ({ recurso_id: a.recurso_id, franja: a.franja, orden })),
    })));
    await planRepo.reemplazarConceptos(id, conceptos);
    return planServicio.obtener(id);
  },
};
