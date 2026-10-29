import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../api/cliente';
import { Destino, Recurso, TipoRecurso } from '../api/tipos';
import { cop, ETIQUETA_TIPO, ETIQUETA_UNIDAD } from '../utilidades/formato';

type Pestana = 'DESTINOS' | TipoRecurso;
const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: 'DESTINOS', texto: 'Destinos' }, { id: 'ALOJAMIENTO', texto: 'Alojamientos' },
  { id: 'ACTIVIDAD', texto: 'Actividades' }, { id: 'TRANSPORTE', texto: 'Transportes' },
];

export default function Recursos() {
  const [tab, setTab] = useState<Pestana>('DESTINOS');
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [filtroDestino, setFiltroDestino] = useState('');
  const [edicion, setEdicion] = useState<Destino | Recurso | 'nuevo' | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setDestinos(await api<Destino[]>('/destinos'));
      if (tab !== 'DESTINOS') setRecursos(await api<Recurso[]>(`/recursos?tipo=${tab}${filtroDestino ? `&destino_id=${filtroDestino}` : ''}`));
      setError('');
    } catch (e: any) { setError(e.message); }
  }, [tab, filtroDestino]);
  useEffect(() => { cargar(); setEdicion(null); }, [cargar]);

  return (
    <>
      <div className="cabecera">
        <h1>Recursos del catálogo</h1>
        <button className="boton" onClick={() => setEdicion('nuevo')}>+ Registrar {tab === 'DESTINOS' ? 'destino' : ETIQUETA_TIPO[tab].toLowerCase()}</button>
      </div>
      <div className="pasos">{PESTANAS.map((p) => <button key={p.id} className={`chip ${tab === p.id ? 'activo' : ''}`} onClick={() => setTab(p.id)}>{p.texto}</button>)}</div>
      {error && <div className="aviso error" role="alert">{error}</div>}

      {edicion && (tab === 'DESTINOS'
        ? <FormDestino inicial={edicion === 'nuevo' ? null : (edicion as Destino)} cerrar={() => setEdicion(null)} guardado={() => { setEdicion(null); cargar(); }} />
        : <FormRecurso tipo={tab} destinos={destinos} inicial={edicion === 'nuevo' ? null : (edicion as Recurso)} cerrar={() => setEdicion(null)} guardado={() => { setEdicion(null); cargar(); }} />)}

      <div className="vidrio tarjeta tabla-scroll">
        {tab === 'DESTINOS' ? (
          <table>
            <thead><tr><th>Nombre</th><th>País</th><th>Descripción</th><th /></tr></thead>
            <tbody>{destinos.length === 0 ? <tr><td colSpan={4} className="suave">Aún no hay destinos.</td></tr>
              : destinos.map((d) => <tr key={d.id}><td>{d.nombre}</td><td>{d.pais}</td><td>{d.descripcion}</td><td><button className="boton secundario pequeno" onClick={() => setEdicion(d)}>Editar</button></td></tr>)}</tbody>
          </table>
        ) : (
          <>
            <div style={{ maxWidth: 300, marginBottom: '.8rem' }}>
              <label htmlFor="fd">Filtrar por destino</label>
              <select id="fd" value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)}><option value="">Todos</option>{destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select>
            </div>
            <table>
              <thead><tr><th>Nombre</th><th>Destino</th><th className="num">Costo de referencia</th><th>Unidad</th><th /></tr></thead>
              <tbody>{recursos.length === 0 ? <tr><td colSpan={5} className="suave">No hay recursos de este tipo.</td></tr>
                : recursos.map((r) => <tr key={r.id}><td>{r.nombre}<br /><span className="pequeno suave">{r.descripcion}</span></td><td>{r.destinos?.nombre}</td><td className="num">{cop(r.costo_referencia_cop)}</td><td>{ETIQUETA_UNIDAD[r.unidad]}</td><td><button className="boton secundario pequeno" onClick={() => setEdicion(r)}>Editar</button></td></tr>)}</tbody>
            </table>
            <p className="pequeno suave">Cambiar una tarifa no modifica los planes ya guardados: cada plan conserva el costo con el que se calculó.</p>
          </>
        )}
      </div>
    </>
  );
}

function FormDestino({ inicial, cerrar, guardado }: { inicial: Destino | null; cerrar: () => void; guardado: () => void }) {
  const [f, setF] = useState({ nombre: inicial?.nombre ?? '', pais: inicial?.pais ?? '', descripcion: inicial?.descripcion ?? '' });
  const [error, setError] = useState('');
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try { await api(inicial ? `/destinos/${inicial.id}` : '/destinos', inicial ? 'PUT' : 'POST', { ...f, descripcion: f.descripcion || null }); guardado(); }
    catch (err: any) { setError(err.detalle?.join?.(' · ') ?? err.message); }
  };
  return (
    <form className="vidrio tarjeta" onSubmit={enviar}>
      <h2>{inicial ? 'Editar destino' : 'Nuevo destino'}</h2>
      <div className="campos">
        <div><label htmlFor="nd">Nombre</label><input id="nd" required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
        <div><label htmlFor="pd">País</label><input id="pd" required value={f.pais} onChange={(e) => setF({ ...f, pais: e.target.value })} /></div>
        <div className="ancho"><label htmlFor="dd">Descripción</label><textarea id="dd" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></div>
      </div>
      {error && <div className="aviso error" role="alert">{error}</div>}
      <div className="fila"><button className="boton">Guardar</button><button type="button" className="boton secundario" onClick={cerrar}>Cancelar</button></div>
    </form>
  );
}

function FormRecurso({ tipo, destinos, inicial, cerrar, guardado }: { tipo: TipoRecurso; destinos: Destino[]; inicial: Recurso | null; cerrar: () => void; guardado: () => void }) {
  const [f, setF] = useState({ destino_id: inicial?.destino_id ?? '', nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '', costo: inicial?.costo_referencia_cop ?? 0 });
  const [error, setError] = useState('');
  const unidad = tipo === 'ALOJAMIENTO' ? 'habitación / noche' : tipo === 'ACTIVIDAD' ? 'persona' : 'servicio';
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api(inicial ? `/recursos/${inicial.id}` : '/recursos', inicial ? 'PUT' : 'POST',
        { destino_id: f.destino_id, tipo, nombre: f.nombre, descripcion: f.descripcion || null, costo_referencia_cop: f.costo });
      guardado();
    } catch (err: any) { setError(err.detalle?.join?.(' · ') ?? err.message); }
  };
  return (
    <form className="vidrio tarjeta" onSubmit={enviar}>
      <h2>{inicial ? 'Editar' : 'Nuevo'} {ETIQUETA_TIPO[tipo].toLowerCase()}</h2>
      <div className="campos">
        <div><label htmlFor="rd">Destino</label>
          <select id="rd" required value={f.destino_id} onChange={(e) => setF({ ...f, destino_id: e.target.value })}><option value="">Selecciona…</option>{destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></div>
        <div><label htmlFor="rn">Nombre</label><input id="rn" required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
        <div><label htmlFor="rc">Costo de referencia (COP por {unidad})</label><input id="rc" type="number" min={0} required value={f.costo} onChange={(e) => setF({ ...f, costo: Number(e.target.value) })} /></div>
        <div className="ancho"><label htmlFor="rde">Descripción</label><textarea id="rde" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></div>
      </div>
      {error && <div className="aviso error" role="alert">{error}</div>}
      <div className="fila"><button className="boton">Guardar</button><button type="button" className="boton secundario" onClick={cerrar}>Cancelar</button></div>
    </form>
  );
}
