import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ErrorApi } from '../api/cliente';
import { Concepto, Destino, Dia, EstadoPlan, FranjaHoraria, PlanCompleto, Recurso, TipoViajero } from '../api/tipos';
import { calcularCostos, cop, ETIQUETA_ESTADO, ETIQUETA_FRANJA, ETIQUETA_UNIDAD, ETIQUETA_VIAJERO, FRANJAS, VIAJEROS } from '../utilidades/formato';

type N = number | '';
const aNum = (v: string): N => (v === '' ? '' : Number(v));
const PASOS = ['1 · Datos del viaje', '2 · Itinerario', '3 · Costos', '4 · Revisión'];

interface Datos {
  nombre: string; descripcion: string; destino_id: string; duracion_dias: N; noches: N; numero_viajeros: N;
  tipo_viajero: TipoViajero | ''; presupuesto: N; incluye: string; no_incluye: string; recomendaciones: string;
}
const VACIO: Datos = { nombre: '', descripcion: '', destino_id: '', duracion_dias: '', noches: '', numero_viajeros: '', tipo_viajero: '', presupuesto: '', incluye: '', no_incluye: '', recomendaciones: '' };

export default function Editor() {
  const { id: idRuta } = useParams();
  const ir = useNavigate();
  const [id, setId] = useState<string | null>(idRuta ?? null);
  const [estado, setEstado] = useState<EstadoPlan>('BORRADOR');
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [dias, setDias] = useState<Dia[]>([]);
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string; lista?: string[] } | null>(null);
  const [sel, setSel] = useState<Record<number, { recurso: string; franja: FranjaHoraria }>>({});
  const [alojSel, setAlojSel] = useState('');
  const [transSel, setTransSel] = useState('');

  const recursoPorId = useMemo(() => new Map(recursos.map((r) => [r.id, r])), [recursos]);
  const delDestino = (tipo: string) => recursos.filter((r) => r.tipo === tipo && r.destino_id === datos.destino_id);
  const viajeros = Number(datos.numero_viajeros) || 0;
  const { total, porPersona } = calcularCostos(conceptos, viajeros);

  const aplicarPlan = (p: PlanCompleto) => {
    setEstado(p.estado);
    setDatos({
      nombre: p.nombre, descripcion: p.descripcion ?? '', destino_id: p.destino_id ?? '', duracion_dias: p.duracion_dias ?? '', noches: p.noches ?? '',
      numero_viajeros: p.numero_viajeros ?? '', tipo_viajero: p.tipo_viajero ?? '', presupuesto: p.presupuesto_por_persona_cop ?? '',
      incluye: p.incluye ?? '', no_incluye: p.no_incluye ?? '', recomendaciones: p.recomendaciones ?? '',
    });
    setDias(p.dias.map((d) => ({ numero_dia: d.numero_dia, actividades: d.actividades.map((a) => ({ recurso_id: a.recurso_id, franja: a.franja, orden: a.orden, recursos: a.recursos })) })));
    setConceptos(p.conceptos.map((c) => ({ recurso_id: c.recurso_id, descripcion: c.descripcion, cantidad: Number(c.cantidad), unidad: c.unidad, costo_unitario_cop: Number(c.costo_unitario_cop) })));
  };

  useEffect(() => {
    (async () => {
      try {
        const [d, r] = await Promise.all([api<Destino[]>('/destinos'), api<Recurso[]>('/recursos')]);
        setDestinos(d); setRecursos(r);
        if (idRuta) aplicarPlan(await api<PlanCompleto>(`/planes/${idRuta}`));
      } catch (e: any) { setMsg({ tipo: 'error', texto: e.message }); }
      finally { setCargando(false); }
    })();
  }, [idRuta]);

  // ---------- Paso 1 ----------
  const cambiar = <K extends keyof Datos>(k: K, v: Datos[K]) => setDatos((d) => ({ ...d, [k]: v }));
  const cambiarDuracion = (v: string) => {
    const n = aNum(v);
    setDatos((d) => ({ ...d, duracion_dias: n, noches: n === '' ? '' : Math.max(n - 1, 0) }));
    if (n !== '' && n > 0) {
      setDias((prev) => {
        const nuevo = prev.slice(0, n);
        while (nuevo.length < n) nuevo.push({ numero_dia: nuevo.length + 1, actividades: [] });
        const usados = new Set(nuevo.flatMap((d) => d.actividades.map((a) => a.recurso_id)));
        setConceptos((cs) => cs.filter((c) => !(c.recurso_id && recursoPorId.get(c.recurso_id)?.tipo === 'ACTIVIDAD' && !usados.has(c.recurso_id))));
        return nuevo;
      });
    }
  };

  // ---------- Paso 2: itinerario ----------
  const agregarActividad = (i: number) => {
    const s = sel[i]; const r = s && recursoPorId.get(s.recurso);
    if (!s || !r) return;
    setDias((ds) => ds.map((d, k) => (k === i ? { ...d, actividades: [...d.actividades, { recurso_id: r.id, franja: s.franja ?? 'MANANA', orden: d.actividades.length, recursos: { nombre: r.nombre, tipo: r.tipo, costo_referencia_cop: r.costo_referencia_cop } }] } : d)));
    setConceptos((cs) => {
      const ya = cs.find((c) => c.recurso_id === r.id);
      if (ya) return cs.map((c) => (c === ya ? { ...c, cantidad: c.cantidad + (viajeros || 1) } : c));
      return [...cs, { recurso_id: r.id, descripcion: r.nombre, cantidad: viajeros || 1, unidad: r.unidad, costo_unitario_cop: r.costo_referencia_cop }];
    });
  };
  const quitarActividad = (i: number, j: number) => {
    const rid = dias[i].actividades[j].recurso_id;
    const quedan = dias.flatMap((d, k) => d.actividades.filter((_, m) => !(k === i && m === j))).filter((a) => a.recurso_id === rid).length;
    setDias((ds) => ds.map((d, k) => (k === i ? { ...d, actividades: d.actividades.filter((_, m) => m !== j) } : d)));
    setConceptos((cs) => (quedan === 0 ? cs.filter((c) => c.recurso_id !== rid) : cs.map((c) => (c.recurso_id === rid ? { ...c, cantidad: Math.max(c.cantidad - (viajeros || 1), 0) } : c))));
  };
  const mover = (i: number, j: number, delta: number) => setDias((ds) => ds.map((d, k) => {
    if (k !== i) return d;
    const a = [...d.actividades]; const t = j + delta;
    if (t < 0 || t >= a.length) return d;
    [a[j], a[t]] = [a[t], a[j]];
    return { ...d, actividades: a };
  }));
  const cambiarFranja = (i: number, j: number, f: FranjaHoraria) => setDias((ds) => ds.map((d, k) => (k === i ? { ...d, actividades: d.actividades.map((a, m) => (m === j ? { ...a, franja: f } : a)) } : d)));
  const agregarServicio = (rid: string, cantidad: number, limpiar: () => void) => {
    const r = recursoPorId.get(rid);
    if (!r || conceptos.some((c) => c.recurso_id === rid)) return;
    setConceptos((cs) => [...cs, { recurso_id: r.id, descripcion: r.nombre, cantidad, unidad: r.unidad, costo_unitario_cop: r.costo_referencia_cop }]);
    limpiar();
  };

  // ---------- Paso 3: costos ----------
  const editarConcepto = (i: number, cambio: Partial<Concepto>) => setConceptos((cs) => cs.map((c, k) => (k === i ? { ...c, ...cambio } : c)));
  const recalcular = () => setConceptos((cs) => cs.map((c) => {
    const r = c.recurso_id ? recursoPorId.get(c.recurso_id) : undefined;
    if (!r) return c;
    if (r.tipo === 'ACTIVIDAD') return { ...c, cantidad: dias.flatMap((d) => d.actividades).filter((a) => a.recurso_id === r.id).length * (viajeros || 1) };
    if (r.tipo === 'ALOJAMIENTO') return { ...c, cantidad: Math.max(Number(datos.noches) || 1, 1) };
    return c;
  }));

  // ---------- Guardado y estados ----------
  const cuerpoDatos = () => ({
    nombre: datos.nombre.trim(), descripcion: datos.descripcion || null, destino_id: datos.destino_id || null,
    duracion_dias: datos.duracion_dias === '' ? null : datos.duracion_dias, noches: datos.noches === '' ? null : datos.noches,
    numero_viajeros: datos.numero_viajeros === '' ? null : datos.numero_viajeros, tipo_viajero: datos.tipo_viajero || null,
    presupuesto_por_persona_cop: datos.presupuesto === '' ? null : datos.presupuesto,
    incluye: datos.incluye || null, no_incluye: datos.no_incluye || null, recomendaciones: datos.recomendaciones || null,
  });
  const validarLocal = (): string | null => {
    if (!datos.nombre.trim()) return 'Escribe un nombre para identificar el plan.';
    if (datos.duracion_dias !== '' && datos.duracion_dias < 1) return 'La duración debe ser un número positivo.';
    if (datos.numero_viajeros !== '' && datos.numero_viajeros < 1) return 'El número de viajeros debe ser positivo.';
    if (datos.presupuesto !== '' && datos.presupuesto < 0) return 'El presupuesto no puede ser negativo.';
    if (conceptos.some((c) => c.cantidad < 0 || c.costo_unitario_cop < 0)) return 'Las cantidades y los costos no pueden ser negativos.';
    if (conceptos.some((c) => !c.descripcion.trim())) return 'Cada concepto de costo necesita una descripción.';
    return null;
  };
  const guardar = async (): Promise<string | null> => {
    const e = validarLocal();
    if (e) { setMsg({ tipo: 'error', texto: e }); return null; }
    setGuardando(true); setMsg(null);
    let pid = id;
    try {
      if (!pid) { pid = (await api<PlanCompleto>('/planes', 'POST', cuerpoDatos())).id; setId(pid); window.history.replaceState(null, '', `/planes/${pid}/editar`); }
      const p = await api<PlanCompleto>(`/planes/${pid}`, 'PUT', {
        ...cuerpoDatos(),
        dias: dias.map((d) => ({ numero_dia: d.numero_dia, actividades: d.actividades.map((a, i) => ({ recurso_id: a.recurso_id, franja: a.franja, orden: i })) })),
        conceptos: conceptos.map((c) => ({ ...c, cantidad: Number(c.cantidad), costo_unitario_cop: Number(c.costo_unitario_cop) })),
      });
      setEstado(p.estado);
      return pid;
    } catch (err) {
      const x = err as ErrorApi; setMsg({ tipo: 'error', texto: x.message, lista: x.detalle?.pendientes ?? (Array.isArray(x.detalle) ? x.detalle : undefined) });
      return null;
    } finally { setGuardando(false); }
  };
  const soloGuardar = async () => { if (await guardar()) setMsg({ tipo: 'ok', texto: 'Plan guardado. Tus datos quedaron a salvo.' }); };
  const revisar = async () => {
    const pid = await guardar(); if (!pid) return;
    const r = await api<{ pendientes: string[] }>(`/planes/${pid}/validacion`);
    setMsg(r.pendientes.length ? { tipo: 'error', texto: 'Aún faltan cosas para publicar:', lista: r.pendientes } : { tipo: 'ok', texto: '¡Todo listo! El plan cumple las validaciones para publicarse.' });
  };
  const transicion = async (accion: 'publicar' | 'archivar' | 'volver-a-publicar', textoOk: string) => {
    const pid = await guardar(); if (!pid) return;
    try {
      const p = await api<PlanCompleto>(`/planes/${pid}/${accion}`, 'POST');
      setEstado(p.estado); setMsg({ tipo: 'ok', texto: textoOk });
    } catch (err) { const x = err as ErrorApi; setMsg({ tipo: 'error', texto: x.message, lista: x.detalle?.pendientes }); }
  };

  if (cargando) return <p className="centrado cargando">Cargando editor</p>;
  const servicios = conceptos.filter((c) => c.recurso_id && recursoPorId.get(c.recurso_id)?.tipo !== 'ACTIVIDAD' && recursoPorId.get(c.recurso_id));

  return (
    <>
      <div className="cabecera">
        <div>
          <h1>{id ? 'Editar plan' : 'Nuevo plan'}</h1>
          <span className={`insignia ${estado}`}>{ETIQUETA_ESTADO[estado]}</span>
        </div>
        <div className="fila">
          {id && <Link to={`/planes/${id}/ficha`} className="boton secundario">Ver ficha</Link>}
          <Link to="/planes" className="boton secundario">Volver a planes</Link>
        </div>
      </div>

      <div className="pasos">{PASOS.map((t, i) => <button key={t} className={`chip ${paso === i ? 'activo' : ''}`} onClick={() => setPaso(i)} aria-current={paso === i}>{t}</button>)}</div>
      {msg && <div className={`aviso ${msg.tipo}`} role={msg.tipo === 'error' ? 'alert' : 'status'}>{msg.texto}{msg.lista && <ul>{msg.lista.map((l) => <li key={l}>{l}</li>)}</ul>}</div>}

      {paso === 0 && (
        <section className="vidrio tarjeta">
          <h2>Datos del viaje</h2>
          <div className="campos">
            <div className="ancho"><label htmlFor="nombre">Nombre del plan *</label><input id="nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej. Cartagena romántica 4 días" /></div>
            <div className="ancho"><label htmlFor="desc">Descripción</label><textarea id="desc" value={datos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} /></div>
            <div><label htmlFor="dest">Destino</label>
              <select id="dest" value={datos.destino_id} onChange={(e) => cambiar('destino_id', e.target.value)}><option value="">Selecciona…</option>{destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}, {d.pais}</option>)}</select></div>
            <div><label htmlFor="dur">Duración (días)</label><input id="dur" type="number" min={1} value={datos.duracion_dias} onChange={(e) => cambiarDuracion(e.target.value)} /></div>
            <div><label htmlFor="noc">Noches</label><input id="noc" type="number" min={0} value={datos.noches} onChange={(e) => cambiar('noches', aNum(e.target.value))} /></div>
            <div><label htmlFor="via">Número de viajeros</label><input id="via" type="number" min={1} value={datos.numero_viajeros} onChange={(e) => cambiar('numero_viajeros', aNum(e.target.value))} /></div>
            <div><label htmlFor="tip">Tipo de viajero</label>
              <select id="tip" value={datos.tipo_viajero} onChange={(e) => cambiar('tipo_viajero', e.target.value as TipoViajero | '')}><option value="">Selecciona…</option>{VIAJEROS.map((v) => <option key={v} value={v}>{ETIQUETA_VIAJERO[v]}</option>)}</select></div>
            <div><label htmlFor="pre">Presupuesto por persona (COP)</label><input id="pre" type="number" min={0} value={datos.presupuesto} onChange={(e) => cambiar('presupuesto', aNum(e.target.value))} /></div>
            <div className="ancho"><label htmlFor="inc">Incluye</label><textarea id="inc" value={datos.incluye} onChange={(e) => cambiar('incluye', e.target.value)} /></div>
            <div className="ancho"><label htmlFor="noi">No incluye</label><textarea id="noi" value={datos.no_incluye} onChange={(e) => cambiar('no_incluye', e.target.value)} /></div>
            <div className="ancho"><label htmlFor="rec">Recomendaciones</label><textarea id="rec" value={datos.recomendaciones} onChange={(e) => cambiar('recomendaciones', e.target.value)} /></div>
          </div>
        </section>
      )}

      {paso === 1 && (
        <section className="vidrio tarjeta">
          <h2>Itinerario por días</h2>
          {!datos.destino_id && <div className="aviso">Selecciona un destino en el paso 1 para ver sus actividades.</div>}
          {dias.length === 0 && <div className="aviso">Indica la duración en el paso 1 para crear los días del itinerario.</div>}
          {dias.map((d, i) => (
            <div className="dia" key={d.numero_dia}>
              <h3>Día {d.numero_dia}</h3>
              {d.actividades.length === 0 && <p className="suave pequeno">Sin actividades todavía.</p>}
              {d.actividades.map((a, j) => (
                <div key={j} className="fila" style={{ marginBottom: '.4rem' }}>
                  <select aria-label="Franja horaria" style={{ width: 120 }} value={a.franja} onChange={(e) => cambiarFranja(i, j, e.target.value as FranjaHoraria)}>{FRANJAS.map((f) => <option key={f} value={f}>{ETIQUETA_FRANJA[f]}</option>)}</select>
                  <span style={{ flex: 1, minWidth: 160 }}>{recursoPorId.get(a.recurso_id)?.nombre ?? a.recursos?.nombre}</span>
                  <button className="boton secundario pequeno" aria-label="Subir" onClick={() => mover(i, j, -1)} disabled={j === 0}>↑</button>
                  <button className="boton secundario pequeno" aria-label="Bajar" onClick={() => mover(i, j, 1)} disabled={j === d.actividades.length - 1}>↓</button>
                  <button className="boton sol pequeno" onClick={() => quitarActividad(i, j)}>Quitar</button>
                </div>
              ))}
              <div className="fila" style={{ marginTop: '.5rem' }}>
                <select aria-label={`Actividad para el día ${d.numero_dia}`} style={{ flex: 1, minWidth: 200 }} value={sel[i]?.recurso ?? ''} onChange={(e) => setSel({ ...sel, [i]: { recurso: e.target.value, franja: sel[i]?.franja ?? 'MANANA' } })}>
                  <option value="">Agregar actividad…</option>{delDestino('ACTIVIDAD').map((r) => <option key={r.id} value={r.id}>{r.nombre} · {cop(r.costo_referencia_cop)}</option>)}
                </select>
                <select aria-label="Franja" style={{ width: 120 }} value={sel[i]?.franja ?? 'MANANA'} onChange={(e) => setSel({ ...sel, [i]: { recurso: sel[i]?.recurso ?? '', franja: e.target.value as FranjaHoraria } })}>{FRANJAS.map((f) => <option key={f} value={f}>{ETIQUETA_FRANJA[f]}</option>)}</select>
                <button className="boton pequeno" disabled={!sel[i]?.recurso} onClick={() => { agregarActividad(i); setSel({ ...sel, [i]: { recurso: '', franja: sel[i]?.franja ?? 'MANANA' } }); }}>Agregar</button>
              </div>
            </div>
          ))}

          <h2 style={{ marginTop: '1.2rem' }}>Alojamiento y transporte</h2>
          <div className="campos">
            <div><label htmlFor="aloj">Alojamiento</label>
              <div className="fila"><select id="aloj" style={{ flex: 1 }} value={alojSel} onChange={(e) => setAlojSel(e.target.value)}><option value="">Selecciona…</option>{delDestino('ALOJAMIENTO').map((r) => <option key={r.id} value={r.id}>{r.nombre} · {cop(r.costo_referencia_cop)}</option>)}</select>
                <button className="boton pequeno" disabled={!alojSel} onClick={() => agregarServicio(alojSel, Math.max(Number(datos.noches) || 1, 1), () => setAlojSel(''))}>Agregar</button></div></div>
            <div><label htmlFor="trans">Transporte</label>
              <div className="fila"><select id="trans" style={{ flex: 1 }} value={transSel} onChange={(e) => setTransSel(e.target.value)}><option value="">Selecciona…</option>{delDestino('TRANSPORTE').map((r) => <option key={r.id} value={r.id}>{r.nombre} · {cop(r.costo_referencia_cop)}</option>)}</select>
                <button className="boton pequeno" disabled={!transSel} onClick={() => agregarServicio(transSel, 1, () => setTransSel(''))}>Agregar</button></div></div>
          </div>
          {servicios.length > 0 && <ul>{servicios.map((c, i) => <li key={i}>{c.descripcion} <button className="boton sol pequeno" onClick={() => setConceptos((cs) => cs.filter((x) => x !== c))}>Quitar</button></li>)}</ul>}
        </section>
      )}

      {paso === 2 && (
        <section className="vidrio tarjeta">
          <h2>Costos estimados (COP)</h2>
          <div className="tabla-scroll"><table>
            <thead><tr><th>Concepto</th><th className="num">Cantidad</th><th>Unidad</th><th className="num">Costo unitario</th><th className="num">Subtotal</th><th /></tr></thead>
            <tbody>
              {conceptos.length === 0 && <tr><td colSpan={6} className="suave">Aún no hay conceptos. Agrega actividades, alojamiento o transporte en el paso 2, o un concepto manual.</td></tr>}
              {conceptos.map((c, i) => (
                <tr key={i}>
                  <td>{c.recurso_id ? c.descripcion : <input aria-label="Descripción" value={c.descripcion} onChange={(e) => editarConcepto(i, { descripcion: e.target.value })} />}</td>
                  <td className="num"><input aria-label="Cantidad" type="number" min={0} value={c.cantidad} onChange={(e) => editarConcepto(i, { cantidad: Number(e.target.value) })} /></td>
                  <td>{ETIQUETA_UNIDAD[c.unidad]}</td>
                  <td className="num"><input aria-label="Costo unitario" type="number" min={0} value={c.costo_unitario_cop} onChange={(e) => editarConcepto(i, { costo_unitario_cop: Number(e.target.value) })} /></td>
                  <td className="num">{cop(c.cantidad * c.costo_unitario_cop)}</td>
                  <td><button className="boton sol pequeno" onClick={() => setConceptos((cs) => cs.filter((_, k) => k !== i))}>Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="fila" style={{ margin: '.8rem 0' }}>
            <button className="boton secundario pequeno" onClick={() => setConceptos((cs) => [...cs, { recurso_id: null, descripcion: '', cantidad: 1, unidad: 'SERVICIO', costo_unitario_cop: 0 }])}>+ Concepto manual</button>
            <button className="boton secundario pequeno" onClick={recalcular} title="Ajusta cantidades de actividades y noches según el itinerario y los viajeros">Recalcular cantidades</button>
          </div>
          <p className="total">Total: {cop(total)} · Por persona: {cop(porPersona)}</p>
          {datos.presupuesto !== '' && porPersona !== null && (porPersona > Number(datos.presupuesto)
            ? <div className="aviso error">El costo por persona supera el presupuesto de {cop(Number(datos.presupuesto))}.</div>
            : <div className="aviso ok">El costo por persona está dentro del presupuesto de {cop(Number(datos.presupuesto))}.</div>)}
          <p className="pequeno suave">El costo unitario se copia de la tarifa del catálogo. Si el catálogo cambia después, este plan conserva sus valores.</p>
        </section>
      )}

      {paso === 3 && (
        <section className="vidrio tarjeta">
          <h2>Revisión</h2>
          <ul>
            <li><strong>{datos.nombre || 'Sin nombre'}</strong> · {destinos.find((d) => d.id === datos.destino_id)?.nombre ?? 'sin destino'} · {datos.duracion_dias || '—'} días · {datos.numero_viajeros || '—'} viajeros</li>
            <li>Itinerario: {dias.length} día(s), {dias.reduce((s, d) => s + d.actividades.length, 0)} actividad(es)</li>
            <li>Costo total {cop(total)} · por persona {cop(porPersona)}</li>
          </ul>
          <div className="fila">
            <button className="boton secundario" onClick={soloGuardar} disabled={guardando}>{estado === 'BORRADOR' ? 'Guardar borrador' : 'Guardar cambios'}</button>
            <button className="boton secundario" onClick={revisar} disabled={guardando}>Guardar y validar</button>
            {estado === 'BORRADOR' && <button className="boton" onClick={() => transicion('publicar', '¡Plan publicado! Ya aparece entre los planes publicados.')} disabled={guardando}>Publicar</button>}
            {estado === 'PUBLICADO' && <button className="boton sol" onClick={() => transicion('archivar', 'El plan fue archivado.')} disabled={guardando}>Archivar</button>}
            {estado === 'ARCHIVADO' && <button className="boton" onClick={() => transicion('volver-a-publicar', 'El plan volvió a publicarse.')} disabled={guardando}>Volver a publicar</button>}
          </div>
          <p className="pequeno suave">Editar no cambia el estado del plan. Para publicar se valida: datos básicos, itinerario con tantos días como la duración (con actividades) y costos calculables.</p>
        </section>
      )}

      {paso !== 3 && <div className="fila"><button className="boton" onClick={soloGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        <button className="boton secundario" onClick={() => setPaso(paso + 1)}>Siguiente →</button></div>}
    </>
  );
}
