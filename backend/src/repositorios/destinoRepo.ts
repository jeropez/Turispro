import { supabase } from '../config/supabase';
import { verificar } from '../utils/baseDatos';

export interface Destino { id: string; nombre: string; pais: string; descripcion: string | null }

export const destinoRepo = {
  async listar(q?: string) {
    let c = supabase.from('destinos').select('*').order('nombre');
    if (q) c = c.ilike('nombre', `%${q}%`);
    return verificar(await c) as Destino[];
  },
  async buscarPorId(id: string) {
    return verificar(await supabase.from('destinos').select('*').eq('id', id).maybeSingle()) as Destino | null;
  },
  async crear(d: Omit<Destino, 'id'>) {
    return verificar(await supabase.from('destinos').insert(d).select('*').single()) as Destino;
  },
  async actualizar(id: string, d: Partial<Omit<Destino, 'id'>>) {
    return verificar(await supabase.from('destinos').update(d).eq('id', id).select('*').maybeSingle()) as Destino | null;
  },
};
