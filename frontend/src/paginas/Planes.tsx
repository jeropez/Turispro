import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ErrorApi } from '../api/cliente';
import { EstadoPlan, PlanResumen } from '../api/tipos';
import { cop, ESTADOS, ETIQUETA_ESTADO, fecha } from '../utilidades/formato';

export default function Planes() {
  const [planes, setPlanes] = useState<PlanResumen[]>([]);
  const [estado, setEstado] = useState<'' | EstadoPlan>('');
  const [q, setQ] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pendientes, setPendientes] = useState<string[]>([]);

  const cargar = useCallback(async () => {
    const p = new URLSearchParams();
    if (estado) p.set('estado', estado);
    if (q.trim()) p.set('q', q.trim());
    try { setPlanes(await api<PlanResumen[]>('/planes?' + p)); setError(''); }
    catch (e: any) { setError(e.message); }
    finally { setCargando(false); }
  }, [estado, q]);
  useEffect(() => { const t = setTimeout(cargar, 250); return () => clearTimeout(t); }, [cargar]);

  const cambiar = async (id: string, accion: 'archivar' | 'volver-a-publicar') => {
    setPendientes([]); setError('');
    try { await api(`/planes/${id}/${accion}`, 'POST'); await cargar(); }
    catch (e) {
      const err = e as ErrorApi;
      if (err.detalle?.pendientes) { setPendientes(err.detalle.pendientes); setError(err.message + ' Ábrelo en el editor para completarlo.'); }
      else setError(err.message);
    }
  };

  return (
    <>
      <div className="cabecera">
        <h1>Planes turísticos</h1>
        <div className="fila">
          <Link to="/asistente" className="boton sol">✨ Crear con IA</Link>
          <Link to="/planes/nuevo" className="boton">+ Nuevo plan</Link>
        </div>
      </div>

      <div className="vidrio tarjeta">
        <div className="fila">
          <div style={{ flex: '1 1 240px' }}>
            <label htmlFor="busqueda">Buscar por nombre</label>
            <input id="busqueda" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. Cartagena" />
          </div>
          <div>
            <label>Estado</label>
            <div className="fila">
              <button className={`chip ${estado === '' ? 'activo' : ''}`} onClick={() => setEstado('')}>Todos</button>
              {ESTADOS.map((s) => <button key={s} className={`chip ${estado === s ? 'activo' : ''}`} onClick={() => setEstado(s)}>{ETIQUETA_ESTADO[s]}</button>)}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="aviso error" role="alert">{error}{pendientes.length > 0 && <ul>{pendientes.map((p) => <li key={p}>{p}</li>)}</ul>}</div>}
      {cargando ? <p className="centrado cargando">Cargando planes</p>
        : planes.length === 0 ? <div className="vidrio tarjeta centrado">No hay planes que coincidan. ¡Crea el primero!</div>
        : (
          <div className="rejilla">
            {planes.map((p) => (
              <article key={p.id} className="vidrio tarjeta" style={{ marginBottom: 0 }}>
                <div className="fila" style={{ justifyContent: 'space-between' }}>
                  <span className={`insignia ${p.estado}`}>{ETIQUETA_ESTADO[p.estado]}</span>
                  {p.origen_ia && <span className="pequeno" title="Creado con ayuda de IA">✨ IA</span>}
                </div>
                <h3 style={{ marginTop: '.5rem' }}>{p.nombre}</h3>
                <p className="suave" style={{ margin: '0 0 .4rem' }}>
                  {p.destinos ? `${p.destinos.nombre}, ${p.destinos.pais}` : 'Sin destino'} · {p.duracion_dias ?? '—'} días · {p.numero_viajeros ?? '—'} viajeros
                </p>
                <p style={{ margin: 0 }}><strong>{cop(p.costo_por_persona_cop)}</strong> <span className="suave pequeno">por persona</span></p>
                <p className="suave pequeno" style={{ margin: '.2rem 0 .8rem' }}>Actualizado {fecha(p.actualizado_en)}</p>
                <div className="fila">
                  <Link className="boton pequeno" to={`/planes/${p.id}/editar`}>{p.estado === 'BORRADOR' ? 'Editar y publicar' : 'Editar'}</Link>
                  <Link className="boton secundario pequeno" to={`/planes/${p.id}/ficha`}>Ficha</Link>
                  {p.estado === 'PUBLICADO' && <button className="boton sol pequeno" onClick={() => cambiar(p.id, 'archivar')}>Archivar</button>}
                  {p.estado === 'ARCHIVADO' && <button className="boton sol pequeno" onClick={() => cambiar(p.id, 'volver-a-publicar')}>Volver a publicar</button>}
                </div>
              </article>
            ))}
          </div>
        )}
    </>
  );
}
