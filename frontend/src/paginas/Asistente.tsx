import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/cliente';
import { Destino, PlanCompleto, Propuesta, TipoViajero } from '../api/tipos';
import { cop, ETIQUETA_FRANJA, ETIQUETA_VIAJERO, VIAJEROS } from '../utilidades/formato';

const INTERESES = ['Playa', 'Cultura', 'Gastronomía', 'Aventura', 'Naturaleza', 'Descanso', 'Historia', 'Vida nocturna'];

export default function Asistente() {
  const ir = useNavigate();
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [f, setF] = useState({ destino_id: '', duracion_dias: 4, numero_viajeros: 2, tipo_viajero: 'PAREJAS' as TipoViajero, presupuesto: 1500000 });
  const [intereses, setIntereses] = useState<string[]>([]);
  const [generando, setGenerando] = useState(false);
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [error, setError] = useState('');
  const [usando, setUsando] = useState(false);

  useEffect(() => { api<Destino[]>('/destinos').then(setDestinos).catch((e) => setError(e.message)); }, []);

  const generar = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setPropuesta(null); setGenerando(true);
    try {
      setPropuesta(await api<Propuesta>('/ia/propuesta', 'POST', {
        destino_id: f.destino_id, duracion_dias: f.duracion_dias, numero_viajeros: f.numero_viajeros,
        tipo_viajero: f.tipo_viajero, presupuesto_por_persona_cop: f.presupuesto, intereses,
      }));
    } catch (err: any) { setError(err.message); }
    finally { setGenerando(false); }
  };

  const usar = async () => {
    if (!propuesta) return;
    setUsando(true); setError('');
    try {
      const plan = await api<PlanCompleto>('/ia/usar', 'POST', {
        destino_id: propuesta.destino_id, duracion_dias: propuesta.duracion_dias, numero_viajeros: propuesta.numero_viajeros,
        tipo_viajero: propuesta.tipo_viajero, presupuesto_por_persona_cop: propuesta.presupuesto_por_persona_cop,
        dias: propuesta.dias.map((d) => ({ numero_dia: d.numero_dia, actividades: d.actividades.map((a) => ({ recurso_id: a.recurso_id, franja: a.franja })) })),
        alojamiento_id: propuesta.alojamiento?.recurso_id ?? null, transporte_id: propuesta.transporte?.recurso_id ?? null,
        recomendaciones: propuesta.recomendaciones, incluye: propuesta.incluye, no_incluye: propuesta.no_incluye,
      });
      ir(`/planes/${plan.id}/editar`);
    } catch (err: any) { setError(err.message); setUsando(false); }
  };

  const alternar = (i: string) => setIntereses((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]));

  return (
    <>
      <div className="cabecera"><h1>✨ Asistente de itinerarios</h1></div>
      <form className="vidrio tarjeta" onSubmit={generar}>
        <p className="suave" style={{ marginTop: 0 }}>La IA sugiere el itinerario con los recursos registrados del destino. El costo lo calcula el sistema con las tarifas del catálogo.</p>
        <div className="campos">
          <div><label htmlFor="d">Destino</label>
            <select id="d" required value={f.destino_id} onChange={(e) => setF({ ...f, destino_id: e.target.value })}>
              <option value="">Selecciona…</option>{destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}, {d.pais}</option>)}
            </select></div>
          <div><label htmlFor="n">Duración (días)</label><input id="n" type="number" min={1} max={30} required value={f.duracion_dias} onChange={(e) => setF({ ...f, duracion_dias: Number(e.target.value) })} /></div>
          <div><label htmlFor="v">Número de viajeros</label><input id="v" type="number" min={1} required value={f.numero_viajeros} onChange={(e) => setF({ ...f, numero_viajeros: Number(e.target.value) })} /></div>
          <div><label htmlFor="t">Tipo de viajero</label>
            <select id="t" value={f.tipo_viajero} onChange={(e) => setF({ ...f, tipo_viajero: e.target.value as TipoViajero })}>{VIAJEROS.map((v) => <option key={v} value={v}>{ETIQUETA_VIAJERO[v]}</option>)}</select></div>
          <div><label htmlFor="p">Presupuesto por persona (COP)</label><input id="p" type="number" min={1} required value={f.presupuesto} onChange={(e) => setF({ ...f, presupuesto: Number(e.target.value) })} /></div>
          <div className="ancho"><label>Intereses</label>
            <div className="fila">{INTERESES.map((i) => <button type="button" key={i} className={`chip ${intereses.includes(i) ? 'activo' : ''}`} aria-pressed={intereses.includes(i)} onClick={() => alternar(i)}>{i}</button>)}</div></div>
        </div>
        <p style={{ marginBottom: 0 }}><button className="boton" disabled={generando}>{generando ? 'Pensando el itinerario…' : 'Proponer itinerario'}</button></p>
      </form>

      {error && (
        <div className="aviso error" role="alert">
          {error}
          <p style={{ margin: '.5rem 0 0' }}><Link to="/planes/nuevo" className="boton secundario pequeno">Ir a la ruta manual</Link></p>
        </div>
      )}

      {propuesta && (
        <section className="vidrio tarjeta" aria-live="polite">
          <h2>Propuesta para {propuesta.destino_nombre}</h2>
          <div className="fila" style={{ marginBottom: '.8rem' }}>
            <span className="total">{cop(propuesta.costo_por_persona_cop)} <span className="pequeno suave">por persona</span></span>
            <span className="suave">· Total {cop(propuesta.costo_total_cop)}</span>
          </div>
          {propuesta.supera_presupuesto
            ? <div className="aviso error">El costo estimado supera tu presupuesto de {cop(propuesta.presupuesto_por_persona_cop)} por persona. Puedes ajustar la propuesta al editarla.</div>
            : <div className="aviso ok">El costo estimado está dentro de tu presupuesto de {cop(propuesta.presupuesto_por_persona_cop)} por persona.</div>}
          {propuesta.dias.map((d) => (
            <div key={d.numero_dia} className="dia">
              <h3>Día {d.numero_dia}</h3>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{d.actividades.map((a, i) => <li key={i}><strong>{ETIQUETA_FRANJA[a.franja]}:</strong> {a.nombre}</li>)}</ul>
            </div>
          ))}
          <p><strong>Alojamiento:</strong> {propuesta.alojamiento?.nombre ?? 'No sugerido'} · <strong>Transporte:</strong> {propuesta.transporte?.nombre ?? 'No sugerido'}</p>
          {propuesta.recomendaciones && <p><strong>Recomendaciones:</strong> {propuesta.recomendaciones}</p>}
          <p className="pequeno suave">Esta propuesta aún no se ha guardado ni publicado. Al usarla se crea un borrador que puedes ajustar.</p>
          <button className="boton" onClick={usar} disabled={usando}>{usando ? 'Creando borrador…' : 'Usar y editar'}</button>
        </section>
      )}
    </>
  );
}
