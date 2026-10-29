import { createClient } from '@supabase/supabase-js';
import { entorno } from './entorno';

// Solo el backend usa la clave de servicio. Nunca debe llegar al frontend.
export const supabase = createClient(entorno.SUPABASE_URL, entorno.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
