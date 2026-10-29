import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { entorno } from '../config/entorno';
import { administradorRepo } from '../repositorios/administradorRepo';
import { ErrorApp } from '../utils/errores';

// Hash de relleno para que el tiempo de respuesta no revele si el correo existe.
const HASH_RELLENO = bcrypt.hashSync('relleno-no-valido', 10);

export const authServicio = {
  /** HU01: inicia sesión con una cuenta creada por la empresa (no hay registro público). */
  async iniciarSesion(correo: string, contrasena: string) {
    const admin = await administradorRepo.buscarPorCorreo(correo);
    const valido = await bcrypt.compare(contrasena, admin?.contrasena_hash ?? HASH_RELLENO);
    if (!admin || !valido) throw new ErrorApp(401, 'Correo o contraseña incorrectos.');
    const token = jwt.sign({ nombre: admin.nombre }, entorno.JWT_SECRETO, {
      subject: admin.id,
      algorithm: 'HS256',
      expiresIn: entorno.JWT_EXPIRA as jwt.SignOptions['expiresIn'],
    });
    return { token, administrador: { id: admin.id, nombre: admin.nombre, correo: admin.correo } };
  },
};
