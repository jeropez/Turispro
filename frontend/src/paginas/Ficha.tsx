import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/cliente';
import { FranjaHoraria, PlanCompleto } from '../api/tipos';
import { cop, ETIQUETA_ESTADO, ETIQUETA_FRANJA, ETIQUETA_UNIDAD, ETIQUETA_VIAJERO, FRANJAS } from '../utilidades/formato';

export default function Ficha() {
  const { id } = useParams();
  const [p, setP] = useState<PlanCompleto | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<PlanCompleto>(`/planes/${id}/ficha`).then(setP).catch((e) => setError(e.message)); }, [id]);

  if (error) return <div className="aviso error">{error}</div>;
  if (!p) return <p className="centrado cargando">Cargando ficha</p>;
  const servicios = p.conceptos.filter((c) => c.unidad !== 'PERSONA');

  return (
    <>
      <div className="cabecera no-imprimir">
        <Link to="/planes" className="boton secundario pequeno">← Planes</Link>
        <div className="fila">
          <Link to={`/planes/${p.id}/editar`} className="boton secundario">Editar plan</Link>
          <button className="boton" onClick={() => window.print()}>Guardar en PDF</button>
        </div>
      </div>
      <article className="vidrio tarjeta">
        <span className={`insignia ${p.estado}`}>{ETIQUETA_ESTADO[p.estado]}</span>
        <h1 style={{ marginTop: '.5rem' }}>{p.nombre}</h1>
        {p.descripcion && <p>{p.descripcion}</p>}
        <div className="campos" style={{ margin: '1rem 0' }}>
          <div><strong>Destino</strong><br />{p.destinos ? `${p.destinos.nombre}, ${p.destinos.pais}` : '—'}</div>
          <div><strong>Duración</strong><br />{p.duracion_dias ?? '—'} días / {p.noches ?? '—'} noches</div>
          <div><strong>Viajeros</strong><br />{p.numero_viajeros ?? '—'}{p.tipo_viajero ? ` · ${ETIQUETA_VIAJERO[p.tipo_viajero]}` : ''}</div>
          <div><strong>Costo por persona</strong><br /><span className="total">{cop(p.costo_por_persona_cop)}</span></div>
        </div>

        <h2>Itinerario</h2>
        {p.dias.length === 0 ? <p className="suave">Aún no hay itinerario.</p> : p.dias.map((d) => (
          <div key={d.numero_dia} className="dia">
            <h3>Día {d.numero_dia}</h3>
            {d.actividades.length === 0 ? <p className="suave" style={{ margin: 0 }}>Sin actividades.</p> : (
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {FRANJAS.flatMap((fr: FranjaHoraria) => d.actividades.filter((a) => a.franja === fr).map((a, i) => <li key={fr + i}><strong>{ETIQUETA_FRANJA[fr]}:</strong> {a.recursos?.nombre ?? 'Actividad'}</li>))}
              </ul>
            )}
          </div>
        ))}

        {servicios.length > 0 && <><h2>Alojamiento y transporte</h2><ul>{servicios.map((s, i) => <li key={i}>{s.descripcion} ({s.cantidad} × {ETIQUETA_UNIDAD[s.unidad]})</li>)}</ul></>}

        <h2>Costos estimados (COP)</h2>
        <div className="tabla-scroll"><table>
          <thead><tr><th>Concepto</th><th className="num">Cantidad</th><th>Unidad</th><th className="num">Costo unitario</th><th className="num">Subtotal</th></tr></thead>
          <tbody>{p.conceptos.map((c, i) => <tr key={i}><td>{c.descripcion}</td><td className="num">{c.cantidad}</td><td>{ETIQUETA_UNIDAD[c.unidad]}</td><td className="num">{cop(c.costo_unitario_cop)}</td><td className="num">{cop(c.cantidad * c.costo_unitario_cop)}</td></tr>)}</tbody>
          <tfoot><tr><td colSpan={4}><strong>Total</strong></td><td className="num total">{cop(p.costo_total_cop)}</td></tr></tfoot>
        </table></div>
        <p className="pequeno suave">Valores estimados con tarifas de referencia. No son una cotización confirmada ni garantizan disponibilidad.</p>

        <div className="campos">
          <div><h2>Incluye</h2><p style={{ whiteSpace: 'pre-wrap' }}>{p.incluye || '—'}</p></div>
          <div><h2>No incluye</h2><p style={{ whiteSpace: 'pre-wrap' }}>{p.no_incluye || '—'}</p></div>
          <div className="ancho"><h2>Recomendaciones</h2><p style={{ whiteSpace: 'pre-wrap' }}>{p.recomendaciones || '—'}</p></div>
        </div>
      </article>
    </>
  );
}
