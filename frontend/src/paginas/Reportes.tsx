import { useEffect, useState } from 'react';
import { api, descargar } from '../api/cliente';
import { Destino, EstadoPlan } from '../api/tipos';
import { cop, ESTADOS, ETIQUETA_ESTADO, fecha } from '../utilidades/formato';

interface PorEstado { resumen: { estado: EstadoPlan; cantidad: number }[]; detalle: { nombre: string; destino: string; estado: EstadoPlan; costo_total_cop: number; costo_por_persona_cop: number | null; actualizado_en: string }[] }
interface PorDestino { destino: string; planes: number; costo_total_promedio_cop: number; costo_por_persona_promedio_cop: number }

export default function Reportes() {
  const [tab, setTab] = useState<'estado' | 'destino'>('estado');
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [destinoId, setDestinoId] = useState('');
  const [estado, setEstado] = useState('');
  const [porEstado, setPorEstado] = useState<PorEstado | null>(null);
  const [porDestino, setPorDestino] = useState<PorDestino[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { api<Destino[]>('/destinos').then(setDestinos).catch(() => {}); }, []);
  const consulta = tab === 'estado' ? (destinoId ? `?destino_id=${destinoId}` : '') : (estado ? `?estado=${estado}` : '');
  const ruta = tab === 'estado' ? '/reportes/planes-por-estado' : '/reportes/costos-por-destino';

  useEffect(() => {
    setError('');
    if (tab === 'estado') api<PorEstado>(ruta + consulta).then(setPorEstado).catch((e) => setError(e.message));
    else api<PorDestino[]>(ruta + consulta).then(setPorDestino).catch((e) => setError(e.message));
  }, [tab, ruta, consulta]);

  const exportar = () => descargar(ruta + (consulta ? consulta + '&' : '?') + 'formato=csv', tab === 'estado' ? 'planes-por-estado.csv' : 'costos-por-destino.csv').catch((e) => setError(e.message));
  const max = Math.max(1, ...(porEstado?.resumen.map((r) => r.cantidad) ?? [1]));

  return (
    <>
      <div className="cabecera">
        <h1>Reportes</h1>
        <button className="boton" onClick={exportar}>Exportar CSV</button>
      </div>
      <div className="pasos">
        <button className={`chip ${tab === 'estado' ? 'activo' : ''}`} onClick={() => setTab('estado')}>Planes por estado</button>
        <button className={`chip ${tab === 'destino' ? 'activo' : ''}`} onClick={() => setTab('destino')}>Costos por destino</button>
      </div>
      <div className="vidrio tarjeta">
        {tab === 'estado'
          ? <div style={{ maxWidth: 320 }}><label htmlFor="fd">Destino</label><select id="fd" value={destinoId} onChange={(e) => setDestinoId(e.target.value)}><option value="">Todos</option>{destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></div>
          : <div style={{ maxWidth: 320 }}><label htmlFor="fe">Estado del plan</label><select id="fe" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos</option>{ESTADOS.map((s) => <option key={s} value={s}>{ETIQUETA_ESTADO[s]}</option>)}</select></div>}
      </div>
      {error && <div className="aviso error" role="alert">{error}</div>}

      {tab === 'estado' && porEstado && (
        <div className="vidrio tarjeta">
          <h2>Cantidad por estado</h2>
          {porEstado.resumen.map((r) => (
            <div key={r.estado} className="fila" style={{ marginBottom: '.5rem' }}>
              <span style={{ width: 100 }}><span className={`insignia ${r.estado}`}>{ETIQUETA_ESTADO[r.estado]}</span></span>
              <div className="barra-dato" style={{ width: `${(r.cantidad / max) * 60}%` }} /><strong>{r.cantidad}</strong>
            </div>
          ))}
          <div className="tabla-scroll" style={{ marginTop: '1rem' }}><table>
            <thead><tr><th>Plan</th><th>Destino</th><th>Estado</th><th className="num">Costo por persona</th><th>Actualizado</th></tr></thead>
            <tbody>{porEstado.detalle.length === 0 ? <tr><td colSpan={5} className="suave">No hay datos para mostrar.</td></tr>
              : porEstado.detalle.map((d, i) => <tr key={i}><td>{d.nombre}</td><td>{d.destino}</td><td><span className={`insignia ${d.estado}`}>{ETIQUETA_ESTADO[d.estado]}</span></td><td className="num">{cop(d.costo_por_persona_cop)}</td><td>{fecha(d.actualizado_en)}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}
      {tab === 'destino' && porDestino && (
        <div className="vidrio tarjeta tabla-scroll">
          <h2>Costos estimados por destino</h2>
          <table>
            <thead><tr><th>Destino</th><th className="num">Planes</th><th className="num">Total promedio</th><th className="num">Por persona (promedio)</th></tr></thead>
            <tbody>{porDestino.length === 0 ? <tr><td colSpan={4} className="suave">No hay datos para mostrar.</td></tr>
              : porDestino.map((d) => <tr key={d.destino}><td>{d.destino}</td><td className="num">{d.planes}</td><td className="num">{cop(d.costo_total_promedio_cop)}</td><td className="num">{cop(d.costo_por_persona_promedio_cop)}</td></tr>)}</tbody>
          </table>
          <p className="pequeno suave">Son estimaciones registradas en los planes; no representan ventas ni ingresos.</p>
        </div>
      )}
    </>
  );
}
