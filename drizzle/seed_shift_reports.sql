-- ==============================================================================
-- CERÁMICA PRODUCCIÓN ERP - Carga de 7 Días de Historial de Producción
-- Fechas: 2026-11-07 al 2026-11-13
-- ==============================================================================

DO $$
DECLARE
  v_report_id integer;
  v_user_manana_id integer;
  v_user_tarde_id integer;
  v_user_noche_id integer;
  v_h12_id integer;
  v_h18_id integer;
  v_p18_id integer;
BEGIN
  -- Obtener IDs reales de usuarios
  SELECT id INTO v_user_manana_id FROM users WHERE username = 'capataz.manana' LIMIT 1;
  SELECT id INTO v_user_tarde_id FROM users WHERE username = 'capataz.tarde' LIMIT 1;
  SELECT id INTO v_user_noche_id FROM users WHERE username = 'capataz.noche' LIMIT 1;

  -- Obtener IDs reales de ladrillos
  SELECT id INTO v_h12_id FROM brick_types WHERE code = 'H12' LIMIT 1;
  SELECT id INTO v_h18_id FROM brick_types WHERE code = 'H18' LIMIT 1;
  SELECT id INTO v_p18_id FROM brick_types WHERE code = 'P18' LIMIT 1;

  -- 2026-11-07 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-07', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'AUDITADO', 4670, 105.5, 9, 7, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 40, 12800, 78.08);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 38, 12160, 74.18);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h18_id, 8, 2560, 15.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 30, 9600, 58.56);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 15, 14400, 87.84);
  END IF;

  -- 2026-11-07 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-07', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'AUDITADO', 4900, 107, 8, 5, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 40, 12800, 78.08);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 39, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h18_id, 6, 1920, 11.71);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 32, 10240, 62.46);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 14, 13440, 81.98);
  END IF;

  -- 2026-11-07 - Turno NOCHE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-07', 'NOCHE', v_user_noche_id, 'Miguel Sánchez (Capataz Noche)', 'AUDITADO', 4790, 0, 1, 0, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 2, 640, 3.9);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 20, 6400, 39.04);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 26, 8320, 50.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 13, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 9, 8640, 52.7);
  END IF;

  -- 2026-11-08 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-08', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'AUDITADO', 4850, 118.5, 9, 6, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_p18_id, 42, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_p18_id, 40, 12000, 90);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_p18_id, 8, 2400, 18);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_p18_id, 32, 9600, 72);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_p18_id, 15, 13500, 101.25);
  END IF;

  -- 2026-11-08 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-08', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'AUDITADO', 4630, 87.5, 7, 6, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_p18_id, 37, 11100, 83.25);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_p18_id, 36, 10800, 81);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_p18_id, 6, 1800, 13.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_p18_id, 29, 8700, 65.25);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_p18_id, 13, 11700, 87.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_p18_id, 13, 11700, 87.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_p18_id, 13, 11700, 87.75);
  END IF;

  -- 2026-11-08 - Turno NOCHE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-08', 'NOCHE', v_user_noche_id, 'Miguel Sánchez (Capataz Noche)', 'AUDITADO', 4520, 0, 0, 1, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_p18_id, 17, 5100, 38.25);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_p18_id, 23, 6900, 51.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_p18_id, 12, 10800, 81);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_p18_id, 13, 11700, 87.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_p18_id, 8, 7200, 54);
  END IF;

  -- 2026-11-09 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-09', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'AUDITADO', 5030, 131.5, 10, 6, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h12_id, 44, 21120, 88.7);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h12_id, 42, 20160, 84.67);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h12_id, 8, 3840, 16.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h12_id, 34, 16320, 68.54);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h12_id, 15, 21600, 90.72);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h12_id, 15, 21600, 90.72);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h12_id, 16, 23040, 96.77);
  END IF;

  -- 2026-11-09 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-09', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'AUDITADO', 4810, 100.5, 8, 5, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h12_id, 39, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h12_id, 38, 18240, 76.61);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h12_id, 6, 2880, 12.1);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h12_id, 31, 14880, 62.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h12_id, 13, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h12_id, 13, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h12_id, 14, 20160, 84.67);
  END IF;

  -- 2026-11-09 - Turno NOCHE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-09', 'NOCHE', v_user_noche_id, 'Miguel Sánchez (Capataz Noche)', 'AUDITADO', 4700, 0, 1, 0, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h12_id, 1, 480, 2.02);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h12_id, 19, 9120, 38.3);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h12_id, 25, 12000, 50.4);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h12_id, 12, 17280, 72.58);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h12_id, 13, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h12_id, 9, 12960, 54.43);
  END IF;

  -- 2026-11-10 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-10', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'AUDITADO', 4760, 112, 9, 7, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 41, 13120, 80.03);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 39, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h18_id, 8, 2560, 15.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 31, 9920, 60.51);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 15, 14400, 87.84);
  END IF;

  -- 2026-11-10 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-10', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'AUDITADO', 4540, 81, 7, 6, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 36, 11520, 70.27);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 35, 11200, 68.32);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h18_id, 6, 1920, 11.71);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 28, 8960, 54.66);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 13, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 13, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 13, 12480, 76.13);
  END IF;

  -- 2026-11-10 - Turno NOCHE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-10', 'NOCHE', v_user_noche_id, 'Miguel Sánchez (Capataz Noche)', 'AUDITADO', 4430, 0, 0, 1, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 16, 5120, 31.23);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 22, 7040, 42.94);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 12, 11520, 70.27);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 13, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 8, 7680, 46.85);
  END IF;

  -- 2026-11-11 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-11', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'AUDITADO', 4940, 125, 10, 6, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h12_id, 43, 20640, 86.69);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h12_id, 41, 19680, 82.66);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h12_id, 8, 3840, 16.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h12_id, 33, 15840, 66.53);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h12_id, 14, 20160, 84.67);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h12_id, 14, 20160, 84.67);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h12_id, 16, 23040, 96.77);
  END IF;

  -- 2026-11-11 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-11', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'AUDITADO', 4720, 94, 7, 5, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h12_id, 38, 18240, 76.61);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h12_id, 37, 17760, 74.59);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h12_id, 6, 2880, 12.1);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h12_id, 30, 14400, 60.48);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h12_id, 13, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h12_id, 13, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h12_id, 13, 18720, 78.62);
  END IF;

  -- 2026-11-11 - Turno NOCHE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-11', 'NOCHE', v_user_noche_id, 'Miguel Sánchez (Capataz Noche)', 'AUDITADO', 4610, 0, 0, 0, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h12_id, 18, 8640, 36.29);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h12_id, 24, 11520, 48.38);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h12_id, 12, 17280, 72.58);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h12_id, 13, 18720, 78.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h12_id, 8, 11520, 48.38);
  END IF;

  -- 2026-11-12 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-12', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'CERRADO', 4670, 105.5, 9, 7, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_p18_id, 40, 12000, 90);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_p18_id, 38, 11400, 85.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_p18_id, 8, 2400, 18);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_p18_id, 30, 9000, 67.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_p18_id, 15, 13500, 101.25);
  END IF;

  -- 2026-11-12 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-12', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'CERRADO', 4900, 107, 8, 5, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_p18_id, 40, 12000, 90);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_p18_id, 39, 11700, 87.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_p18_id, 6, 1800, 13.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_p18_id, 32, 9600, 72);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_p18_id, 14, 12600, 94.5);
  END IF;

  -- 2026-11-12 - Turno NOCHE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-12', 'NOCHE', v_user_noche_id, 'Miguel Sánchez (Capataz Noche)', 'CERRADO', 4790, 0, 1, 0, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_p18_id, 2, 600, 4.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_p18_id, 20, 6000, 45);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_p18_id, 26, 7800, 58.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_p18_id, 13, 11700, 87.75);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_p18_id, 14, 12600, 94.5);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_p18_id, 9, 8100, 60.75);
  END IF;

  -- 2026-11-13 - Turno MANANA
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-13', 'MANANA', v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'CERRADO', 4850, 118.5, 9, 6, 'Producción normal sin paradas mecánicas relevantes.', NOW())
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 42, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 40, 12800, 78.08);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h18_id, 8, 2560, 15.62);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 32, 10240, 62.46);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 14, 13440, 81.98);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 15, 14400, 87.84);
  END IF;

  -- 2026-11-13 - Turno TARDE
  INSERT INTO shift_reports (production_date, shift, foreman_id, foreman_name, status, gas_consumption, dispatched_tons, black_earth_trips, red_earth_trips, notes, closed_at)
  VALUES ('2026-11-13', 'TARDE', v_user_tarde_id, 'Carlos Díaz (Capataz Tarde)', 'EN_CURSO', 4630, 87.5, 7, 6, 'Turno en curso. Carga de robot operando normal.', NULL)
  ON CONFLICT (production_date, shift) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NOT NULL THEN
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'EXTRUSORA', v_h18_id, 37, 11840, 72.22);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'SECADERO', v_h18_id, 36, 11520, 70.27);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_MANUAL', v_h18_id, 6, 1920, 11.71);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'CARGA_ROBOT', v_h18_id, 29, 9280, 56.61);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_CARGADAS', v_h18_id, 13, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'HORNO_FUERA', v_h18_id, 13, 12480, 76.13);
    INSERT INTO shift_stage_entries (shift_report_id, stage, brick_type_id, quantity, estimated_units, estimated_tons)
    VALUES (v_report_id, 'DESCARGA', v_h18_id, 13, 12480, 76.13);
  END IF;

  -- Registro en bitácora de auditoría
  INSERT INTO audit_logs (user_id, user_name, action, entity, details)
  VALUES (v_user_manana_id, 'Roberto Gómez (Capataz Mañana)', 'SEED_INIT', 'SYSTEM', 'Inicialización de 7 días de turnos de producción histórica.');

END $$;
