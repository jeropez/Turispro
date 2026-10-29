import { ErrorApp } from './errores';

/** Convierte un error de Supabase en un ErrorApp 500 (sin exponer el detalle al cliente). */
export function verificar<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new ErrorApp(500, 'Error al consultar la base de datos.', r.error.message);
  return r.data as T;
}
