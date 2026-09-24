-- =====================================================================
-- Un Gol de Closs — categorías por región
-- ---------------------------------------------------------------------
-- libertadores → sudamerica · champions → europa · mundial → selecciones
-- Solo hace falta en bases creadas con la versión anterior de la
-- migración inicial. En una base nueva no cambia nada.
-- =====================================================================

begin;

alter table public.relatos         drop constraint if exists relatos_categoria_check;
alter table public.puzzles_diarios drop constraint if exists puzzles_diarios_categoria_check;

update public.relatos set categoria = case categoria
  when 'libertadores' then 'sudamerica'
  when 'champions'    then 'europa'
  when 'mundial'      then 'selecciones'
  else categoria
end;

-- El trigger de puzzles_diarios valida contra relatos, que ya está actualizado.
update public.puzzles_diarios set categoria = case categoria
  when 'libertadores' then 'sudamerica'
  when 'champions'    then 'europa'
  when 'mundial'      then 'selecciones'
  else categoria
end;

alter table public.relatos
  add constraint relatos_categoria_check
  check (categoria in ('europa', 'sudamerica', 'selecciones'));

alter table public.puzzles_diarios
  add constraint puzzles_diarios_categoria_check
  check (categoria in ('europa', 'sudamerica', 'selecciones'));

commit;
