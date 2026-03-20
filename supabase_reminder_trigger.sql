-- ============================================================
-- FLOREN | Criação automática de lembretes de agendamento
-- Executa no Supabase SQL Editor
-- ============================================================

-- 0. Adiciona novos valores ao enum ReminderType (se não existirem)
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '48h'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ReminderType')) THEN
    ALTER TYPE "ReminderType" ADD VALUE '48h';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '24h'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ReminderType')) THEN
    ALTER TYPE "ReminderType" ADD VALUE '24h';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '5h'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ReminderType')) THEN
    ALTER TYPE "ReminderType" ADD VALUE '5h';
  END IF;
END;
$$;

-- 1. Função que cria os 3 lembretes para um agendamento
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
DECLARE
  appt_utc TIMESTAMP;
BEGIN
  -- Converte date + start_time de BRT (America/Sao_Paulo) para UTC
  appt_utc := (
    (NEW.date::text || ' ' || NEW.start_time::text)::timestamp
    AT TIME ZONE 'America/Sao_Paulo'
  ) AT TIME ZONE 'UTC';

  -- Remove lembretes antigos pendentes para evitar duplicatas em UPDATE
  DELETE FROM appointment_reminders
    WHERE appointment_id = NEW.id AND status = 'pending';

  -- Insere lembrete 48h antes
  INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
  VALUES (NEW.id, '48h', 'whatsapp', appt_utc - INTERVAL '48 hours', 'pending');

  -- Insere lembrete 24h antes
  INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
  VALUES (NEW.id, '24h', 'whatsapp', appt_utc - INTERVAL '24 hours', 'pending');

  -- Insere lembrete 5h antes
  INSERT INTO appointment_reminders (appointment_id, type, channel, scheduled_at, status)
  VALUES (NEW.id, '5h', 'whatsapp', appt_utc - INTERVAL '5 hours', 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: dispara em INSERT e UPDATE (date/start_time)
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS trg_create_appointment_reminders ON appointments;

CREATE TRIGGER trg_create_appointment_reminders
  AFTER INSERT OR UPDATE OF date, start_time ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_reminders();

-- 3. Backfill: cria lembretes para agendamentos existentes sem lembrete 48h/24h/5h
-- -------------------------------------------------------
DO $$
DECLARE
  apt RECORD;
  appt_utc TIMESTAMP;
  existing_count INT;
BEGIN
  FOR apt IN
    SELECT id, date, start_time
    FROM appointments
    WHERE start_time IS NOT NULL
  LOOP
    -- Verifica se já tem lembretes do novo formato
    SELECT COUNT(*) INTO existing_count
    FROM appointment_reminders
    WHERE appointment_id = apt.id
    AND type IN ('48h', '24h', '5h');

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

      RAISE NOTICE 'Lembretes criados para agendamento %', apt.id;
    END IF;
  END LOOP;
END;
$$;

-- 4. Conferência: mostra lembretes criados para os próximos 7 dias
-- -------------------------------------------------------
SELECT
  ar.type,
  ar.status,
  ar.scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' AS scheduled_brt,
  a.date AS appt_date,
  a.start_time AS appt_time,
  p.name AS patient_name
FROM appointment_reminders ar
JOIN appointments a ON a.id = ar.appointment_id
LEFT JOIN patients p ON p.id = a.patient_id
WHERE ar.type IN ('48h', '24h', '5h')
  AND ar.scheduled_at > NOW()
  AND ar.scheduled_at < NOW() + INTERVAL '7 days'
ORDER BY ar.scheduled_at;
