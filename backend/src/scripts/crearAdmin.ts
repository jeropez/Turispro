// Uso: npm run crear-admin -- "Nombre" correo@empresa.com "ContraseñaSegura123"
// Las cuentas las crea la empresa; la aplicación no tiene registro público (HU01).
import bcrypt from 'bcryptjs';
import { administradorRepo } from '../repositorios/administradorRepo';

(async () => {
  const [nombre, correo, contrasena] = process.argv.slice(2);
  if (!nombre || !correo || !contrasena || contrasena.length < 10) {
    console.error('Uso: npm run crear-admin -- "Nombre" correo@empresa.com "Contraseña (mín. 10 caracteres)"');
    process.exit(1);
  }
  const creado = await administradorRepo.crear({ nombre, correo, contrasena_hash: await bcrypt.hash(contrasena, 12) });
  console.log('Administrador creado:', creado);
})().catch((e) => { console.error(e.message ?? e); process.exit(1); });
