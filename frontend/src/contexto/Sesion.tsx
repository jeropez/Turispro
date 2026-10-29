import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, guardarToken, leerToken } from '../api/cliente';

interface Admin { id?: string; nombre: string; correo?: string }
interface ContextoSesion {
  administrador: Admin | null; cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>; cerrarSesion: () => void;
}
const Ctx = createContext<ContextoSesion>(null as never);
export const useSesion = () => useContext(Ctx);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [administrador, setAdmin] = useState<Admin | null>(null);
  const [cargando, setCargando] = useState(!!leerToken());

  useEffect(() => {
    if (!leerToken()) return;
    api<{ administrador: { nombre: string } }>('/auth/yo').then((r) => setAdmin(r.administrador)).catch(() => guardarToken(null)).finally(() => setCargando(false));
  }, []);
  useEffect(() => {
    const salir = () => setAdmin(null);
    window.addEventListener('turispro:sesion-vencida', salir);
    return () => window.removeEventListener('turispro:sesion-vencida', salir);
  }, []);

  const iniciarSesion = async (correo: string, contrasena: string) => {
    const r = await api<{ token: string; administrador: Admin }>('/auth/login', 'POST', { correo, contrasena });
    guardarToken(r.token); setAdmin(r.administrador);
  };
  const cerrarSesion = () => { guardarToken(null); setAdmin(null); };
  return <Ctx.Provider value={{ administrador, cargando, iniciarSesion, cerrarSesion }}>{children}</Ctx.Provider>;
}
