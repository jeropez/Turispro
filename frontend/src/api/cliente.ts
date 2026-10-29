const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';
const CLAVE = 'turispro_token';

export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string, public detalle?: any) { super(mensaje); }
}
export const guardarToken = (t: string | null) => (t ? localStorage.setItem(CLAVE, t) : localStorage.removeItem(CLAVE));
export const leerToken = () => localStorage.getItem(CLAVE);

async function peticion(ruta: string, metodo: string, cuerpo?: unknown) {
  const token = leerToken();
  let r: Response;
  try {
    r = await fetch(BASE + ruta, {
      method: metodo,
      headers: { ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa que el backend esté en ejecución.');
  }
  if (r.status === 401 && !ruta.startsWith('/auth/login')) {
    guardarToken(null);
    window.dispatchEvent(new Event('turispro:sesion-vencida'));
  }
  return r;
}

export async function api<T>(ruta: string, metodo = 'GET', cuerpo?: unknown): Promise<T> {
  const r = await peticion(ruta, metodo, cuerpo);
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErrorApi(r.status, datos.error ?? 'Ocurrió un error.', datos.detalle);
  return datos as T;
}

/** Descarga un archivo (CSV) enviando el JWT. */
export async function descargar(ruta: string, nombre: string) {
  const r = await peticion(ruta, 'GET');
  if (!r.ok) throw new ErrorApi(r.status, 'No se pudo exportar el archivo.');
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}
