-- Datos de ejemplo para el Incremento 1 (recursos precargados). Costos en COP, solo de referencia.
insert into destinos (nombre, pais, descripcion) values
  ('Cartagena', 'Colombia', 'Ciudad amurallada, playas e islas del Caribe.'),
  ('San Andrés', 'Colombia', 'Isla de aguas de siete colores.'),
  ('Cancún', 'México', 'Playas del Caribe mexicano y zona arqueológica.')
on conflict do nothing;

insert into recursos (destino_id, tipo, nombre, descripcion, costo_referencia_cop, unidad)
select d.id, r.tipo::tipo_recurso, r.nombre, r.descripcion, r.costo, r.unidad::unidad_costo
from destinos d
join (values
  ('Cartagena','ALOJAMIENTO','Hotel Boutique Centro Histórico','Habitación doble con desayuno.',420000,'HABITACION_NOCHE'),
  ('Cartagena','ALOJAMIENTO','Hotel Bocagrande Mar','Frente a la playa, piscina.',360000,'HABITACION_NOCHE'),
  ('Cartagena','ACTIVIDAD','Recorrido a pie por la ciudad amurallada','Guía local, 3 horas.',65000,'PERSONA'),
  ('Cartagena','ACTIVIDAD','Día de playa en Islas del Rosario','Lancha, almuerzo y snorkel.',210000,'PERSONA'),
  ('Cartagena','ACTIVIDAD','Cena y show en Getsemaní','Gastronomía caribeña y música en vivo.',140000,'PERSONA'),
  ('Cartagena','ACTIVIDAD','Visita al Castillo San Felipe','Entrada y guía.',55000,'PERSONA'),
  ('Cartagena','TRANSPORTE','Traslado aeropuerto – hotel – aeropuerto','Vehículo privado ida y vuelta.',150000,'SERVICIO'),
  ('San Andrés','ALOJAMIENTO','Posada Nativa Sunrise','Cabaña frente al mar.',310000,'HABITACION_NOCHE'),
  ('San Andrés','ACTIVIDAD','Vuelta a la isla en carro de golf','Recorrido de medio día.',90000,'PERSONA'),
  ('San Andrés','ACTIVIDAD','Paseo en lancha a Johnny Cay','Incluye snorkel y almuerzo.',150000,'PERSONA'),
  ('San Andrés','ACTIVIDAD','Buceo en el Acuario','Equipo y guía.',120000,'PERSONA'),
  ('San Andrés','TRANSPORTE','Traslado aeropuerto – hotel – aeropuerto','Ida y vuelta.',80000,'SERVICIO'),
  ('Cancún','ALOJAMIENTO','Resort Zona Hotelera','Todo incluido.',780000,'HABITACION_NOCHE'),
  ('Cancún','ACTIVIDAD','Excursión a Chichén Itzá','Transporte, entrada y guía.',280000,'PERSONA'),
  ('Cancún','ACTIVIDAD','Isla Mujeres en catamarán','Navegación y almuerzo.',230000,'PERSONA'),
  ('Cancún','TRANSPORTE','Traslado aeropuerto – hotel – aeropuerto','Ida y vuelta.',200000,'SERVICIO')
) as r(destino, tipo, nombre, descripcion, costo, unidad) on r.destino = d.nombre
where not exists (select 1 from recursos x where x.destino_id = d.id and x.nombre = r.nombre);
