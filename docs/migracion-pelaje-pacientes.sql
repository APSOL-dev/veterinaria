-- Migración del pelaje de los pacientes: de alerts ("Pelaje: X") a la columna coat.
-- Estado: el paso 1 YA SE APLICÓ en producción. Los pasos 2 y 3 están pendientes y los ejecuta una persona del equipo.

-- 1) [APLICADO] Columna nueva
ALTER TABLE public.vetsoft_pacientes ADD COLUMN IF NOT EXISTS coat TEXT;

-- 2a) [PENDIENTE] Verificación previa, solo lectura: qué pacientes se van a actualizar y con qué valor.
--     Revisar la cantidad y una muestra antes de correr el paso 2b.
SELECT count(*) AS pacientes_a_actualizar
FROM public.vetsoft_pacientes p
WHERE p.coat IS NULL
  AND EXISTS (SELECT 1 FROM unnest(p.alerts) AS x WHERE x ~* '^\s*pelaje\s*:');

SELECT p.id, p.name,
       btrim(regexp_replace((SELECT x FROM unnest(p.alerts) AS x WHERE x ~* '^\s*pelaje\s*:' LIMIT 1), '^\s*pelaje\s*:\s*', '', 'i')) AS coat_que_se_copiaria
FROM public.vetsoft_pacientes p
WHERE p.coat IS NULL
  AND EXISTS (SELECT 1 FROM unnest(p.alerts) AS x WHERE x ~* '^\s*pelaje\s*:')
ORDER BY p.name
LIMIT 20;

-- 2b) [PENDIENTE] Copiar el pelaje existente a la columna nueva (no borra nada de alerts).
--     Se recomienda correrlo dentro de una transacción: BEGIN; <UPDATE>; verificar con 2c; COMMIT; (o ROLLBACK; si algo no cierra).
BEGIN;
UPDATE public.vetsoft_pacientes p
SET coat = btrim(regexp_replace(a.item, '^\s*pelaje\s*:\s*', '', 'i'))
FROM (
  SELECT id, (SELECT x FROM unnest(alerts) AS x WHERE x ~* '^\s*pelaje\s*:' LIMIT 1) AS item
  FROM public.vetsoft_pacientes
) a
WHERE p.id = a.id AND a.item IS NOT NULL AND p.coat IS NULL;

-- 2c) Verificación posterior (antes del COMMIT): el total con coat debe coincidir con pacientes_a_actualizar de 2a,
--     y alerts no debe haber cambiado.
SELECT count(*) FILTER (WHERE coat IS NOT NULL) AS con_coat,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM unnest(alerts) AS x WHERE x ~* '^\s*pelaje\s*:')) AS con_pelaje_en_alerts
FROM public.vetsoft_pacientes;
-- Si los números cierran:  COMMIT;   Si no:  ROLLBACK;

-- 3) [PENDIENTE] Exponer coat en la vista que lee la app.
-- La vista real puede tener más columnas que el doc esquema-tablas-y-vistas-sql.md (por ejemplo required_vaccines y weight_history).
-- Copiar la definición vigente (Supabase > Database > Views > vetsoft_vw_pacientes) y agregar al final: , coat
-- Ejemplo con la definición documentada:
-- CREATE OR REPLACE VIEW public.vetsoft_vw_pacientes AS
-- SELECT id, owner_id AS "ownerId", name, species, breed, sex, TO_CHAR(birth_date, 'YYYY-MM-DD') AS "birthDate",
--        photo_url AS "photoUrl", status, weight_kg AS "weightKg", alerts, created_at AS "createdAt", coat
-- FROM public.vetsoft_pacientes;
