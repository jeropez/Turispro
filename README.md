# 🌊 TurisPro · Módulo 1: Diseñador inteligente de planes turísticos

MVP de TurisPro: permite crear, administrar, consultar y publicar planes turísticos, con apoyo de IA para proponer itinerarios.
Implementa las historias HU01–HU14 y es coherente con los diagramas de `docs/diagramas`.

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript (Vite), estilo Frutiger Aero |
| Backend | Node.js + TypeScript + Express, arquitectura por capas |
| Datos | Supabase (PostgreSQL) |
| Seguridad | JWT propio (bcrypt + `jsonwebtoken`) |
| IA | GroqCloud (API compatible con OpenAI, modo JSON) |

## Estructura

```
turispro/
├── backend/src/
│   ├── rutas/            → define los endpoints (/api/...)
│   ├── controladores/    → traducen HTTP ↔ servicios (sin lógica de negocio)
│   ├── servicios/        → lógica de negocio (estados, validaciones, IA, reportes)
│   ├── repositorios/     → único lugar que habla con Supabase
│   ├── dominio/          → tipos y reglas puras (costos, validación de publicación)
│   ├── middlewares/      → autenticación JWT, validación (zod), errores
│   └── scripts/crearAdmin.ts
├── frontend/src/         → páginas, componentes, cliente de la API y estilos
├── supabase/
│   ├── migrations/001_modelo_de_datos.sql
│   └── seed.sql          → destinos y recursos de ejemplo (Incremento 1)
└── docs/                 → historias de usuario, story map y diagramas (.drawio)
```

Flujo de una petición: `ruta → middleware (JWT, validación) → controlador → servicio → repositorio → Supabase`.

## Puesta en marcha

Requisitos: Node 20+ y un proyecto en [Supabase](https://supabase.com).

**1. Base de datos.** En el *SQL Editor* de Supabase ejecuta, en orden, `supabase/migrations/001_modelo_de_datos.sql` y luego `supabase/seed.sql`.

**2. Backend.**
```bash
cd backend
npm install
cp .env.example .env        # completa SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRETO y GROQ_API_KEY
npm run crear-admin -- "Tu Nombre" tu@correo.com "UnaContraseñaLarga123"
npm run dev                 # http://localhost:4000
```
Genera el `JWT_SECRETO` con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

**3. Frontend.**
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173  (redirige /api al backend)
```

**Pruebas del backend:** `cd backend && npm test` (reglas de costos y de publicación).

> ⚠️ **Claves.** `backend/.env` está en `.gitignore`: no lo subas. La `service_role` de Supabase y la `GROQ_API_KEY` solo viven en el backend. Si alguna clave se pegó en un chat o en un commit, regénerala.

## Trazabilidad: historias ↔ código

| HU | Qué hace | Pantalla | Endpoint | Servicio |
|---|---|---|---|---|
| HU01 | Iniciar y cerrar sesión (sin registro público) | Login | `POST /api/auth/login`, `GET /api/auth/yo` | `authServicio` |
| HU02 | Consultar y filtrar planes | Planes | `GET /api/planes?estado=&q=` | `planServicio.listar` |
| HU03 | Crear un borrador | Editor · paso 1 | `POST /api/planes` | `planServicio.crear` |
| HU04 | Retomar y editar un plan | Editor | `GET/PUT /api/planes/:id` | `planServicio.actualizar` |
| HU05 | Organizar el itinerario manual | Editor · paso 2 | `PUT /api/planes/:id` (días, actividades) | `planRepo.reemplazarItinerario` |
| HU06 | Calcular costos estimados | Editor · paso 3 | (se calcula al leer/guardar) | `dominio/costos.ts` |
| HU07 | Gestionar destinos | Recursos | `GET/POST/PUT /api/destinos` | `catalogoServicio` |
| HU08 | Gestionar alojamientos, actividades y transportes | Recursos | `GET/POST/PUT /api/recursos` | `catalogoServicio` |
| HU09 | Solicitar propuesta con IA | Asistente IA | `POST /api/ia/propuesta` | `iaServicio.generarPropuesta` |
| HU10 | Revisar y usar la propuesta (queda en Borrador) | Asistente → Editor | `POST /api/ia/usar` | `iaServicio.usarPropuesta` |
| HU11 | Ficha descriptiva y PDF | Ficha | `GET /api/planes/:id/ficha` | `planServicio.ficha` |
| HU12 | Validar y publicar | Editor · paso 4 | `GET …/validacion`, `POST …/publicar` | `dominio/validacion.ts` |
| HU13 | Archivar y volver a publicar | Planes / Editor | `POST …/archivar`, `POST …/volver-a-publicar` | `planServicio` |
| HU14 | Reportes y CSV | Reportes | `GET /api/reportes/*?formato=csv` | `reporteServicio` |

## Decisiones de diseño (y cómo se reflejan en el código)

- **Estados del plan** (`docs/diagramas`, diagrama de estados): `BORRADOR → PUBLICADO → ARCHIVADO → PUBLICADO`. Editar nunca cambia el estado; no hay eliminación definitiva ni transición de Publicado a Borrador. Está en `planServicio` (cada transición verifica el estado de origen y responde 409 si no corresponde).
- **La IA sugiere, el sistema calcula.** `iaServicio` envía a Groq solo los recursos registrados del destino; descarta cualquier id que no exista en el catálogo y calcula el costo con `dominio/costos.ts`. La propuesta no se guarda hasta que se usa (HU10) y entonces se vuelve a calcular en el servidor. Si la IA falla o no hay recursos, el mensaje lleva a la ruta manual.
- **Tarifa congelada.** `conceptos_costo.costo_unitario_cop` es una copia de la tarifa del catálogo: cambiarla no altera planes ya guardados (criterio de HU06).
- **Alojamiento y transporte** quedan como conceptos de costo del plan (sin relación directa plan–recurso), como indica la nota del diagrama de clases.
- **Seguridad.** Contraseñas con bcrypt; JWT HS256 con vencimiento; límite de intentos en el login; validación de entradas con zod; `helmet` y CORS restringido. Las tablas tienen RLS activado sin políticas, así que la API pública de Supabase no puede leerlas: solo el backend (clave de servicio).

## Supuestos y pendientes (para confirmar con el equipo y el docente)

1. **Datos obligatorios para publicar (HU12):** se asumió nombre, destino, duración, viajeros y tipo de viajero; además, tantos días como la duración (cada uno con al menos una actividad) y al menos un concepto de costo. Está centralizado en `backend/src/dominio/validacion.ts`.
2. **Rol único de administrador:** pendiente de confirmar con el docente si cumple el requisito de control básico de roles.
3. **Guardado sin transacción:** al guardar un plan, el backend reemplaza itinerario y conceptos en varias llamadas a Supabase. Si una falla a mitad, el plan puede quedar parcialmente guardado. Mejora recomendada: una función SQL (RPC) transaccional.
4. **JWT en `localStorage`:** es simple, pero queda expuesto si hay XSS. Alternativa más segura: cookie `HttpOnly`.
5. **Modelo de IA:** configurable en `GROQ_MODELO` (por defecto `llama-3.3-70b-versatile`). Los modelos de Groq se renuevan: confirma el ID vigente en console.groq.com/docs/models.
6. **Nombre «TurisPro»:** reemplaza al nombre provisional «Brisa» usado en los documentos iniciales.
