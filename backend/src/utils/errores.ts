export class ErrorApp extends Error {
  constructor(public estado: number, mensaje: string, public detalle?: unknown) {
    super(mensaje);
  }
}
