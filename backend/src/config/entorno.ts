import 'dotenv/config';
import { z } from 'zod';

const esquema = z.object({
  PUERTO: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  JWT_SECRETO: z.string().min(32, 'JWT_SECRETO debe tener al menos 32 caracteres'),
  JWT_EXPIRA: z.string().default('8h'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODELO: z.string().default('llama-3.3-70b-versatile'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  console.error('Variables de entorno inválidas o faltantes (revisa backend/.env):');
  console.error(resultado.error.flatten().fieldErrors);
  process.exit(1);
}
export const entorno = resultado.data;
