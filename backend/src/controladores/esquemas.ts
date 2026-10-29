import { z } from 'zod';
import { ESTADOS, FRANJAS, TIPOS_RECURSO, TIPOS_VIAJERO, UNIDADES } from '../dominio/tipos';

const texto = z.string().trim();
const opcional = z.string().trim().nullish();

export const esquemaLogin = z.object({ correo: z.string().trim().email('Correo inválido'), contrasena: z.string().min(1, 'Ingresa la contraseña') });

export const esquemaDestino = z.object({
  nombre: texto.min(1, 'El nombre es obligatorio'),
  pais: texto.min(1, 'El país es obligatorio'),
  descripcion: opcional,
});

export const esquemaRecurso = z.object({
  destino_id: z.string().uuid('Selecciona un destino'),
  tipo: z.enum(TIPOS_RECURSO as [string, ...string[]]),
  nombre: texto.min(1, 'El nombre es obligatorio'),
  descripcion: opcional,
  costo_referencia_cop: z.coerce.number().min(0, 'El costo no puede ser negativo'),
});

const datosPlan = {
  nombre: texto.min(1, 'El nombre del plan es obligatorio'),
  descripcion: opcional,
  destino_id: z.string().uuid().nullish(),
  duracion_dias: z.coerce.number().int().min(1, 'La duración debe ser positiva').max(60).nullish(),
  noches: z.coerce.number().int().min(0).nullish(),
  numero_viajeros: z.coerce.number().int().min(1, 'Los viajeros deben ser un número positivo').max(500).nullish(),
  tipo_viajero: z.enum(TIPOS_VIAJERO as [string, ...string[]]).nullish(),
  presupuesto_por_persona_cop: z.coerce.number().min(0, 'El presupuesto no puede ser negativo').nullish(),
  incluye: opcional,
  no_incluye: opcional,
  recomendaciones: opcional,
};
export const esquemaPlanNuevo = z.object(datosPlan);

export const esquemaPlanActualizar = z.object({
  ...datosPlan,
  dias: z.array(z.object({
    numero_dia: z.number().int().min(1),
    actividades: z.array(z.object({
      recurso_id: z.string().uuid(),
      franja: z.enum(FRANJAS as [string, ...string[]]),
      orden: z.number().int().min(0),
    })),
  })).optional(),
  conceptos: z.array(z.object({
    recurso_id: z.string().uuid().nullish(),
    descripcion: texto.min(1, 'Cada concepto necesita una descripción'),
    cantidad: z.number().min(0, 'La cantidad no puede ser negativa'),
    unidad: z.enum(UNIDADES as [string, ...string[]]),
    costo_unitario_cop: z.number().min(0, 'El costo unitario no puede ser negativo'),
  })).optional(),
});

export const esquemaFiltroPlanes = z.object({
  estado: z.enum(ESTADOS as [string, ...string[]]).optional(),
  q: z.string().trim().max(100).optional(),
  destino_id: z.string().uuid().optional(),
  formato: z.enum(['json', 'csv']).optional(),
});

export const esquemaSolicitudIA = z.object({
  destino_id: z.string().uuid('Selecciona un destino'),
  duracion_dias: z.coerce.number().int().min(1).max(30),
  numero_viajeros: z.coerce.number().int().min(1).max(500),
  tipo_viajero: z.enum(TIPOS_VIAJERO as [string, ...string[]]),
  presupuesto_por_persona_cop: z.coerce.number().min(1, 'Indica el presupuesto por persona'),
  intereses: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export const esquemaUsarPropuesta = z.object({
  destino_id: z.string().uuid(),
  duracion_dias: z.number().int().min(1).max(30),
  numero_viajeros: z.number().int().min(1).max(500),
  tipo_viajero: z.enum(TIPOS_VIAJERO as [string, ...string[]]),
  presupuesto_por_persona_cop: z.number().min(0),
  dias: z.array(z.object({
    numero_dia: z.number().int().min(1),
    actividades: z.array(z.object({ recurso_id: z.string().uuid(), franja: z.enum(FRANJAS as [string, ...string[]]) })),
  })).min(1),
  alojamiento_id: z.string().uuid().nullish(),
  transporte_id: z.string().uuid().nullish(),
  recomendaciones: opcional,
  incluye: opcional,
  no_incluye: opcional,
  nombre: opcional,
});
