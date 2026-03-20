-- PASSO 2: Rode este script DEPOIS do passo 1
-- Cria a função, trigger e backfill dos agendamentos existentes

-- 1. Função
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
DECLARE
  appt_utc TIMESTAMP;
BEGIN
  appt_utc := (
    (NEW.date::text || ' ' || NEW.start_time::text)::timestamp
    AT TIME ZONE 'America/Sao_Paulo'
  ) AT TIME ZONE 'UTC';

  DELETE FROM appointment_reminders
    WHERE appointment_id = NEW.id AND status = 'pending';

  INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
  VALUES (NEW.id, '48h', 'whatsapp', appt_utc - INTERVAL '48 hours', 'pending');

  INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
  VALUES (NEW.id, '24h', 'whatsapp', appt_utc - INTERVAL '24 hours', 'pending');

  INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
  VALUES (NEW.id, '5h', 'whatsapp', appt_utc - INTERVAL '5 hours', 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger
DROP TRIGGER IF EXISTS trg_create_appointment_reminders ON appointments;

CREATE TRIGGER trg_create_appointment_reminders
  AFTER INSERT OR UPDATE OF date, start_time ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_reminders();

-- 3. Backfill agendamentos existentes
DO $$
DECLARE
  apt RECORD;
  appt_utc TIMESTAMP;
  existing_count INT;
BEGIN
  FOR apt IN
    SELECT id, date, start_time FROM appointments WHERE start_time IS NOT NULL
  LOOP
    SELECT COUNT(*) INTO existing_count FROM appointment_reminders
      WHERE appointment_id = apt.id AND type IN ('48h', '24h', '5h');

    IF existing_count = 0 THEN
      appt_utc := (
        (apt.date::text || ' ' || apt.start_time::text)::timestamp
        AT TIME ZONE 'America/Sao_Paulo'
      ) AT TIME ZONE 'UTC';

      INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
      VALUES
        (apt.id, '48h', 'whatsapp', appt_utc - INTERVAL '48 hours', 'pending'),
        (apt.id, '24h', 'whatsapp', appt_utc - INTERVAL '24 hours', 'pending'),
        (apt.id, '5h',  'whatsapp', appt_utc - INTERVAL '5 hours',  'pending');
    END IF;
  END LOOP;
END;
$$;

-- 4. Conferência
SELECT
  ar.type,
  ar.status,
  (ar.scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::text AS scheduled_brt,
  a.date AS appt_date,
  a.start_time AS appt_time,
  p.name AS patient_name
FROM appointment_reminders ar
JOIN appointments a ON a.id = ar.appointment_id
LEFT JOIN patients p ON p.id = a.patient_id
WHERE ar.type IN ('48h', '24h', '5h')
ORDER BY ar.scheduled_at;
