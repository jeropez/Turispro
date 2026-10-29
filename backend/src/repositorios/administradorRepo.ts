import { supabase } from '../config/supabase';
import { verificar } from '../utils/baseDatos';

export interface AdministradorFila { id: string; nombre: string; correo: string; contrasena_hash: string }

export const administradorRepo = {
  async buscarPorCorreo(correo: string) {
    return verificar(await supabase.from('administradores').select('*').eq('correo', correo.toLowerCase()).maybeSingle()) as AdministradorFila | null;
  },
  async crear(d: { nombre: string; correo: string; contrasena_hash: string }) {
    return verificar(await supabase.from('administradores').insert({ ...d, correo: d.correo.toLowerCase() }).select('id,nombre,correo').single());
  },
};
