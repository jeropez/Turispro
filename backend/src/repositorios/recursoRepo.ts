import { supabase } from '../config/supabase';
import { Recurso } from '../dominio/tipos';
import { verificar } from '../utils/baseDatos';

export const recursoRepo = {
  async listar(f: { destino_id?: string; tipo?: string; q?: string }) {
    let c = supabase.from('recursos').select('*, destinos(nombre)').order('nombre');
    if (f.destino_id) c = c.eq('destino_id', f.destino_id);
    if (f.tipo) c = c.eq('tipo', f.tipo);
    if (f.q) c = c.ilike('nombre', `%${f.q}%`);
    return verificar(await c) as (Recurso & { destinos: { nombre: string } | null })[];
  },
  async buscarPorId(id: string) {
    return verificar(await supabase.from('recursos').select('*').eq('id', id).maybeSingle()) as Recurso | null;
  },
  async buscarPorIds(ids: string[]) {
    if (ids.length === 0) return [] as Recurso[];
    return verificar(await supabase.from('recursos').select('*').in('id', ids)) as Recurso[];
  },
  async crear(d: Omit<Recurso, 'id'>) {
    return verificar(await supabase.from('recursos').insert(d).select('*').single()) as Recurso;
  },
  async actualizar(id: string, d: Partial<Omit<Recurso, 'id'>>) {
    return verificar(await supabase.from('recursos').update(d).eq('id', id).select('*').maybeSingle()) as Recurso | null;
  },
};
