-- PASSO 1: Rode este script SOZINHO primeiro
-- Adiciona os novos tipos ao enum ReminderType
ALTER TYPE "ReminderType" ADD VALUE IF NOT EXISTS '48h';
ALTER TYPE "ReminderType" ADD VALUE IF NOT EXISTS '24h';
ALTER TYPE "ReminderType" ADD VALUE IF NOT EXISTS '5h';
