-- =====================================================================
-- Un Gol de Closs — seed de ejemplo (datos PLACEHOLDER)
-- ---------------------------------------------------------------------
-- Los relatos apuntan a archivos seed/relato-XX.mp3 en el bucket "relatos",
-- que NO vienen incluidos. Opciones:
--   a) Subí mp3 con esos nombres al bucket (Storage → relatos → carpeta seed/)
--   b) Editá cada relato desde /admin y subí el audio real.
-- Para que el audio no delate la respuesta, en producción usá nombres
-- neutros (el admin genera UUIDs automáticamente).
-- Cada categoría necesita al menos 1 relato activo para tener puzzle diario.
-- =====================================================================

insert into public.relatos
  (categoria, jugador, equipo, rival, competicion, anio, source_type, audio_path, start_seconds)
values
  ('europa',      'Jugador Uno',    'Equipo A',    'Equipo B',    'LaLiga',                    2011, 'file', 'seed/relato-01.mp3', 0),
  ('europa',      'Jugador Dos',    'Equipo A',    'Equipo C',    'Champions League — Final',  2014, 'file', 'seed/relato-02.mp3', 0),
  ('europa',      'Jugador Tres',   'Equipo D',    'Equipo E',    'Premier League',            2016, 'file', 'seed/relato-03.mp3', 0),
  ('europa',      'Jugador Cuatro', 'Equipo F',    'Equipo A',    'Serie A',                   2019, 'file', 'seed/relato-04.mp3', 0),
  ('sudamerica',  'Jugador Cinco',  'Equipo G',    'Equipo H',    'Copa Libertadores — Final', 2005, 'file', 'seed/relato-05.mp3', 0),
  ('sudamerica',  'Jugador Seis',   'Equipo G',    'Equipo I',    'Copa Sudamericana',         2012, 'file', 'seed/relato-06.mp3', 0),
  ('sudamerica',  'Jugador Siete',  'Equipo J',    'Equipo K',    'Liga Profesional',          2018, 'file', 'seed/relato-07.mp3', 0),
  ('selecciones', 'Jugador Ocho',   'Selección L', 'Selección M', 'Mundial — Fase de grupos',  2006, 'file', 'seed/relato-08.mp3', 0),
  ('selecciones', 'Jugador Nueve',  'Selección L', 'Selección N', 'Copa América',              2015, 'file', 'seed/relato-09.mp3', 0),
  ('selecciones', 'Jugador Diez',   'Selección O', 'Selección P', 'Mundial — Final',           2022, 'file', 'seed/relato-10.mp3', 0);
