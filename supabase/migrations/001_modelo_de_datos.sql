-- TurisPro · Módulo 1 · Modelo de datos (corresponde al diagrama de clases)
-- Ejecutar en el SQL Editor de Supabase o con la CLI (supabase db push).

create extension if not exists "pgcrypto";

-- Enumerados (EstadoPlan, TipoViajero, UnidadCosto, FranjaHoraria y tipo de Recurso)
create type estado_plan    as enum ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');
create type tipo_viajero   as enum ('FAMILIAS', 'ADULTOS', 'PAREJAS', 'GRUPOS');
create type tipo_recurso   as enum ('ALOJAMIENTO', 'ACTIVIDAD', 'TRANSPORTE');
create type unidad_costo   as enum ('HABITACION_NOCHE', 'PERSONA', 'SERVICIO');
create type franja_horaria as enum ('MANANA', 'TARDE', 'NOCHE');

-- Administrador (HU01). Las cuentas las crea la empresa: no hay registro público.
create table administradores (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  correo          text not null unique,
  contrasena_hash text not null,
  creado_en       timestamptz not null default now()
);

-- Destino (HU07)
create table destinos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  pais        text not null,
  descripcion text,
  creado_en   timestamptz not null default now(),
  unique (nombre, pais)
);

-- Recurso: Alojamiento, Actividad y Transporte comparten estructura (HU08)
create table recursos (
  id                   uuid primary key default gen_random_uuid(),
  destino_id           uuid not null references destinos(id),
  tipo                 tipo_recurso not null,
  nombre               text not null,
  descripcion          text,
  costo_referencia_cop numeric(14,2) not null check (costo_referencia_cop >= 0),
  unidad               unidad_costo not null,
  creado_en            timestamptz not null default now(),
  -- unidad fija por tipo
  check ((tipo = 'ALOJAMIENTO' and unidad = 'HABITACION_NOCHE')
      or (tipo = 'ACTIVIDAD'   and unidad = 'PERSONA')
      or (tipo = 'TRANSPORTE'  and unidad = 'SERVICIO'))
);
create index on recursos (destino_id, tipo);

-- PlanTuristico (HU03, HU04, HU12, HU13). Solo el nombre es obligatorio en un borrador.
create table planes (
  id                          uuid primary key default gen_random_uuid(),
  nombre                      text not null check (length(trim(nombre)) > 0),
  descripcion                 text,
  destino_id                  uuid references destinos(id),
  duracion_dias               int check (duracion_dias > 0),
  noches                      int check (noches >= 0),
  numero_viajeros             int check (numero_viajeros > 0),
  tipo_viajero                tipo_viajero,
  presupuesto_por_persona_cop numeric(14,2) check (presupuesto_por_persona_cop >= 0),
  estado                      estado_plan not null default 'BORRADOR',
  incluye                     text,
  no_incluye                  text,
  recomendaciones             text,
  origen_ia                   boolean not null default false,
  administrador_id            uuid references administradores(id),
  creado_en                   timestamptz not null default now(),
  actualizado_en              timestamptz not null default now()
);
create index on planes (estado);
create index on planes (destino_id);

-- DiaItinerario (composición con el plan)
create table dias_itinerario (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references planes(id) on delete cascade,
  numero_dia int not null check (numero_dia > 0),
  unique (plan_id, numero_dia)
);

-- ActividadProgramada (composición con el día; referencia una Actividad del catálogo)
create table actividades_programadas (
  id         uuid primary key default gen_random_uuid(),
  dia_id     uuid not null references dias_itinerario(id) on delete cascade,
  recurso_id uuid not null references recursos(id),
  franja     franja_horaria not null,
  orden      int not null default 0 check (orden >= 0)
);
create index on actividades_programadas (dia_id);

-- ConceptoCosto (HU06). El costo unitario es una COPIA de la tarifa del catálogo:
-- si el catálogo cambia, los planes ya guardados no se alteran.
create table conceptos_costo (
  id                 uuid primary key default gen_random_uuid(),
  plan_id            uuid not null references planes(id) on delete cascade,
  recurso_id         uuid references recursos(id),
  descripcion        text not null,
  cantidad           numeric(14,2) not null check (cantidad >= 0),
  unidad             unidad_costo not null,
  costo_unitario_cop numeric(14,2) not null check (costo_unitario_cop >= 0)
);
create index on conceptos_costo (plan_id);

-- Seguridad: solo el backend (clave de servicio) accede a los datos.
-- Con RLS activado y sin políticas, la API pública de Supabase (anon) no puede leer ni escribir.
alter table administradores         enable row level security;
alter table destinos                enable row level security;
alter table recursos                enable row level security;
alter table planes                  enable row level security;
alter table dias_itinerario         enable row level security;
alter table actividades_programadas enable row level security;
alter table conceptos_costo         enable row level security;
