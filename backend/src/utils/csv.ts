const celda = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** CSV con BOM para que Excel respete las tildes. */
export function aCsv(columnas: string[], filas: Record<string, unknown>[], claves: string[]) {
  const lineas = [columnas.map(celda).join(','), ...filas.map((f) => claves.map((k) => celda(f[k])).join(','))];
  return '\uFEFF' + lineas.join('\n');
}
